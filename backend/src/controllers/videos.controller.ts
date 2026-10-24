import { Request, Response, NextFunction } from 'express';
import { Job } from '../models/Job';

/**
 * GET /api/videos
 * List all published videos for the current user.
 */
export async function getPublishedVideos(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;

    const page = parseInt(req.query.page as string || '1', 10);
    const limit = Math.min(parseInt(req.query.limit as string || '12', 10), 50);
    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      Job.find({
        userId,
        status: 'completed',
        publishedVideoUrl: { $ne: null },
      })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('title description tags sourcePlatform targetPlatform publishedVideoUrl publishedVideoId videoUrl privacyStatus createdAt updatedAt')
        .lean(),
      Job.countDocuments({
        userId,
        status: 'completed',
        publishedVideoUrl: { $ne: null },
      }),
    ]);

    res.json({
      success: true,
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + videos.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/videos/:id
 * Get details of a single published video.
 */
export async function getVideoById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const video = await Job.findOne({
      _id: id,
      userId,
      status: 'completed',
    })
      .select('-__v -outputVideoPath -queueJobId')
      .lean();

    if (!video) {
      res.status(404).json({ success: false, error: 'Video not found' });
      return;
    }

    res.json({ success: true, video });
  } catch (error) {
    next(error);
  }
}
