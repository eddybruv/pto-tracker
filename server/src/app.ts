import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';

import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { authenticate } from './middleware/auth.js';
import { requireRoles } from './middleware/auth.js';
import { healthCheck } from './config/database.js';

// Route imports
import authRoutes from './features/auth/auth.routes.js';
import usersRoutes from './features/users/users.routes.js';
import ptoTypesRoutes from './features/pto-types/pto-types.routes.js';
import policiesRoutes from './features/policies/policies.routes.js';
import balancesRoutes from './features/balances/balances.routes.js';
import requestsRoutes from './features/requests/requests.routes.js';
import approvalsRoutes from './features/approvals/approvals.routes.js';
import holidaysRoutes from './features/holidays/holidays.routes.js';

export function createApp(): Application {
  const app = express();

  // ============ Security Middleware ============
  app.use(helmet());
  app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }));

  // ============ Rate Limiting ============
  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests, please try again later',
      },
    },
  });
  app.use(limiter);

  // ============ Body Parsing ============
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));

  // ============ Request Logging ============
  app.use(pinoHttp({
    logger,
    customLogLevel: (_req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  }));

  // ============ Health Check ============
  app.get('/health', async (_req, res) => {
    const dbHealthy = await healthCheck();
    const status = dbHealthy ? 200 : 503;
    res.status(status).json({
      success: dbHealthy,
      data: {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: dbHealthy ? 'connected' : 'disconnected',
      },
    });
  });

  // ============ API Routes ============
  const apiRouter = express.Router();

  // Public routes
  apiRouter.use('/auth', authRoutes);

  // Protected routes (require authentication)
  apiRouter.use('/users', authenticate as never, requireRoles('admin') as never, usersRoutes);
  apiRouter.use('/pto-types', authenticate as never, ptoTypesRoutes);
  apiRouter.use('/policies', authenticate as never, policiesRoutes);
  apiRouter.use('/balances', authenticate as never, balancesRoutes);
  apiRouter.use('/requests', authenticate as never, requestsRoutes);
  apiRouter.use('/approvals', authenticate as never, requireRoles('tech_lead', 'admin') as never, approvalsRoutes);
  apiRouter.use('/holidays', authenticate as never, holidaysRoutes);

  // Mount API router with version prefix
  app.use('/api/v1', apiRouter);

  // ============ Error Handling ============
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
