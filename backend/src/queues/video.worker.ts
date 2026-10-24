import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { Job as JobModel } from '../models/Job';
import { downloadVideo } from '../services/video-download.service';
import { processVideo } from '../services/video-process.service';
import { uploadToYouTube } from '../services/youtube-upload.service';
import { cleanupJobFiles } from '../services/cleanup.service';
import { getOutputVideoPath } from '../utils/helpers';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { VideoJobData, VIDEO_QUEUE_NAME } from './video.queue';

/**
 * Process a video job through the full pipeline:
 * 1. Download via yt-dlp
 * 2. Process via FFmpeg
 * 3. Upload to YouTube
 * 4. Cleanup temp files
 */
async function processVideoJob(job: Job<VideoJobData>): Promise<void> {
  const { jobId, userId, videoUrl, title, description, tags, privacyStatus, trimDuration, removeWatermark } = job.data;

  logger.info(`[Job ${jobId}] Starting processing pipeline. Attempt: ${job.attemptsMade + 1}`);

  // Update job status: downloading
  await JobModel.findByIdAndUpdate(jobId, {
    status: 'downloading',
    attempts: job.attemptsMade + 1,
    errorMessage: null,
  });

  // Step 1: Download video
  logger.info(`[Job ${jobId}] Step 1/3: Downloading video from ${videoUrl}`);
  await job.updateProgress(10);

  await downloadVideo(jobId, videoUrl);

  await job.updateProgress(35);

  // Step 2: Process video with FFmpeg
  logger.info(`[Job ${jobId}] Step 2/3: Processing video`);

  await JobModel.findByIdAndUpdate(jobId, { status: 'processing' });
  await job.updateProgress(40);

  const { outputPath } = await processVideo(jobId, { trimDuration, removeWatermark });

  await JobModel.findByIdAndUpdate(jobId, { outputVideoPath: outputPath });
  await job.updateProgress(70);

  // Step 3: Upload to YouTube
  logger.info(`[Job ${jobId}] Step 3/3: Uploading to YouTube`);

  await JobModel.findByIdAndUpdate(jobId, { status: 'uploading' });
  await job.updateProgress(75);

  const uploadResult = await uploadToYouTube(userId, jobId, {
    title,
    description,
    tags,
    privacyStatus: privacyStatus as 'public' | 'unlisted' | 'private',
    videoPath: getOutputVideoPath(jobId),
  });

  await job.updateProgress(95);

  // Step 4: Cleanup temp files
  logger.info(`[Job ${jobId}] Cleaning up temp files`);
  await cleanupJobFiles(jobId);

  // Mark job as completed
  await JobModel.findByIdAndUpdate(jobId, {
    status: 'completed',
    publishedVideoUrl: uploadResult.videoUrl,
    publishedVideoId: uploadResult.videoId,
    outputVideoPath: null, // Clear since files are deleted
  });

  await job.updateProgress(100);

  logger.info(`[Job ${jobId}] Pipeline complete! Published at: ${uploadResult.videoUrl}`);
}

/**
 * Create and start the BullMQ worker.
 */
export function createVideoWorker(): Worker<VideoJobData> {
  const worker = new Worker<VideoJobData>(
    VIDEO_QUEUE_NAME,
    processVideoJob,
    {
      connection: getRedisClient(),
      concurrency: env.queueConcurrency,
      stalledInterval: 30 * 1000, // 30 seconds
      lockDuration: env.jobTimeoutMs,
    }
  );

  worker.on('completed', (job) => {
    logger.info(`[Job ${job.data.jobId}] BullMQ job ${job.id} completed`);
  });

  worker.on('failed', async (job, error) => {
    if (!job) return;

    logger.error(`[Job ${job.data.jobId}] BullMQ job ${job.id} failed:`, error.message);

    const isFinalAttempt = job.attemptsMade >= (job.opts.attempts || 3);

    if (isFinalAttempt) {
      // Mark job as permanently failed
      await JobModel.findByIdAndUpdate(job.data.jobId, {
        status: 'failed',
        errorMessage: error.message,
      }).catch((e) => logger.error('Failed to update job status to failed:', e));

      // Cleanup any partial temp files
      await cleanupJobFiles(job.data.jobId).catch((e) =>
        logger.warn('Cleanup after failure error:', e)
      );
    }
  });

  worker.on('error', (error) => {
    logger.error('Worker error:', error);
  });

  worker.on('stalled', (jobId) => {
    logger.warn(`Job ${jobId} has stalled`);
  });

  worker.on('active', (job) => {
    logger.info(`[Job ${job.data.jobId}] BullMQ job ${job.id} started`);
  });

  logger.info(`Video worker started with concurrency: ${env.queueConcurrency}`);

  return worker;
}
