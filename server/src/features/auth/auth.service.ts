import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env.js';
import { query, queryOne, transaction, TxClient } from '../../config/database.js';
import { AppError } from '../../utils/errors.js';
import { Role, TokenPayload, AuthTokens, LoginResponse, User } from '../../types/index.js';

const SALT_ROUNDS = 12;

type SafeUser = Omit<User, 'passwordHash' | 'passwordResetToken' | 'passwordResetExpires'>;

function stripSensitive(user: User): SafeUser {
  const { passwordHash: _, passwordResetToken: __, passwordResetExpires: ___, ...safe } = user;
  return safe;
}

async function getUserRoles(userId: string): Promise<Role[]> {
  const rows = await query<{ name: Role }>(
    `SELECT r.name FROM roles r
     JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1`,
    [userId]
  );
  return rows.map(r => r.name);
}

export async function getCurrentUser(userId: string): Promise<SafeUser & { roles: Role[] }> {
  const user = await queryOne<User>(
    'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
    [userId]
  );

  if (!user) throw AppError.notFound('User not found');

  const roles = await getUserRoles(user.id);
  return { ...stripSensitive(user), roles };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const user = await queryOne<User>(
    'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
    [email.toLowerCase()]
  );

  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  if (user.status !== 'active') {
    throw AppError.unauthorized('Account is not active');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const roles = await getUserRoles(user.id);
  const tokens = await generateTokens(user.id, user.email, roles);

  return {
    user: stripSensitive(user),
    tokens,
    roles,
  };
}

export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  hireDate: string;
  timezone?: string;
}): Promise<LoginResponse> {
  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
    [data.email.toLowerCase()]
  );

  if (existing) {
    throw AppError.conflict('An account with this email already exists');
  }

  const passwordHash = await hashPassword(data.password);

  return transaction(async (tx) => {
    const user = await tx.queryOne<User>(
      `INSERT INTO users (email, password_hash, first_name, last_name, hire_date, timezone, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')
       RETURNING *`,
      [data.email.toLowerCase(), passwordHash, data.firstName, data.lastName, data.hireDate, data.timezone || 'America/New_York']
    );

    if (!user) throw AppError.internal('Failed to create user');

    await tx.query(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT $1, id FROM roles WHERE name = 'developer'`,
      [user.id]
    );

    // Assign all active policies and create default balances
    // 20 vacation days (160h), 7 sick days (56h), 7 personal days (56h)
    const defaultHours: Record<string, number> = { VAC: 160, SICK: 56, PERS: 56 };

    const policies = await tx.query<{ id: string; ptoTypeId: string; code: string }>(
      `SELECT p.id, p.pto_type_id, pt.code
       FROM policies p
       JOIN pto_types pt ON pt.id = p.pto_type_id
       WHERE p.is_active = true AND pt.is_active = true`
    );

    for (const policy of policies) {
      await tx.query(
        `INSERT INTO policy_assignments (user_id, policy_id, effective_date)
         VALUES ($1, $2, $3)`,
        [user.id, policy.id, data.hireDate]
      );

      const hours = defaultHours[policy.code] ?? 0;
      await tx.query(
        `INSERT INTO pto_balances (user_id, pto_type_id, policy_id, available_hours, pending_hours, used_ytd, accrued_ytd, carryover_hours)
         VALUES ($1, $2, $3, $4, 0, 0, $4, 0)`,
        [user.id, policy.ptoTypeId, policy.id, hours]
      );
    }

    const roles = ['developer'] as Role[];
    const tokens = await generateTokens(user.id, user.email, roles, tx);

    return {
      user: stripSensitive(user),
      tokens,
      roles,
    };
  });
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const tokenRecord = await queryOne<{ id: string; userId: string }>(
    `SELECT id, user_id FROM refresh_tokens
     WHERE token = $1 AND expires_at > NOW() AND revoked_at IS NULL`,
    [refreshToken]
  );

  if (!tokenRecord) {
    throw AppError.unauthorized('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
  }

  const user = await queryOne<User>(
    'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
    [tokenRecord.userId]
  );

  if (!user || user.status !== 'active') {
    throw AppError.unauthorized('User not found or inactive');
  }

  // Revoke old token
  await query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1',
    [refreshToken]
  );

  const roles = await getUserRoles(user.id);
  return generateTokens(user.id, user.email, roles);
}

export async function logout(refreshToken: string): Promise<void> {
  await query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1',
    [refreshToken]
  );
}

export async function logoutAll(userId: string): Promise<void> {
  await query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
    [userId]
  );
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
  roles: Role[],
  tx?: TxClient
): Promise<AuthTokens> {
  const payload: TokenPayload = { userId, email, roles };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);

  const refreshToken = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const execQuery = tx ? tx.query : query;
  await execQuery(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, refreshToken, expiresAt]
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 900,
  };
}
