import { Music, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IdentificationResult } from "@shared/schema";

interface SongResultProps {
  result: IdentificationResult;
}

export default function SongResult({ result }: SongResultProps) {
  const { song } = result;

  return (
    <div className="bg-dark-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Song Information</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-spotify-green rounded-full animate-pulse"></div>
          <span className="text-sm text-spotify-green">Identified</span>
        </div>
      </div>

      {/* Song Details */}
      <div className="flex space-x-4 mb-6">
        {/* Album cover placeholder */}
        <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex-shrink-0 flex items-center justify-center">
          {song.albumArt ? (
            <img
              src={song.albumArt}
              alt={song.album || "Album cover"}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Music className="text-white text-2xl" size={32} />
          )}
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold mb-1">{song.title}</h4>
          <p className="text-coral mb-1">{song.artist}</p>
          {song.album && <p className="text-gray-400 text-sm">{song.album}</p>}
          <div className="flex items-center mt-2 space-x-4 text-sm text-gray-400">
            {song.year && <span>{song.year}</span>}
            {song.genre && <span>{song.genre}</span>}
            {song.duration && <span>{song.duration}</span>}
          </div>
        </div>
      </div>

      {/* Confidence Score */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Match Confidence</span>
          <span className="text-spotify-green font-semibold">
            {Math.round(result.confidence)}%
          </span>
        </div>
        <div className="w-full bg-dark-bg rounded-full h-2">
          <div
            className="bg-gradient-to-r from-spotify-green to-coral h-2 rounded-full"
            style={{ width: `${result.confidence}%` }}
          ></div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {song.spotifyUrl ? (
          <Button
            variant="secondary"
            className="bg-dark-hover hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            onClick={() => window.open(song.spotifyUrl!, "_blank")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Spotify
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="bg-dark-hover hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            disabled
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Spotify
          </Button>
        )}
        {song.youtubeUrl ? (
          <Button
            variant="secondary"
            className="bg-dark-hover hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            onClick={() => window.open(song.youtubeUrl!, "_blank")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            YouTube
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="bg-dark-hover hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            disabled
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            YouTube
          </Button>
        )}
      </div>
    </div>
  );
}
