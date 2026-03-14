import { Request, Response, NextFunction, RequestHandler } from 'express';
import { TokenPayload } from './index.js';

export interface AuthenticatedRequest extends Request {
  user: TokenPayload;
}

// Helper type to cast authenticated handlers
export type AuthHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

// Wrapper to properly type authenticated route handlers
export const asyncHandler = (fn: AuthHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);
  };
};
