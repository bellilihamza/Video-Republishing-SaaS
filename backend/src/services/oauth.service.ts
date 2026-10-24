import { google } from 'googleapis';
import { Account, IAccount } from '../models/Account';
import { encrypt, decrypt } from '../utils/helpers';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const oauth2Client = new google.auth.OAuth2(
  env.googleClientId,
  env.googleClientSecret
);

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string;
  tokenType: string;
}

/**
 * Get a valid (refreshed if needed) access token for a user.
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const account = await Account.findOne({ userId, platform: 'youtube' });

  if (!account) {
    throw new Error('No YouTube account connected. Please reconnect your Google account.');
  }

  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 minutes buffer

  if (account.expiresAt.getTime() - bufferMs > now.getTime()) {
    // Token still valid
    return decrypt(account.accessToken);
  }

  // Token expired - refresh it
  logger.info(`Refreshing access token for user ${userId}`);

  try {
    const decryptedRefreshToken = decrypt(account.refreshToken);

    oauth2Client.setCredentials({
      refresh_token: decryptedRefreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token - no token returned');
    }

    const expiresAt = new Date(credentials.expiry_date || Date.now() + 3600 * 1000);

    // Update stored tokens
    await Account.findByIdAndUpdate(account._id, {
      accessToken: encrypt(credentials.access_token),
      expiresAt,
      ...(credentials.refresh_token && {
        refreshToken: encrypt(credentials.refresh_token),
      }),
    });

    logger.info(`Access token refreshed successfully for user ${userId}`);
    return credentials.access_token;
  } catch (error) {
    logger.error(`Failed to refresh token for user ${userId}:`, error);

    // Mark account as needing reconnection
    await Account.findByIdAndUpdate(account._id, {
      accessToken: '',
      expiresAt: new Date(0),
    });

    throw new Error('Your Google account authorization has expired. Please reconnect your account.');
  }
}

/**
 * Create a Google OAuth2 client with a valid access token for a user.
 */
export async function getAuthenticatedClient(userId: string) {
  const accessToken = await getValidAccessToken(userId);
  const account = await Account.findOne({ userId, platform: 'youtube' });

  if (!account) {
    throw new Error('No YouTube account connected');
  }

  const client = new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret
  );

  client.setCredentials({
    access_token: accessToken,
    refresh_token: decrypt(account.refreshToken),
  });

  return client;
}

/**
 * Save or update OAuth tokens for a user.
 */
export async function saveTokens(
  userId: string,
  providerAccountId: string,
  tokens: TokenData
): Promise<IAccount> {
  const existingAccount = await Account.findOne({ userId, platform: 'youtube' });

  const data = {
    userId,
    provider: 'google',
    platform: 'youtube' as const,
    providerAccountId,
    accessToken: encrypt(tokens.accessToken),
    refreshToken: encrypt(tokens.refreshToken),
    expiresAt: tokens.expiresAt,
    scope: tokens.scope,
    tokenType: tokens.tokenType,
  };

  if (existingAccount) {
    const updated = await Account.findByIdAndUpdate(existingAccount._id, data, { new: true });
    return updated as IAccount;
  }

  return Account.create(data);
}

/**
 * Generate Google OAuth2 authorization URL.
 */
export function getAuthorizationUrl(state?: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube',
    ],
    prompt: 'consent', // Force refresh token generation
    state,
  });
}

/**
 * Exchange authorization code for tokens.
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  tokens: TokenData;
  profile: { id: string; email: string; name: string; picture: string };
}> {
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Incomplete token response from Google');
  }

  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data: profile } = await oauth2.userinfo.get();

  return {
    tokens: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
      scope: tokens.scope || '',
      tokenType: tokens.token_type || 'Bearer',
    },
    profile: {
      id: profile.id || '',
      email: profile.email || '',
      name: profile.name || '',
      picture: profile.picture || '',
    },
  };
}
