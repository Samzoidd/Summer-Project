import { useState } from "react";
import { Music, Bolt, Database, TrendingUp, Menu } from "lucide-react";
import FileUpload from "@/components/file-upload";
import AudioPlayer from "@/components/audio-player";
import SongResult from "@/components/song-result";
import RecentHistory from "@/components/recent-history";
import { useQuery } from "@tanstack/react-query";
import type { IdentificationResult } from "@shared/schema";

export default function Home() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [identificationResult, setIdentificationResult] = useState<IdentificationResult | null>(null);

  const { data: recentIdentifications, refetch: refetchHistory } = useQuery({
    queryKey: ['/api/identifications'],
    enabled: true,
  });

  const handleFileSelect = (file: File) => {
    setAudioFile(file);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
  };

  const handleIdentificationComplete = (result: IdentificationResult) => {
    setIdentificationResult(result);
    refetchHistory();
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white font-inter">
      {/* Header */}
      <header className="border-b border-dark-hover">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Music className="text-white text-lg" size={20} />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-spotify-green to-coral bg-clip-text text-transparent">
                AudioHuzz
              </h1>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Home</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">History</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">About</a>
            </nav>
            <button className="md:hidden text-gray-300 hover:text-white">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-500 to-coral bg-clip-text text-transparent">
            Identify Any Song
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Upload your audio file and let our advanced AI identify the song, artist, and album information instantly.
          </p>
        </section>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <FileUpload onFileSelect={handleFileSelect} />
            
            {audioFile && audioUrl && (
              <AudioPlayer
                audioFile={audioFile}
                audioUrl={audioUrl}
                onIdentificationComplete={handleIdentificationComplete}
              />
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {identificationResult ? (
              <SongResult result={identificationResult} />
            ) : (
              <div className="bg-dark-card rounded-2xl p-6">
                <div className="text-center py-12">
                  <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-400">No Song Identified</h3>
                  <p className="text-gray-500">Upload an audio file to get started</p>
                </div>
              </div>
            )}

            <RecentHistory identifications={recentIdentifications || []} />
          </div>
        </div>

        {/* Features Section */}
        <section className="mt-16 mb-12">
          <h3 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-purple-400 to-coral bg-clip-text text-transparent">
            Why Choose AudioHuzz?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-spotify-green to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bolt className="text-white text-2xl" size={32} />
              </div>
              <h4 className="text-xl font-semibold mb-3">Lightning Fast</h4>
              <p className="text-gray-400">Identify songs in seconds with our advanced audio fingerprinting technology.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="text-white text-2xl" size={32} />
              </div>
              <h4 className="text-xl font-semibold mb-3">Massive Database</h4>
              <p className="text-gray-400">Access to millions of songs across all genres and decades.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-r from-coral to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="text-white text-2xl" size={32} />
              </div>
              <h4 className="text-xl font-semibold mb-3">High Accuracy</h4>
              <p className="text-gray-400">99%+ accuracy rate with detailed song information and metadata.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-hover mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Music className="text-white text-sm" size={16} />
              </div>
              <span className="text-gray-400">© 2024 AudioHuzz. All rights reserved.</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
