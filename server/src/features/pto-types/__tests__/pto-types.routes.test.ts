/**
 * PTO Types Routes Integration Tests
 */

import request from 'supertest';
import { createApp } from '../../../app';
import { initMockDb } from '../../../config/mock-db';
import { authHeader, expectSuccessResponse } from '../../../__tests__/helpers';

const app = createApp();

describe('PTO Types Routes', () => {
  beforeAll(async () => {
    await initMockDb();
  });

  describe('GET /api/v1/pto-types', () => {
    it('should return PTO types list for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/pto-types')
        .set(authHeader('developer'));

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
      expect(response.body).toHaveProperty('data');
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .get('/api/v1/pto-types');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/pto-types', () => {
    it('should create PTO type for admin', async () => {
      const response = await request(app)
        .post('/api/v1/pto-types')
        .set(authHeader('admin'))
        .send({
          name: 'Jury Duty',
          code: 'JURY',
          color: '#FF9800',
          isPaid: true,
          requiresApproval: false,
        });

      expect(response.status).toBe(201);
      expectSuccessResponse(response.body);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .post('/api/v1/pto-types')
        .send({
          name: 'Jury Duty',
          code: 'JURY',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/pto-types/:id', () => {
    it('should update PTO type for admin', async () => {
      const response = await request(app)
        .patch('/api/v1/pto-types/test-type-id')
        .set(authHeader('admin'))
        .send({
          name: 'Updated Type Name',
        });

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .patch('/api/v1/pto-types/test-type-id')
        .send({
          name: 'Updated Type Name',
        });

      expect(response.status).toBe(401);
    });
  });
});
