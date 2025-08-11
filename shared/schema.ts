import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const songs = pgTable("songs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album"),
  year: integer("year"),
  genre: text("genre"),
  duration: text("duration"),
  spotifyUrl: text("spotify_url"),
  youtubeUrl: text("youtube_url"),
  albumArt: text("album_art"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const identifications = pgTable("identifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  songId: varchar("song_id").references(() => songs.id),
  filename: text("filename").notNull(),
  confidence: real("confidence").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSongSchema = createInsertSchema(songs).omit({
  id: true,
  createdAt: true,
});

export const insertIdentificationSchema = createInsertSchema(identifications).omit({
  id: true,
  createdAt: true,
});

export type InsertSong = z.infer<typeof insertSongSchema>;
export type Song = typeof songs.$inferSelect;
export type InsertIdentification = z.infer<typeof insertIdentificationSchema>;
export type Identification = typeof identifications.$inferSelect;

export type IdentificationResult = Identification & {
  song: Song;
};
