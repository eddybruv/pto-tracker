/**
 * Auth Service Unit Tests
 */

import bcrypt from 'bcryptjs';
import { initMockDb, mockDb, mockData } from '../../../config/mock-db';
import * as authService from '../auth.service';

describe('Auth Service', () => {
  beforeAll(async () => {
    await initMockDb();
  });

  describe('login', () => {
    it('should return user, tokens, and roles for valid credentials', async () => {
      const result = await authService.login('dev@company.com', 'admin123');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result).toHaveProperty('roles');
      expect(result.user.email).toBe('dev@company.com');
      expect(result.roles).toContain('developer');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw for non-existent user', async () => {
      await expect(
        authService.login('nonexistent@company.com', 'password')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw for wrong password', async () => {
      await expect(
        authService.login('dev@company.com', 'wrongpassword')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should be case-insensitive for email', async () => {
      const result = await authService.login('DEV@COMPANY.COM', 'admin123');
      expect(result.user.email).toBe('dev@company.com');
    });

    it('should return admin role for admin user', async () => {
      const result = await authService.login('admin@company.com', 'admin123');
      expect(result.roles).toContain('admin');
    });

    it('should return tech_lead role for lead user', async () => {
      const result = await authService.login('lead@company.com', 'admin123');
      expect(result.roles).toContain('tech_lead');
    });
  });

  describe('refreshTokens', () => {
    let validRefreshToken: string;

    beforeAll(async () => {
      const loginResult = await authService.login('dev@company.com', 'admin123');
      validRefreshToken = loginResult.tokens.refreshToken;
    });

    it('should return new tokens for valid refresh token', async () => {
      const result = await authService.refreshTokens(validRefreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.refreshToken).not.toBe(validRefreshToken);
    });

    it('should throw for invalid refresh token', async () => {
      await expect(
        authService.refreshTokens('invalid-token')
      ).rejects.toThrow('Invalid or expired refresh token');
    });
  });

  describe('logout', () => {
    it('should remove refresh token', async () => {
      const loginResult = await authService.login('admin@company.com', 'admin123');
      const refreshToken = loginResult.tokens.refreshToken;

      expect(mockDb.findRefreshToken(refreshToken)).toBeDefined();

      await authService.logout(refreshToken);

      expect(mockDb.findRefreshToken(refreshToken)).toBeUndefined();
    });
  });

  describe('logoutAll', () => {
    it('should remove all user refresh tokens', async () => {
      await authService.login('lead@company.com', 'admin123');
      await authService.login('lead@company.com', 'admin123');

      const user = mockDb.findUserByEmail('lead@company.com')!;
      const userTokensBefore = mockData.refreshTokens.filter(t => t.user_id === user.id);
      expect(userTokensBefore.length).toBeGreaterThanOrEqual(2);

      await authService.logoutAll(user.id);

      const userTokensAfter = mockData.refreshTokens.filter(t => t.user_id === user.id);
      expect(userTokensAfter.length).toBe(0);
    });
  });

  describe('hashPassword', () => {
    it('should return a hashed password', async () => {
      const password = 'TestPassword123!';
      const hash = await authService.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should create verifiable hash', async () => {
      const password = 'TestPassword123!';
      const hash = await authService.hashPassword(password);

      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for matching password', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 10);

      const result = await authService.verifyPassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const hash = await bcrypt.hash('correct-password', 10);

      const result = await authService.verifyPassword('wrong-password', hash);
      expect(result).toBe(false);
    });
  });
});
