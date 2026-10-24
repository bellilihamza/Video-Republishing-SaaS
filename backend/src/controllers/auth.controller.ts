import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Account } from '../models/Account';
import {
  exchangeCodeForTokens,
  saveTokens,
  getAuthorizationUrl,
} from '../services/oauth.service';
import { generateToken } from '../middleware/auth.middleware';
import { decrypt } from '../utils/helpers';
import { logger } from '../utils/logger';

/**
 * GET /api/auth/google/url
 * Returns the Google OAuth2 authorization URL.
 */
export async function getGoogleAuthUrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const state = req.query.state as string | undefined;
    const url = getAuthorizationUrl(state);

    res.json({ success: true, url });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/google/callback
 * Handle Google OAuth callback.
 * Supports two flows:
 *  1. NextAuth flow: receives pre-exchanged tokens (accessToken, refreshToken, profile)
 *  2. Direct flow: receives an authorization code to exchange
 */
export async function googleCallback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { code, refreshToken: directRefreshToken, expiresAt, providerAccountId, profile: directProfile } = req.body;

    let tokens;
    let profile;

    if (directRefreshToken && directProfile) {
      // Flow 1: NextAuth already exchanged the tokens for us
      logger.info('Auth callback: NextAuth flow (pre-exchanged tokens)');

      tokens = {
        accessToken: code, // NextAuth sends access_token as 'code'
        refreshToken: directRefreshToken,
        expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 3600 * 1000),
        scope: 'openid email profile https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube',
        tokenType: 'Bearer',
      };

      profile = {
        id: directProfile.id || providerAccountId || '',
        email: directProfile.email || '',
        name: directProfile.name || '',
        picture: directProfile.picture || '',
      };
    } else if (code) {
      // Flow 2: Direct OAuth code exchange
      logger.info('Auth callback: Direct code exchange flow');
      const result = await exchangeCodeForTokens(code);
      tokens = result.tokens;
      profile = result.profile;
    } else {
      res.status(400).json({ success: false, error: 'Authorization code or tokens are required' });
      return;
    }

    if (!profile.email) {
      res.status(400).json({ success: false, error: 'Could not retrieve user email from Google' });
      return;
    }

    // Upsert user
    let user = await User.findOne({ email: profile.email });

    if (!user) {
      user = await User.create({
        email: profile.email,
        name: profile.name,
        image: profile.picture,
      });
      logger.info(`New user created: ${user.email}`);
    } else {
      user.name = profile.name;
      user.image = profile.picture;
      await user.save();
    }

    // Save OAuth tokens
    await saveTokens(user._id.toString(), profile.id, tokens);

    // Generate JWT
    const jwt = generateToken(user._id.toString(), user.email, user.name);

    res.json({
      success: true,
      token: jwt,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    });
  } catch (error) {
    logger.error('Auth callback error:', error);
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Get the current authenticated user.
 */
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await User.findById(req.user!.userId).select('-__v');

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    // Check if YouTube account is connected
    const youtubeAccount = await Account.findOne({
      userId: user._id,
      platform: 'youtube',
    }).select('platform expiresAt createdAt');

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt,
      },
      accounts: {
        youtube: youtubeAccount
          ? {
              connected: true,
              expiresAt: youtubeAccount.expiresAt,
              isExpired: youtubeAccount.expiresAt < new Date(),
            }
          : { connected: false },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/refresh
 * Refresh the JWT token.
 */
export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await User.findById(req.user!.userId);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const token = generateToken(user._id.toString(), user.email, user.name);

    res.json({ success: true, token });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/auth/logout
 * Client-side logout (JWT is stateless, just return success).
 */
export async function logout(
  req: Request,
  res: Response
): Promise<void> {
  // With JWT, logout is handled on the client by removing the token.
  // Optionally, implement a token blacklist in Redis for production.
  res.json({ success: true, message: 'Logged out successfully' });
}
