import { google } from 'googleapis';
import fs from 'fs';
import { getAuthenticatedClient } from './oauth.service';
import { logger } from '../utils/logger';

export interface UploadOptions {
  title: string;
  description: string;
  tags: string[];
  privacyStatus: 'public' | 'unlisted' | 'private';
  videoPath: string;
}

export interface UploadResult {
  videoId: string;
  videoUrl: string;
  title: string;
}

/**
 * Upload a video to YouTube using the Data API v3.
 */
export async function uploadToYouTube(
  userId: string,
  jobId: string,
  options: UploadOptions
): Promise<UploadResult> {
  const { title, description, tags, privacyStatus, videoPath } = options;

  if (!fs.existsSync(videoPath)) {
    throw new Error(`Video file not found at: ${videoPath}`);
  }

  const fileSize = fs.statSync(videoPath).size;
  logger.info(`[Job ${jobId}] Starting YouTube upload. File: ${videoPath} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

  // Get authenticated Google OAuth2 client
  const authClient = await getAuthenticatedClient(userId);
  const youtube = google.youtube({ version: 'v3', auth: authClient });

  try {
    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: title.slice(0, 100), // YouTube limit: 100 chars
          description: description.slice(0, 5000), // YouTube limit: 5000 chars
          tags: tags.slice(0, 500), // YouTube limit: 500 tags
          categoryId: '22', // People & Blogs (good default for short videos)
          defaultLanguage: 'en',
        },
        status: {
          privacyStatus,
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        mimeType: 'video/mp4',
        body: fs.createReadStream(videoPath),
      },
    });

    const videoId = response.data.id;

    if (!videoId) {
      throw new Error('YouTube upload succeeded but no video ID was returned');
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    logger.info(`[Job ${jobId}] Video uploaded to YouTube: ${videoUrl}`);

    return {
      videoId,
      videoUrl,
      title: response.data.snippet?.title || title,
    };
  } catch (error: unknown) {
    const gErr = error as { code?: number; message?: string; errors?: Array<{ message: string }> };

    if (gErr.code === 401) {
      throw new Error('YouTube authorization expired. Please reconnect your Google account.');
    }

    if (gErr.code === 403) {
      const reason = gErr.errors?.[0]?.message || 'Unknown';
      throw new Error(`YouTube upload forbidden: ${reason}. Check your YouTube account quotas.`);
    }

    if (gErr.code === 400) {
      throw new Error(`YouTube upload failed: Invalid request. ${gErr.message}`);
    }

    throw new Error(`YouTube upload failed: ${gErr.message || 'Unknown error'}`);
  }
}

/**
 * Get the upload status of a YouTube video.
 */
export async function getVideoStatus(
  userId: string,
  videoId: string
): Promise<{ status: string; processingProgress?: unknown }> {
  const authClient = await getAuthenticatedClient(userId);
  const youtube = google.youtube({ version: 'v3', auth: authClient });

  const response = await youtube.videos.list({
    part: ['status', 'processingDetails'],
    id: [videoId],
  });

  const video = response.data.items?.[0];

  if (!video) {
    throw new Error(`Video ${videoId} not found`);
  }

  return {
    status: video.status?.uploadStatus || 'unknown',
    processingProgress: video.processingDetails,
  };
}
