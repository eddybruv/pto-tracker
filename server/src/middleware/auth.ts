import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { TokenPayload, Role } from '../types/index.js';
import { AuthenticatedRequest } from '../types/express.js';

export function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);
    
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(AppError.unauthorized('Token expired', 'TOKEN_EXPIRED'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(AppError.unauthorized('Invalid token', 'INVALID_TOKEN'));
    } else {
      next(error);
    }
  }
}

export function requireRoles(...roles: Role[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }

    const hasRole = req.user.roles.some((role) => roles.includes(role));
    
    if (!hasRole) {
      return next(AppError.forbidden(`Requires one of: ${roles.join(', ')}`));
    }

    next();
  };
}

export function requireAnyRole(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(AppError.unauthorized('Authentication required'));
  }
  next();
}
