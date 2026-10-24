import { createApp } from './app';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { env } from './config/env';
import { logger } from './utils/logger';
import { closeQueue } from './queues/video.queue';
import { createVideoWorker } from './queues/video.worker';

async function start() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Connect to Redis
    await connectRedis();

    // Start BullMQ worker to process video jobs
    const worker = createVideoWorker();

    // Create Express app
    const app = createApp();

    // Start HTTP server
    const server = app.listen(env.port, () => {
      logger.info(`â API server running on port ${env.port} (${env.nodeEnv})`);
      logger.info(`  Health: http://localhost:${env.port}/health`);

      if (!env.isProd) {
        logger.info(`  Queue UI: http://localhost:${env.port}/admin/queues`);
      }
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Graceful shutdown started...`);

      server.close(async () => {
        try {
          await worker.close();
          logger.info('Worker closed');
          await closeQueue();
          logger.info('Queues closed');

          const { disconnectDB } = await import('./config/db');
          await disconnectDB();
          logger.info('Database disconnected');

          const { disconnectRedis } = await import('./config/redis');
          await disconnectRedis();
          logger.info('Redis disconnected');

          logger.info('Graceful shutdown complete');
          process.exit(0);
        } catch (err) {
          logger.error('Shutdown error:', err);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection:', reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
