import { Router } from 'express';
import { getPublishedVideos, getVideoById } from '../controllers/videos.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All video routes require authentication
router.use(authenticate);

// GET /api/videos - List published videos
router.get('/', getPublishedVideos);

// GET /api/videos/:id - Get video by ID
router.get('/:id', getVideoById);

export default router;
