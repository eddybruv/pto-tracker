import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { healthCheck, pool } from './config/database.js';

const startServer = async () => {
  const dbConnected = await healthCheck();
  if (!dbConnected) {
    throw new Error('Cannot connect to PostgreSQL — check DATABASE_URL');
  }
  logger.info('Database connected');

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
    logger.info(`Health check: http://localhost:${env.PORT}/health`);
    logger.info(`API base: http://localhost:${env.PORT}/api/v1`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received, shutting down gracefully...`);

    server.close(async () => {
      logger.info('HTTP server closed');
      await pool.end();
      logger.info('Database pool closed');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled Rejection');
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ error }, 'Uncaught Exception');
    process.exit(1);
  });
};

startServer().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
