import { z } from 'zod';
import { validateVideoUrl } from '../utils/helpers';
import { env } from '../config/env';

export const createJobSchema = z.object({
  videoUrl: z
    .string()
    .url('Must be a valid URL')
    .refine(
      (url) => validateVideoUrl(url).valid,
      'URL must be from TikTok, Instagram, or Facebook'
    ),
  targetPlatform: z.enum(['youtube']).default('youtube'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or less')
    .trim(),
  description: z
    .string()
    .max(5000, 'Description must be 5000 characters or less')
    .trim()
    .default(''),
  tags: z
    .array(z.string().trim().max(30))
    .max(30, 'Maximum 30 tags allowed')
    .default([]),
  privacyStatus: z.enum(['public', 'unlisted', 'private']).default('public'),
  trimDuration: z
    .number()
    .int()
    .min(1, 'Trim duration must be at least 1 second')
    .max(env.maxTrimDuration, `Trim duration cannot exceed ${env.maxTrimDuration} seconds`)
    .default(env.defaultTrimDuration),
  removeWatermark: z
    .boolean()
    .default(true),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

export const jobQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val >= 1, 'Page must be at least 1'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(parseInt(val, 10), 50) : 10))
    .refine((val) => val >= 1, 'Limit must be at least 1'),
  status: z
    .enum(['pending', 'downloading', 'processing', 'uploading', 'completed', 'failed'])
    .optional(),
});

export type JobQuery = z.infer<typeof jobQuerySchema>;
