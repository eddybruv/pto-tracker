/**
 * Users Routes Integration Tests
 */

import request from 'supertest';
import { createApp } from '../../../app';
import { initMockDb,  } from '../../../config/mock-db';
import { authHeader, expectSuccessResponse,  } from '../../../__tests__/helpers';

const app = createApp();

describe('Users Routes', () => {
  beforeAll(async () => {
    await initMockDb();
  });

  describe('GET /api/v1/users', () => {
    it('should return users list for authenticated admin', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set(authHeader('admin'));

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
      expect(response.body).toHaveProperty('data');
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .get('/api/v1/users');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return user by ID for admin', async () => {
      const response = await request(app)
        .get('/api/v1/users/test-user-id')
        .set(authHeader('admin'));

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/api/v1/users/test-user-id')
        .set(authHeader('developer'));

      expect(response.status).toBe(403);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .get('/api/v1/users/test-user-id');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/users', () => {
    it('should create user for admin', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .set(authHeader('admin'))
        .send({
          email: 'newuser@test.com',
          password: 'TestPass123!',
          firstName: 'New',
          lastName: 'User',
          hireDate: '2026-01-01',
        });

      expect(response.status).toBe(201);
      expectSuccessResponse(response.body);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .send({
          email: 'newuser@test.com',
          password: 'TestPass123!',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/users/:id', () => {
    it('should update user for authenticated user', async () => {
      const response = await request(app)
        .patch('/api/v1/users/test-user-id')
        .set(authHeader('admin'))
        .send({
          firstName: 'Updated',
        });

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should delete user for admin', async () => {
      const response = await request(app)
        .delete('/api/v1/users/test-user-id')
        .set(authHeader('admin'));

      expect(response.status).toBe(204);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .delete('/api/v1/users/test-user-id');

      expect(response.status).toBe(401);
    });
  });
});
