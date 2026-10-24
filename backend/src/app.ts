import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { env } from './config/env';
import { generalRateLimit } from './middleware/rateLimit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { getVideoQueue } from './queues/video.queue';
import { logger } from './utils/logger';

import authRoutes from './routes/auth.routes';
import jobsRoutes from './routes/jobs.routes';
import accountsRoutes from './routes/accounts.routes';
import videosRoutes from './routes/videos.routes';

export function createApp() {
  const app = express();

  // ========================
  // Security Middleware
  // ========================
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ========================
  // Request Parsing
  // ========================
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ========================
  // Logging
  // ========================
  if (env.nodeEnv !== 'test') {
    app.use(
      morgan(env.isProd ? 'combined' : 'dev', {
        stream: {
          write: (message) => logger.http(message.trim()),
        },
      })
    );
  }

  // ========================
  // Rate Limiting
  // ========================
  app.use('/api', generalRateLimit);

  // ========================
  // Health Check
  // ========================
  app.get('/health', (_, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'republish-api',
      version: '1.0.0',
    });
  });

  // ========================
  // Bull Board (Queue Monitor)
  // ========================
  if (!env.isProd) {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    createBullBoard({
      queues: [new BullMQAdapter(getVideoQueue())],
      serverAdapter,
    });

    app.use('/admin/queues', serverAdapter.getRouter());
    logger.info('Bull Board available at /admin/queues');
  }

  // ========================
  // API Routes
  // ========================
  app.use('/api/auth', authRoutes);
  app.use('/api/jobs', jobsRoutes);
  app.use('/api/accounts', accountsRoutes);
  app.use('/api/videos', videosRoutes);

  // ========================
  // Error Handling
  // ========================
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
