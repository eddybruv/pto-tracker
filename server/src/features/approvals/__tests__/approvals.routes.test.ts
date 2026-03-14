/**
 * Approvals Routes Integration Tests
 */

import request from 'supertest';
import { createApp } from '../../../app';
import { initMockDb } from '../../../config/mock-db';
import { authHeader, expectSuccessResponse } from '../../../__tests__/helpers';

const app = createApp();

describe('Approvals Routes', () => {
  beforeAll(async () => {
    await initMockDb();
  });

  describe('GET /api/v1/approvals', () => {
    it('should return pending approvals for tech_lead', async () => {
      const response = await request(app)
        .get('/api/v1/approvals')
        .set(authHeader('techLead'));

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
      expect(response.body).toHaveProperty('data');
    });

    it('should return pending approvals for admin', async () => {
      const response = await request(app)
        .get('/api/v1/approvals')
        .set(authHeader('admin'));

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .get('/api/v1/approvals');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/approvals/:id/approve', () => {
    it('should approve request for tech_lead', async () => {
      const response = await request(app)
        .post('/api/v1/approvals/test-request-id/approve')
        .set(authHeader('techLead'))
        .send({
          comment: 'Approved!',
        });

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .post('/api/v1/approvals/test-request-id/approve');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/approvals/:id/deny', () => {
    it('should deny request for tech_lead', async () => {
      const response = await request(app)
        .post('/api/v1/approvals/test-request-id/deny')
        .set(authHeader('techLead'))
        .send({
          comment: 'Sorry, team is understaffed that week.',
        });

      expect(response.status).toBe(200);
      expectSuccessResponse(response.body);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .post('/api/v1/approvals/test-request-id/deny');

      expect(response.status).toBe(401);
    });
  });
});
