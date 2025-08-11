interface WaveformProps {
  isPlaying: boolean;
}

export default function Waveform({ isPlaying }: WaveformProps) {
  return (
    <div className="bg-dark-bg rounded-lg p-4 mb-4">
      <div className="flex items-end justify-center space-x-1 h-20">
        {[30, 60, 45, 80, 65, 90, 40, 70].map((height, index) => (
          <div
            key={index}
            className={`w-2 bg-gradient-to-t from-spotify-green to-coral rounded-t transition-all duration-300 ${
              isPlaying ? "waveform-bar" : ""
            }`}
            style={{
              height: `${height}%`,
              animationDelay: `${index * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
