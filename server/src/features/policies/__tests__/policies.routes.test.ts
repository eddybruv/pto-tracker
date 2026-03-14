/**
 * Policies Routes Integration Tests
 */

import request from 'supertest';
import { createApp } from '../../../app';
import { initMockDb } from '../../../config/mock-db';
import { authHeader, expectSuccessResponse } from '../../../__tests__/helpers';

const app = createApp();

describe('Policies Routes', () => {
  beforeAll(async () => {
    await initMockDb();
  });

  describe('GET /api/v1/policies', () => {
    it('should return policies list for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/policies')
        .set(authHeader('developer'));

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
      expect(response.body).toHaveProperty('data');
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .get('/api/v1/policies');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/policies/:id', () => {
    it('should return policy by ID for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/policies/test-policy-id')
        .set(authHeader('developer'));

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .get('/api/v1/policies/test-policy-id');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/policies', () => {
    it('should create policy for admin', async () => {
      const response = await request(app)
        .post('/api/v1/policies')
        .set(authHeader('admin'))
        .send({
          name: 'Contractor Policy',
          ptoTypeId: 'test-pto-type-id',
          accrualRate: 5,
          accrualFrequency: 'monthly',
          maxAccrual: 100,
        });

      expect(response.status).toBe(201);
      expectSuccessResponse(response.body);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .post('/api/v1/policies')
        .send({
          name: 'Contractor Policy',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/policies/:id', () => {
    it('should update policy for admin', async () => {
      const response = await request(app)
        .patch('/api/v1/policies/test-policy-id')
        .set(authHeader('admin'))
        .send({
          name: 'Updated Policy Name',
        });

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .patch('/api/v1/policies/test-policy-id')
        .send({
          name: 'Updated Policy Name',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/policies/:id/assign', () => {
    it('should assign policy to users for admin', async () => {
      const response = await request(app)
        .post('/api/v1/policies/test-policy-id/assign')
        .set(authHeader('admin'))
        .send({
          userIds: ['user-1', 'user-2'],
        });

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
    });
  });
});
