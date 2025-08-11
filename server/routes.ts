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
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  console.log("Audio buffer size:", audioBuffer.length);
  console.log("RapidAPI key exists:", !!RAPIDAPI_KEY);
  
  if (RAPIDAPI_KEY) {
    // Try APIs that support file upload with your RapidAPI subscription
    const apis = [
      {
        name: "Shazam Core",
        url: "https://shazam-core.p.rapidapi.com/v1/tracks/recognize",
        host: "shazam-core.p.rapidapi.com",
        processor: (result: any) => {
          if (result?.track) {
            return {
              title: result.track.title || "Unknown Title",
              artists: [{ name: result.track.subtitle || "Unknown Artist" }],
              album: { name: result.track.sections?.[0]?.metadata?.find((m: any) => m.title === "Album")?.text || null },
              release_date: result.track.sections?.[0]?.metadata?.find((m: any) => m.title === "Released")?.text || null,
              score: 95,
              external_metadata: { spotify: null }
            };
          }
          return null;
        }
      },
      {
        name: "Shazam Song Recognition",
        url: "https://shazam-song-recognizer.p.rapidapi.com/recognize",
        host: "shazam-song-recognizer.p.rapidapi.com",
        processor: (result: any) => {
          if (result?.matches && result.matches.length > 0) {
            const track = result.matches[0];
            return {
              title: track.title || "Unknown Title",
              artists: [{ name: track.artist || "Unknown Artist" }],
              album: { name: track.album || null },
              release_date: null,
              score: 90,
              external_metadata: { spotify: null }
            };
          }
          return null;
        }
      },
      {
        name: "AudD Recognition",
        url: "https://audd.p.rapidapi.com/",
        host: "audd.p.rapidapi.com",
        processor: (result: any) => {
          if (result?.result) {
            return {
              title: result.result.title || "Unknown Title",
              artists: [{ name: result.result.artist || "Unknown Artist" }],
              album: { name: result.result.album || null },
              release_date: result.result.release_date || null,
              score: 85,
              external_metadata: { spotify: null }
            };
          }
          return null;
        }
      }
    ];

    // Try each API in sequence
    for (const api of apis) {
      try {
        console.log(`Attempting ${api.name} API identification...`);
        
        // Optimize audio for each API
        let processedBuffer = audioBuffer;
        if (audioBuffer.length > 1024 * 1024) {
          const sampleSize = Math.min(audioBuffer.length, 800 * 1024); // 800KB max
          const startPos = Math.floor((audioBuffer.length - sampleSize) / 3); // Start from 1/3 into the song
          processedBuffer = audioBuffer.subarray(startPos, startPos + sampleSize);
          console.log("Reduced audio size for API:", processedBuffer.length);
        }

        const formData = new FormData();
        const audioBlob = new Blob([processedBuffer], { type: "audio/mpeg" });
        formData.append("file", audioBlob, "audio.mp3");
        
        // Add API token for AudD if needed
        if (api.name === "AudD Recognition") {
          formData.append("api_token", RAPIDAPI_KEY);
        }

        const response = await fetch(api.url, {
          method: "POST",
          headers: {
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": api.host
          },
          body: formData,
        });

        console.log(`${api.name} API Response status:`, response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log(`${api.name} Result:`, JSON.stringify(result, null, 2));
          
          const processedResult = api.processor(result);
          if (processedResult) {
            return {
              status: "success",
              metadata: {
                music: [processedResult]
              }
            };
          }
        } else {
          const errorText = await response.text();
          console.log(`${api.name} API error:`, response.status, errorText);
        }
      } catch (error) {
        console.log(`${api.name} API failed:`, error);
      }
    }
  }
  
  // All APIs failed - return error
  console.log("All music identification APIs failed");
  return {
    status: "error",
    message: "Could not identify the song. All music identification services are currently unavailable or returned no results."
  };
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
