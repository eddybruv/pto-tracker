import { Router, Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { loginSchema, refreshTokenSchema, registerSchema } from './auth.schemas.js';
import { asyncHandler } from '../../types/express.js';

const router = Router();

/**
 * POST /auth/register
 * Create a new user account
 */
router.post(
  '/register',
  validate({ body: registerSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, firstName, lastName, hireDate, timezone } = req.body;
      const result = await authService.register({
        email,
        password,
        firstName,
        lastName,
        hireDate,
        timezone,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/login
 * Authenticate user and return tokens
 */
router.post(
  '/login',
  validate({ body: loginSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as { email: string; password: string };
      const result = await authService.login(email, password);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  validate({ body: refreshTokenSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      const tokens = await authService.refreshTokens(refreshToken);
      
      res.json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/logout
 * Revoke refresh token
 */
router.post(
  '/logout',
  validate({ body: refreshTokenSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      await authService.logout(refreshToken);
      
      res.json({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /auth/logout-all
 * Revoke all refresh tokens for current user
 */
router.post(
  '/logout-all',
  authenticate as never,
  asyncHandler(async (req, res) => {
    await authService.logoutAll(req.user.userId);
    
    res.json({
      success: true,
      data: { message: 'All sessions logged out' },
    });
  })
);

/**
 * GET /auth/me
 * Get current user info
 */
router.get(
  '/me',
  authenticate as never,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: req.user,
    });
  })
);

export default router;
