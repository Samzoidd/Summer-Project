import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IdentificationResult } from "@shared/schema";

interface RecentHistoryProps {
  identifications: IdentificationResult[];
}

export default function RecentHistory({ identifications }: RecentHistoryProps) {
  const formatTimeAgo = (date: Date | string | null) => {
    if (!date) return "unknown";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "unknown";
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const gradients = [
    "from-blue-500 to-purple-500",
    "from-pink-500 to-coral",
    "from-green-500 to-blue-500",
    "from-purple-500 to-pink-500",
    "from-coral to-yellow-500",
  ];

  return (
    <div className="bg-dark-card rounded-2xl p-6">
      <h3 className="text-xl font-semibold mb-6">Recent Identifications</h3>
      
      {identifications.length === 0 ? (
        <div className="text-center py-8">
          <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No recent identifications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {identifications.map((identification, index) => (
            <div
              key={identification.id}
              className="flex items-center space-x-3 p-3 bg-dark-bg rounded-lg hover:bg-dark-hover transition-colors cursor-pointer"
            >
              <div
                className={`w-12 h-12 bg-gradient-to-br ${
                  gradients[index % gradients.length]
                } rounded-lg flex items-center justify-center flex-shrink-0`}
              >
                <Music className="text-white" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{identification.song.title}</p>
                <p className="text-sm text-gray-400 truncate">{identification.song.artist}</p>
              </div>
              <div className="text-xs text-gray-500">
                {formatTimeAgo(identification.createdAt!)}
              </div>
            </div>
          ))}
        </div>
      )}

      {identifications.length > 0 && (
        <Button
          variant="ghost"
          className="w-full mt-4 text-spotify-green hover:text-coral transition-colors text-sm font-medium"
        >
          View All History
        </Button>
      )}
    </div>
  );
}
