import { Queue, QueueEvents } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

export interface VideoJobData {
  jobId: string;        // MongoDB Job._id
  userId: string;       // MongoDB User._id
  videoUrl: string;
  sourcePlatform: string;
  title: string;
  description: string;
  tags: string[];
  privacyStatus: string;
  trimDuration: number;
  removeWatermark: boolean;
}

export const VIDEO_QUEUE_NAME = 'video-processing';

let videoQueue: Queue<VideoJobData> | null = null;
let queueEvents: QueueEvents | null = null;

export function getVideoQueue(): Queue<VideoJobData> {
  if (!videoQueue) {
    videoQueue = new Queue<VideoJobData>(VIDEO_QUEUE_NAME, {
      connection: getRedisClient(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // 5 seconds initial delay, doubles on each retry
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 100,
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    });

    videoQueue.on('error', (error) => {
      logger.error('Video queue error:', error);
    });

    logger.info(`Queue "${VIDEO_QUEUE_NAME}" initialized`);
  }

  return videoQueue;
}

export function getQueueEvents(): QueueEvents {
  if (!queueEvents) {
    queueEvents = new QueueEvents(VIDEO_QUEUE_NAME, {
      connection: getRedisClient(),
    });
  }

  return queueEvents;
}

/**
 * Add a video processing job to the queue.
 */
export async function enqueueVideoJob(data: VideoJobData): Promise<string> {
  const queue = getVideoQueue();

  const job = await queue.add('process-video', data, {
    jobId: `job-${data.jobId}`, // Use MongoDB ID as BullMQ job ID for deduplication
  });

  logger.info(`[Job ${data.jobId}] Enqueued to queue. BullMQ job ID: ${job.id}`);

  return job.id as string;
}

/**
 * Get the status of a job in the queue.
 */
export async function getQueueJobStatus(bullmqJobId: string): Promise<string | null> {
  const queue = getVideoQueue();
  const job = await queue.getJob(bullmqJobId);

  if (!job) return null;

  return job.getState();
}

/**
 * Gracefully close the queue.
 */
export async function closeQueue(): Promise<void> {
  if (videoQueue) {
    await videoQueue.close();
    videoQueue = null;
  }

  if (queueEvents) {
    await queueEvents.close();
    queueEvents = null;
  }
}
