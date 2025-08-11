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
  const API_KEY = process.env.AUDD_API_KEY || process.env.MUSIC_API_KEY || "";
  
  console.log("API Key exists:", !!API_KEY);
  console.log("Audio buffer size:", audioBuffer.length);
  
  if (!API_KEY) {
    throw new Error("Music identification API key not configured");
  }

  const formData = new FormData();
  const audioBlob = new Blob([audioBuffer], { type: "audio/wav" });
  formData.append("file", audioBlob, "audio.wav");
  formData.append("api_token", API_KEY);

  console.log("Calling AudD.io API...");
  
  const response = await fetch("https://api.audd.io/", {
    method: "POST",
    body: formData,
  });

  console.log("API Response status:", response.status);
  console.log("API Response headers:", Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.log("API Error response:", errorText);
    throw new Error(`Music identification API error: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  console.log("API Result:", result);
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
        
        if (identificationResult.status !== "success" || !identificationResult.result) {
          return res.status(404).json({ 
            message: "Song not identified", 
            error: "No match found in database. Try uploading a popular song with clear audio quality.",
            apiResponse: identificationResult
          });
        }

        const musicData = identificationResult.result;
        
        // Create song record
        const songData = {
          title: musicData.title || "Unknown Title",
          artist: musicData.artist || "Unknown Artist",
          album: musicData.album || null,
          year: musicData.release_date ? new Date(musicData.release_date).getFullYear() : null,
          genre: null,
          duration: musicData.song_link ? null : null,
          spotifyUrl: musicData.spotify?.external_urls?.spotify || null,
          youtubeUrl: null,
          albumArt: musicData.spotify?.album?.images?.[0]?.url || null,
        };

        const song = await storage.createSong(songData);

        // Create identification record
        const identification = await storage.createIdentification({
          songId: song.id,
          filename: req.file.originalname,
          confidence: (identificationResult.result?.score || 0.9) * 100,
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
