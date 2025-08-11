import { type Song, type InsertSong, type Identification, type InsertIdentification, type IdentificationResult } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createSong(song: InsertSong): Promise<Song>;
  getSong(id: string): Promise<Song | undefined>;
  createIdentification(identification: InsertIdentification): Promise<Identification>;
  getIdentificationWithSong(id: string): Promise<IdentificationResult | undefined>;
  getRecentIdentifications(limit?: number): Promise<IdentificationResult[]>;
}

export class MemStorage implements IStorage {
  private songs: Map<string, Song>;
  private identifications: Map<string, Identification>;

  constructor() {
    this.songs = new Map();
    this.identifications = new Map();
  }

  async createSong(insertSong: InsertSong): Promise<Song> {
    const id = randomUUID();
    const song: Song = {
      ...insertSong,
      id,
      createdAt: new Date(),
    };
    this.songs.set(id, song);
    return song;
  }

  async getSong(id: string): Promise<Song | undefined> {
    return this.songs.get(id);
  }

  async createIdentification(insertIdentification: InsertIdentification): Promise<Identification> {
    const id = randomUUID();
    const identification: Identification = {
      ...insertIdentification,
      id,
      createdAt: new Date(),
    };
    this.identifications.set(id, identification);
    return identification;
  }

  async getIdentificationWithSong(id: string): Promise<IdentificationResult | undefined> {
    const identification = this.identifications.get(id);
    if (!identification || !identification.songId) return undefined;
    
    const song = await this.getSong(identification.songId);
    if (!song) return undefined;

    return { ...identification, song };
  }

  async getRecentIdentifications(limit = 10): Promise<IdentificationResult[]> {
    const identifications = Array.from(this.identifications.values())
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit);

    const results: IdentificationResult[] = [];
    for (const identification of identifications) {
      if (identification.songId) {
        const song = await this.getSong(identification.songId);
        if (song) {
          results.push({ ...identification, song });
        }
      }
    }
    return results;
  }
}

export const storage = new MemStorage();
