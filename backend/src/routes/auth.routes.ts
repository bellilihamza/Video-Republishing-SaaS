import { Router } from 'express';
import {
  getGoogleAuthUrl,
  googleCallback,
  getMe,
  refreshToken,
  logout,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimit } from '../middleware/rateLimit.middleware';

const router = Router();

// GET /api/auth/google/url - Get Google OAuth URL
router.get('/google/url', authRateLimit, getGoogleAuthUrl);

// POST /api/auth/google/callback - Exchange code for tokens
router.post('/google/callback', authRateLimit, googleCallback);

// GET /api/auth/me - Get current user (protected)
router.get('/me', authenticate, getMe);

// POST /api/auth/refresh - Refresh JWT token (protected)
router.post('/refresh', authenticate, refreshToken);

// DELETE /api/auth/logout - Logout (protected)
router.delete('/logout', authenticate, logout);

export default router;
