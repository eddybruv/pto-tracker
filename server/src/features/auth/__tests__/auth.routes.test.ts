/**
 * Auth Routes Integration Tests
 */

import request from 'supertest';
import { createApp } from '../../../app';
import { initMockDb } from '../../../config/mock-db';
import { expectSuccessResponse, expectErrorResponse } from '../../../__tests__/helpers';

const app = createApp();

describe('Auth Routes', () => {
  beforeAll(async () => {
    await initMockDb();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'dev@company.com',
          password: 'admin123',
        });

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data).toHaveProperty('roles');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe('dev@company.com');
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@company.com',
          password: 'admin123',
        });

      expect(response.status).toBe(401);
      expectErrorResponse(response.body);
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'dev@company.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expectErrorResponse(response.body);
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: 'admin123',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'dev@company.com',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: 'admin123',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let validRefreshToken: string;

    beforeAll(async () => {
      // Login to get a refresh token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'dev@company.com',
          password: 'admin123',
        });
      
      validRefreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: validRefreshToken,
        });

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should return 400 for invalid refresh token format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      // First login to get tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@company.com',
          password: 'admin123',
        });

      const { refreshToken } = loginResponse.body.data.tokens;

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'not-a-valid-uuid' });

      expect(response.status).toBe(400);
    });
  });
});
