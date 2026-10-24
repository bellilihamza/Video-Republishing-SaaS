/**
 * Worker entry point.
 * This runs as a separate process from the API server.
 * Start with: npm run worker
 */
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { createVideoWorker } from './queues/video.worker';
import { env } from './config/env';
import { logger } from './utils/logger';
import fs from 'fs';

async function startWorker() {
  try {
    logger.info('Starting video processing worker...');

    // Ensure temp directory exists
    if (!fs.existsSync(env.tempDir)) {
      fs.mkdirSync(env.tempDir, { recursive: true });
      logger.info(`Created temp directory: ${env.tempDir}`);
    }

    // Connect to databases
    await connectDB();
    await connectRedis();

    // Create and start worker
    const worker = createVideoWorker();

    logger.info('Video worker started and listening for jobs');

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Worker shutting down gracefully...`);

      await worker.close();
      logger.info('Worker closed');

      const { disconnectDB } = await import('./config/db');
      const { disconnectRedis } = await import('./config/redis');

      await disconnectDB();
      await disconnectRedis();

      logger.info('Worker shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.error('Worker uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Worker unhandled rejection:', reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start worker:', error);
    process.exit(1);
  }
}

startWorker();
