import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Search, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Waveform from "./waveform";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { IdentificationResult } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface AudioPlayerProps {
  audioFile: File;
  audioUrl: string;
  onIdentificationComplete: (result: IdentificationResult) => void;
}

export default function AudioPlayer({
  audioFile,
  audioUrl,
  onIdentificationComplete,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const identifyMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("audio", file);
      
      const response = await apiRequest("POST", "/api/identify", formData);
      return response.json();
    },
    onSuccess: (result: IdentificationResult) => {
      onIdentificationComplete(result);
      toast({
        title: "Song Identified!",
        description: `Found: ${result.song.title} by ${result.song.artist}`,
      });
    },
    onError: (error: any) => {
      console.error("Identification failed:", error);
      toast({
        title: "Identification Failed",
        description: error.message || "Could not identify the song. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleIdentify = () => {
    identifyMutation.mutate(audioFile);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-dark-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Now Playing</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <audio ref={audioRef} src={audioUrl} />

      {/* Waveform Visualization */}
      <Waveform isPlaying={isPlaying} />

      {/* Audio Controls */}
      <div className="flex items-center justify-center space-x-6 mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <SkipBack size={24} />
        </Button>
        <Button
          onClick={togglePlayPause}
          className="w-12 h-12 bg-gradient-to-r from-spotify-green to-coral rounded-full flex items-center justify-center hover:scale-110 transition-transform"
        >
          {isPlaying ? (
            <Pause className="text-white text-lg" size={20} />
          ) : (
            <Play className="text-white text-lg ml-1" size={20} />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <SkipForward size={24} />
        </Button>
      </div>

      {/* Identify Button */}
      <Button
        onClick={handleIdentify}
        disabled={identifyMutation.isPending}
        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105"
      >
        {identifyMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Identifying...
          </>
        ) : identifyMutation.isSuccess ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Identified!
          </>
        ) : (
          <>
            <Search className="mr-2 h-4 w-4" />
            Identify This Song
          </>
        )}
      </Button>
    </div>
  );
}
