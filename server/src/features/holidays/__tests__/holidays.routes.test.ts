/**
 * Holidays Routes Integration Tests
 */

import request from 'supertest';
import { createApp } from '../../../app';
import { initMockDb } from '../../../config/mock-db';
import { authHeader, expectSuccessResponse } from '../../../__tests__/helpers';

const app = createApp();

describe('Holidays Routes', () => {
  beforeAll(async () => {
    await initMockDb();
  });

  describe('GET /api/v1/holidays', () => {
    it('should return holidays list for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/holidays')
        .set(authHeader('developer'));

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
      expect(response.body).toHaveProperty('data');
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .get('/api/v1/holidays');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/holidays', () => {
    it('should create holiday for admin', async () => {
      const response = await request(app)
        .post('/api/v1/holidays')
        .set(authHeader('admin'))
        .send({
          name: 'Company Day',
          date: '2026-06-15',
          isRecurring: false,
        });

      expect(response.status).toBe(201);
      expectSuccessResponse(response.body);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .post('/api/v1/holidays')
        .send({
          name: 'Company Day',
          date: '2026-06-15',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/holidays/:id', () => {
    it('should delete holiday for admin', async () => {
      const response = await request(app)
        .delete('/api/v1/holidays/test-holiday-id')
        .set(authHeader('admin'));

      expect(response.status).toBe(204);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .delete('/api/v1/holidays/test-holiday-id');

      expect(response.status).toBe(401);
    });
  });
});
