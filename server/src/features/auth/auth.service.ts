import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env.js';
import { mockDb } from '../../config/mock-db.js';
import { AppError } from '../../utils/errors.js';
import { Role, TokenPayload, AuthTokens, LoginResponse } from '../../types/index.js';

const SALT_ROUNDS = 12;

export async function login(email: string, password: string): Promise<LoginResponse> {
  // Find user using mock db
  const user = mockDb.findUserByEmail(email.toLowerCase());

  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  if (user.status !== 'active') {
    throw AppError.unauthorized('Account is not active');
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user._passwordHash);
  if (!isValid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  // Get user roles
  const roles = mockDb.getUserRoles(user.id);

  // Generate tokens
  const tokens = await generateTokens(user.id, user.email, roles);

  // Return user without sensitive fields
  const { _passwordHash: _, passwordHash: __, passwordResetToken: ___, passwordResetExpires: ____, ...safeUser } = user;

  return {
    user: safeUser,
    tokens,
    roles,
  };
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  // Find and validate refresh token using mock db
  const tokenRecord = mockDb.findRefreshToken(refreshToken);

  if (!tokenRecord) {
    throw AppError.unauthorized('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
  }

  // Get user and roles
  const user = mockDb.findUserById(tokenRecord.user_id);

  if (!user || user.status !== 'active') {
    throw AppError.unauthorized('User not found or inactive');
  }

  const roles = mockDb.getUserRoles(user.id);

  // Revoke old refresh token
  mockDb.deleteRefreshToken(refreshToken);

  // Generate new tokens
  return generateTokens(user.id, user.email, roles);
}

export async function logout(refreshToken: string): Promise<void> {
  mockDb.deleteRefreshToken(refreshToken);
}

export async function logoutAll(userId: string): Promise<void> {
  mockDb.deleteUserRefreshTokens(userId);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

async function generateTokens(
  userId: string,
  email: string,
  roles: Role[]
): Promise<AuthTokens> {
  const payload: TokenPayload = { userId, email, roles };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);

  const refreshToken = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  // Store refresh token in mock db
  mockDb.saveRefreshToken(userId, refreshToken, expiresAt);

  return {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
  };
}
