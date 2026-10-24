import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnvVars = [
  'MONGODB_URI',
  'REDIS_URL',
  'JWT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'ENCRYPTION_KEY',
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',

  mongodbUri: process.env.MONGODB_URI as string,

  redisUrl: process.env.REDIS_URL as string,

  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  googleClientId: process.env.GOOGLE_CLIENT_ID as string,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET as string,

  encryptionKey: process.env.ENCRYPTION_KEY as string,

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  tempDir: process.env.TEMP_DIR || '/tmp/videos',

  defaultTrimDuration: parseInt(process.env.DEFAULT_TRIM_DURATION || '60', 10),
  maxTrimDuration: parseInt(process.env.MAX_TRIM_DURATION || '180', 10),

  queueConcurrency: parseInt(process.env.QUEUE_CONCURRENCY || '3', 10),
  jobTimeoutMs: parseInt(process.env.JOB_TIMEOUT_MS || '600000', 10),
} as const;
