import { useCallback } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      const audioFile = files.find((file) => file.type.startsWith("audio/"));
      
      if (audioFile && audioFile.size <= 10 * 1024 * 1024) { // 10MB limit
        onFileSelect(audioFile);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type.startsWith("audio/") && file.size <= 10 * 1024 * 1024) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div
      className="bg-dark-card rounded-2xl p-8 border-2 border-dashed border-gray-600 hover:border-spotify-green transition-colors cursor-pointer group"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => document.getElementById("audio-upload")?.click()}
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-spotify-green to-coral rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
          <Upload className="text-white text-2xl" size={32} />
        </div>
        <h3 className="text-xl font-semibold mb-2">Drop your audio file here</h3>
        <p className="text-gray-400 mb-4">or click to browse</p>
        <p className="text-sm text-gray-500">Supports MP3, WAV, FLAC, M4A (Max 10MB)</p>
        <input
          id="audio-upload"
          type="file"
          className="hidden"
          accept="audio/*"
          onChange={handleFileInput}
        />
      </div>
    </div>
  );
}
