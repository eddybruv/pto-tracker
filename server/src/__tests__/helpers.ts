/**
 * Test utilities and helpers
 */

import request from 'supertest';
import { Express } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt-testing-only';

/**
 * Generate a test JWT token
 */
export function generateTestToken(
  userId: string,
  email: string,
  roles: Role[] = ['developer']
): string {
  return jwt.sign(
    { userId, email, roles },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Test user fixtures
 */
export const testUsers = {
  admin: {
    id: 'test-admin-id',
    email: 'admin@test.com',
    roles: ['admin'] as Role[],
  },
  techLead: {
    id: 'test-lead-id',
    email: 'lead@test.com',
    roles: ['tech_lead'] as Role[],
  },
  developer: {
    id: 'test-dev-id',
    email: 'dev@test.com',
    roles: ['developer'] as Role[],
  },
};

/**
 * Get auth header for a test user
 */
export function authHeader(user: keyof typeof testUsers): { Authorization: string } {
  const u = testUsers[user];
  const token = generateTestToken(u.id, u.email, u.roles);
  return { Authorization: `Bearer ${token}` };
}

/**
 * Make authenticated request helper
 */
export function authenticatedRequest(app: Express, user: keyof typeof testUsers = 'developer') {
  const agent = request(app);
  const headers = authHeader(user);
  
  return {
    get: (url: string) => agent.get(url).set(headers),
    post: (url: string) => agent.post(url).set(headers),
    put: (url: string) => agent.put(url).set(headers),
    patch: (url: string) => agent.patch(url).set(headers),
    delete: (url: string) => agent.delete(url).set(headers),
  };
}

/**
 * Assert response structure
 */
export function expectSuccessResponse(body: unknown): void {
  expect(body).toHaveProperty('success', true);
  expect(body).toHaveProperty('data');
}

export function expectErrorResponse(body: unknown): void {
  expect(body).toHaveProperty('success', false);
  expect(body).toHaveProperty('error');
  expect((body as { error: { code: string } }).error).toHaveProperty('code');
  expect((body as { error: { message: string } }).error).toHaveProperty('message');
}
