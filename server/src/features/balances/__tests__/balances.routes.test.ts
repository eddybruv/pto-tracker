/**
 * Balances Routes Integration Tests
 */

import request from 'supertest';
import { createApp } from '../../../app';
import { initMockDb } from '../../../config/mock-db';
import { authHeader, expectSuccessResponse } from '../../../__tests__/helpers';

const app = createApp();

describe('Balances Routes', () => {
  beforeAll(async () => {
    await initMockDb();
  });

  describe('GET /api/v1/balances', () => {
    it('should return balances for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/balances')
        .set(authHeader('developer'));

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
      expect(response.body).toHaveProperty('data');
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .get('/api/v1/balances');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/balances/user/:userId', () => {
    it('should return user balances for admin', async () => {
      const response = await request(app)
        .get('/api/v1/balances/user/test-user-id')
        .set(authHeader('admin'));

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .get('/api/v1/balances/user/test-user-id');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/balances/adjust', () => {
    it('should adjust balance for admin', async () => {
      const response = await request(app)
        .post('/api/v1/balances/adjust')
        .set(authHeader('admin'))
        .send({
          userId: 'test-user-id',
          ptoTypeId: 'test-pto-type-id',
          days: 1,
          reason: 'Manual correction',
        });

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .post('/api/v1/balances/adjust')
        .send({
          userId: 'test-user-id',
          days: 1,
          reason: 'Manual correction',
        });

      expect(response.status).toBe(401);
    });
  });
});
