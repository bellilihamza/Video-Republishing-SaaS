'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { Upload } from 'lucide-react';
import VideoUrlForm from '@/components/dashboard/VideoUrlForm';
import { setAuthToken } from '@/lib/api';

export default function PublishPage() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.backendToken) {
      setAuthToken(session.backendToken);
    }
  }, [session]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Upload className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Publish Video</h1>
          <p className="text-slate-400 text-sm">
            Paste a video URL to republish it to YouTube
          </p>
        </div>
      </div>

      {/* Form */}
      <VideoUrlForm />
    </div>
  );
}
