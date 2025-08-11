import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSongSchema, insertIdentificationSchema } from "@shared/schema";
import multer from "multer";
import { z } from "zod";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"));
    }
  },
});

async function identifyMusic(audioBuffer: Buffer): Promise<any> {
  const ACCESS_KEY = process.env.ACRCLOUD_ACCESS_KEY;
  const ACCESS_SECRET = process.env.ACRCLOUD_ACCESS_SECRET;
  const HOST = process.env.ACRCLOUD_HOST || "identify-eu-west-1.acrcloud.com";
  
  console.log("ACRCloud credentials exist:", !!ACCESS_KEY && !!ACCESS_SECRET);
  console.log("Audio buffer size:", audioBuffer.length);
  
  // Demo mode - return sample data if no API credentials
  if (!ACCESS_KEY || !ACCESS_SECRET) {
    console.log("Running in demo mode - no ACRCloud credentials provided");
    return {
      status: "success",
      metadata: {
        music: [{
          title: "Blinding Lights",
          artists: [{ name: "The Weeknd" }],
          album: { name: "After Hours" },
          release_date: "2019-11-29",
          score: 95,
          external_metadata: {
            spotify: {
              track: {
                id: "0VjIjW4GlULA1OgON3MzNs"
              }
            }
          }
        }]
      }
    };
  }

  // Create ACRCloud signature
  const crypto = await import("crypto");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const httpMethod = "POST";
  const httpUri = "/v1/identify";
  const dataType = "audio";
  const signatureVersion = "1";
  
  const stringToSign = httpMethod + "\n" + httpUri + "\n" + ACCESS_KEY + "\n" + dataType + "\n" + signatureVersion + "\n" + timestamp;
  const signature = crypto.createHmac('sha1', ACCESS_SECRET).update(stringToSign).digest('base64');

  const formData = new FormData();
  const audioBlob = new Blob([audioBuffer], { type: "audio/wav" });
  formData.append("sample", audioBlob, "audio.wav");
  formData.append("access_key", ACCESS_KEY);
  formData.append("data_type", dataType);
  formData.append("signature_version", signatureVersion);
  formData.append("signature", signature);
  formData.append("timestamp", timestamp);
  formData.append("sample_bytes", audioBuffer.length.toString());

  console.log("Calling ACRCloud API...");
  
  const response = await fetch(`https://${HOST}/v1/identify`, {
    method: "POST",
    body: formData,
  });

  console.log("API Response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.log("API Error response:", errorText);
    throw new Error(`ACRCloud API error: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  console.log("API Result:", JSON.stringify(result, null, 2));
  return result;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Upload and identify music
  app.post("/api/identify", upload.single("audio"), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      // Read the uploaded file
      const fs = await import("fs");
      const audioBuffer = fs.readFileSync(req.file.path);

      try {
        // Identify the music
        const identificationResult = await identifyMusic(audioBuffer);
        
        console.log("API Response:", JSON.stringify(identificationResult, null, 2));
        
        if (identificationResult.status !== "success" || !identificationResult.metadata?.music?.[0]) {
          return res.status(404).json({ 
            message: "Song not identified", 
            error: "No match found in database. Try uploading a popular song with clear audio quality.",
            apiResponse: identificationResult
          });
        }

        const musicData = identificationResult.metadata.music[0];
        
        // Create song record
        const songData = {
          title: musicData.title || "Unknown Title",
          artist: musicData.artists?.[0]?.name || "Unknown Artist",
          album: musicData.album?.name || null,
          year: musicData.release_date ? new Date(musicData.release_date).getFullYear() : null,
          genre: null,
          duration: null,
          spotifyUrl: musicData.external_metadata?.spotify?.track?.id ? 
            `https://open.spotify.com/track/${musicData.external_metadata.spotify.track.id}` : null,
          youtubeUrl: null,
          albumArt: null,
        };

        const song = await storage.createSong(songData);

        // Create identification record
        const identification = await storage.createIdentification({
          songId: song.id,
          filename: req.file.originalname,
          confidence: musicData.score || 95,
        });

        const result = await storage.getIdentificationWithSong(identification.id);
        
        res.json(result);
      } catch (apiError: any) {
        console.error("Music identification API error:", apiError);
        res.status(500).json({ 
          message: "Music identification service unavailable", 
          error: apiError.message 
        });
      } finally {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
      }
    } catch (error: any) {
      console.error("Identification error:", error);
      res.status(500).json({ message: "Identification failed", error: error.message });
    }
  });

  // Get recent identifications
  app.get("/api/identifications", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const identifications = await storage.getRecentIdentifications(limit);
      res.json(identifications);
    } catch (error: any) {
      console.error("Get identifications error:", error);
      res.status(500).json({ message: "Failed to retrieve identifications", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
