import { Request, Response, NextFunction } from 'express';
import { Account } from '../models/Account';
import { logger } from '../utils/logger';

/**
 * GET /api/accounts
 * List all connected accounts for the current user.
 */
export async function getAccounts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;

    const accounts = await Account.find({ userId })
      .select('platform provider expiresAt scope createdAt updatedAt')
      .lean();

    const enrichedAccounts = accounts.map((account) => ({
      id: account._id,
      platform: account.platform,
      provider: account.provider,
      isConnected: true,
      isExpired: account.expiresAt < new Date(),
      expiresAt: account.expiresAt,
      connectedAt: account.createdAt,
      scope: account.scope,
    }));

    res.json({ success: true, accounts: enrichedAccounts });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/accounts/:id
 * Disconnect a platform account.
 */
export async function disconnectAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const account = await Account.findOne({ _id: id, userId });

    if (!account) {
      res.status(404).json({ success: false, error: 'Account not found' });
      return;
    }

    await account.deleteOne();

    logger.info(`User ${userId} disconnected ${account.platform} account`);

    res.json({
      success: true,
      message: `${account.platform} account disconnected successfully`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/accounts/status
 * Get connection status for all platforms.
 */
export async function getAccountStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;

    const accounts = await Account.find({ userId }).select('platform expiresAt').lean();

    const platforms = ['youtube', 'tiktok', 'instagram', 'facebook'] as const;
    const status: Record<string, { connected: boolean; isExpired?: boolean; expiresAt?: Date }> = {};

    for (const platform of platforms) {
      const account = accounts.find((a) => a.platform === platform);

      if (account) {
        status[platform] = {
          connected: true,
          isExpired: account.expiresAt < new Date(),
          expiresAt: account.expiresAt,
        };
      } else {
        status[platform] = { connected: false };
      }
    }

    res.json({ success: true, status });
  } catch (error) {
    next(error);
  }
}
