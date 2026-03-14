/**
 * AppError Utility Tests
 */

import { AppError } from '../errors';

describe('AppError', () => {
  describe('constructor', () => {
    it('should create error with default values', () => {
      const error = new AppError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(true);
    });

    it('should create error with custom values', () => {
      const error = new AppError('Custom error', 400, 'CUSTOM_CODE', false);

      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.isOperational).toBe(false);
    });

    it('should be instance of Error', () => {
      const error = new AppError('Test');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('static factory methods', () => {
    it('badRequest should create 400 error', () => {
      const error = AppError.badRequest('Bad request');

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.message).toBe('Bad request');
    });

    it('badRequest should accept custom code', () => {
      const error = AppError.badRequest('Invalid input', 'INVALID_INPUT');

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('INVALID_INPUT');
    });

    it('unauthorized should create 401 error', () => {
      const error = AppError.unauthorized();

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Unauthorized');
    });

    it('unauthorized should accept custom message', () => {
      const error = AppError.unauthorized('Token expired');

      expect(error.message).toBe('Token expired');
    });

    it('forbidden should create 403 error', () => {
      const error = AppError.forbidden();

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    it('notFound should create 404 error', () => {
      const error = AppError.notFound('User not found');

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('User not found');
    });

    it('conflict should create 409 error', () => {
      const error = AppError.conflict('Email already exists');

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });

    it('tooManyRequests should create 429 error', () => {
      const error = AppError.tooManyRequests();

      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMITED');
    });

    it('internal should create non-operational 500 error', () => {
      const error = AppError.internal();

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(false);
    });
  });

  describe('error properties', () => {
    it('should have stack trace', () => {
      const error = new AppError('Test');
      expect(error.stack).toBeDefined();
    });

    it('should have name property', () => {
      const error = new AppError('Test');
      expect(error.name).toBe('Error');
    });
  });
});
