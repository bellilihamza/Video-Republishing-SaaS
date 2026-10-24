import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware to verify JWT token and attach user to request.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No authorization token provided',
      });
      return;
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    let decoded: JwtPayload;

    try {
      decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: 'Token has expired',
          code: 'TOKEN_EXPIRED',
        });
        return;
      }

      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }

    // Verify user still exists in database
    const user = await User.findById(decoded.userId).select('_id email name');

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
}

/**
 * Generate a JWT token for a user.
 */
export function generateToken(userId: string, email: string, name: string): string {
  return jwt.sign(
    { userId, email, name },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
  );
}
