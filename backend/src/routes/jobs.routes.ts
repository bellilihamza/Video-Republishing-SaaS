import { Router } from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  deleteJob,
} from '../controllers/jobs.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import { jobCreationRateLimit } from '../middleware/rateLimit.middleware';
import { createJobSchema, jobQuerySchema } from '../validators/job.validator';

const router = Router();

// All job routes require authentication
router.use(authenticate);

// POST /api/jobs - Create new job
router.post('/', jobCreationRateLimit, validateBody(createJobSchema), createJob);

// GET /api/jobs - List jobs
router.get('/', validateQuery(jobQuerySchema), getJobs);

// GET /api/jobs/:id - Get job by ID
router.get('/:id', getJobById);

// DELETE /api/jobs/:id - Delete job
router.delete('/:id', deleteJob);

export default router;
