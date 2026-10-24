import { Request, Response, NextFunction } from 'express';
import { Job } from '../models/Job';
import { Account } from '../models/Account';
import { enqueueVideoJob } from '../queues/video.queue';
import { validateVideoUrl } from '../utils/helpers';
import { logger } from '../utils/logger';
import type { CreateJobInput, JobQuery } from '../validators/job.validator';

/**
 * POST /api/jobs
 * Create a new video republishing job.
 */
export async function createJob(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const body = req.body as CreateJobInput;

    // Validate URL and detect source platform
    const { valid, platform } = validateVideoUrl(body.videoUrl);

    if (!valid || !platform) {
      res.status(400).json({
        success: false,
        error: 'Invalid video URL. Must be from TikTok, Instagram, or Facebook.',
      });
      return;
    }

    // Check if YouTube account is connected
    const youtubeAccount = await Account.findOne({ userId, platform: 'youtube' });

    if (!youtubeAccount) {
      res.status(400).json({
        success: false,
        error: 'No YouTube account connected. Please connect your Google account first.',
        code: 'NO_YOUTUBE_ACCOUNT',
      });
      return;
    }

    // Check if token has expired
    if (youtubeAccount.expiresAt < new Date()) {
      res.status(400).json({
        success: false,
        error: 'YouTube authorization has expired. Please reconnect your Google account.',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    // Create job in database
    const job = await Job.create({
      userId,
      videoUrl: body.videoUrl,
      sourcePlatform: platform,
      targetPlatform: body.targetPlatform || 'youtube',
      title: body.title,
      description: body.description || '',
      tags: body.tags || [],
      privacyStatus: body.privacyStatus || 'public',
      trimDuration: body.trimDuration,
      removeWatermark: body.removeWatermark ?? true,
      status: 'pending',
    });

    // Enqueue background job
    const queueJobId = await enqueueVideoJob({
      jobId: job._id.toString(),
      userId,
      videoUrl: body.videoUrl,
      sourcePlatform: platform,
      title: body.title,
      description: body.description || '',
      tags: body.tags || [],
      privacyStatus: body.privacyStatus || 'public',
      trimDuration: body.trimDuration,
      removeWatermark: body.removeWatermark ?? true,
    });

    // Store queue job ID
    await Job.findByIdAndUpdate(job._id, { queueJobId });

    logger.info(`Job ${job._id} created by user ${userId}`);

    res.status(201).json({
      success: true,
      job: {
        id: job._id,
        status: job.status,
        videoUrl: job.videoUrl,
        sourcePlatform: job.sourcePlatform,
        targetPlatform: job.targetPlatform,
        title: job.title,
        createdAt: job.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/jobs
 * List all jobs for the current user with pagination.
 */
export async function getJobs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const query = req.query as unknown as JobQuery;

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { userId };

    if (query.status) {
      filter.status = query.status;
    }

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .lean(),
      Job.countDocuments(filter),
    ]);

    res.json({
      success: true,
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + jobs.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/jobs/:id
 * Get a single job by ID.
 */
export async function getJobById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const job = await Job.findOne({ _id: id, userId }).select('-__v').lean();

    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found' });
      return;
    }

    res.json({ success: true, job });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/jobs/:id
 * Cancel and delete a job.
 */
export async function deleteJob(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const job = await Job.findOne({ _id: id, userId });

    if (!job) {
      res.status(404).json({ success: false, error: 'Job not found' });
      return;
    }

    // If job is still in the queue, try to remove it
    if (['pending', 'downloading', 'processing', 'uploading'].includes(job.status)) {
      try {
        const { getVideoQueue } = await import('../queues/video.queue');
        const queue = getVideoQueue();
        const bullJob = await queue.getJob(job._id.toString());
        if (bullJob) {
          await bullJob.remove();
        }
      } catch {
        // Queue removal is best-effort; continue with DB deletion
      }
    }

    await job.deleteOne();

    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    next(error);
  }
}
