/**
 * PTO Requests Routes Integration Tests
 */

import request from 'supertest';
import { createApp } from '../../../app';
import { initMockDb } from '../../../config/mock-db';
import { authHeader, expectSuccessResponse } from '../../../__tests__/helpers';

const app = createApp();

describe('Requests Routes', () => {
  beforeAll(async () => {
    await initMockDb();
  });

  describe('GET /api/v1/requests', () => {
    it('should return requests list for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/requests')
        .set(authHeader('developer'));

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .get('/api/v1/requests');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/requests/:id', () => {
    it('should return request by ID for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/requests/test-request-id')
        .set(authHeader('developer'));

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .get('/api/v1/requests/test-request-id');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/requests', () => {
    it('should create request for authenticated user', async () => {
      const response = await request(app)
        .post('/api/v1/requests')
        .set(authHeader('developer'))
        .send({
          ptoTypeId: 'vacation-type-id',
          startDate: '2026-03-01',
          endDate: '2026-03-05',
          notes: 'Spring break',
        });

      expect(response.status).toBe(201);
      expectSuccessResponse(response.body);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .post('/api/v1/requests')
        .send({
          ptoTypeId: 'vacation-type-id',
          startDate: '2026-03-01',
          endDate: '2026-03-05',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/requests/:id', () => {
    it('should update request for authenticated user', async () => {
      const response = await request(app)
        .patch('/api/v1/requests/test-request-id')
        .set(authHeader('developer'))
        .send({
          notes: 'Updated notes',
        });

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
    });
  });

  describe('POST /api/v1/requests/:id/cancel', () => {
    it('should cancel request for authenticated user', async () => {
      const response = await request(app)
        .post('/api/v1/requests/test-request-id/cancel')
        .set(authHeader('developer'));

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
      expect(response.body.data.status).toBe('cancelled');
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .post('/api/v1/requests/test-request-id/cancel');

      expect(response.status).toBe(401);
    });
  });
});
