'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Video, Inbox } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { getPublishedVideos } from '@/lib/api';
import {
  getPlatformLabel,
  formatRelativeTime,
  truncate,
} from '@/lib/utils';
import type { Job } from '@/types';

export default function PublishedVideoList() {
  const [videos, setVideos] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { videos: data } = await getPublishedVideos({ limit: 12 });
      setVideos(data);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageSpinner />;

  if (videos.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 font-medium">No published videos</p>
        <p className="text-sm text-slate-600 mt-1">
          Your published videos will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((video) => (
        <Card key={video._id} className="overflow-hidden">
          {/* Thumbnail */}
          <div className="aspect-video bg-gradient-to-br from-indigo-900/30 to-purple-900/30 flex items-center justify-center relative group">
            {video.publishedVideoId ? (
              <img
                src={`https://img.youtube.com/vi/${video.publishedVideoId}/mqdefault.jpg`}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Video className="w-8 h-8 text-slate-600" />
            )}
            {video.publishedVideoUrl && (
              <a
                href={video.publishedVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ExternalLink className="w-6 h-6 text-white" />
              </a>
            )}
          </div>

          <CardContent className="p-4">
            <h4 className="text-sm font-semibold text-white mb-1 truncate">
              {truncate(video.title, 40)}
            </h4>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="purple" size="sm">
                {getPlatformLabel(video.sourcePlatform)}
              </Badge>
              <span className="text-xs text-slate-500">
                {formatRelativeTime(video.updatedAt)}
              </span>
            </div>
            {video.privacyStatus && (
              <Badge
                size="sm"
                variant={
                  video.privacyStatus === 'public'
                    ? 'success'
                    : video.privacyStatus === 'unlisted'
                    ? 'warning'
                    : 'default'
                }
              >
                {video.privacyStatus}
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
