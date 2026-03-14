/**
 * Auth Middleware Tests
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, requireRoles } from '../auth';
import { AuthenticatedRequest } from '../../types/express';
import { AppError } from '../../utils/errors';

// Mock environment
jest.mock('../../config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-key',
  },
}));

describe('Auth Middleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  describe('authenticate', () => {
    it('should call next with error for missing authorization header', () => {
      authenticate(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Missing or invalid authorization header',
        })
      );
    });

    it('should call next with error for invalid authorization format', () => {
      mockReq.headers = { authorization: 'InvalidFormat token' };

      authenticate(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      );
    });

    it('should call next with error for invalid token', () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };

      authenticate(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          code: 'INVALID_TOKEN',
        })
      );
    });

    it('should call next with error for expired token', () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: 'test-id', email: 'test@test.com', roles: ['developer'] },
        'test-secret-key',
        { expiresIn: '-1h' }
      );
      mockReq.headers = { authorization: `Bearer ${expiredToken}` };

      authenticate(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          code: 'TOKEN_EXPIRED',
        })
      );
    });

    it('should set req.user and call next for valid token', () => {
      const validToken = jwt.sign(
        { userId: 'test-id', email: 'test@test.com', roles: ['developer'] },
        'test-secret-key',
        { expiresIn: '1h' }
      );
      mockReq.headers = { authorization: `Bearer ${validToken}` };

      authenticate(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.userId).toBe('test-id');
      expect(mockReq.user?.email).toBe('test@test.com');
      expect(mockReq.user?.roles).toContain('developer');
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('requireRoles', () => {
    it('should call next with error if no user', () => {
      const middleware = requireRoles('admin');

      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      );
    });

    it('should call next with forbidden if user lacks role', () => {
      mockReq.user = { userId: 'test', email: 'test@test.com', roles: ['developer'] };
      const middleware = requireRoles('admin');

      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
        })
      );
    });

    it('should call next if user has required role', () => {
      mockReq.user = { userId: 'test', email: 'test@test.com', roles: ['admin'] };
      const middleware = requireRoles('admin');

      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next if user has any of the required roles', () => {
      mockReq.user = { userId: 'test', email: 'test@test.com', roles: ['tech_lead'] };
      const middleware = requireRoles('admin', 'tech_lead');

      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
