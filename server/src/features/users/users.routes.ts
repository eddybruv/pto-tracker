import { Router } from 'express';
import { query, queryOne, transaction } from '../../config/database.js';
import { asyncHandler } from '../../types/express.js';
import { AppError } from '../../utils/errors.js';
import { hashPassword } from '../auth/auth.service.js';
import type { User, Role } from '../../types/index.js';

const router = Router();

type SafeUser = Omit<User, 'passwordHash' | 'passwordResetToken' | 'passwordResetExpires'>;

const SAFE_COLUMNS = `id, email, first_name, last_name, display_name, avatar_url,
  manager_id, team_id, hire_date, timezone, status, last_login_at, created_at, updated_at`;

/**
 * GET /users
 * List all users (admin only)
 */
router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query['page']) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 20));
  const offset = (page - 1) * limit;

  const [users, countResult] = await Promise.all([
    query<SafeUser>(
      `SELECT ${SAFE_COLUMNS} FROM users WHERE deleted_at IS NULL ORDER BY last_name, first_name LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    queryOne<{ count: string }>('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL'),
  ]);

  const total = Number(countResult?.count ?? 0);

  res.json({
    success: true,
    data: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}));

/**
 * GET /users/:id
 * Get user by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const user = await queryOne<SafeUser>(
    `SELECT ${SAFE_COLUMNS} FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [req.params['id']]
  );

  if (!user) throw AppError.notFound('User not found');

  const roles = await query<{ name: Role }>(
    'SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = $1',
    [user.id]
  );

  res.json({
    success: true,
    data: { ...user, roles: roles.map(r => r.name) },
  });
}));

/**
 * POST /users
 * Create new user (admin only)
 */
router.post('/', asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, managerId, teamId, hireDate, timezone, roles } = req.body;

  const passwordHash = await hashPassword(password);

  const user = await transaction(async (tx) => {
    const created = await tx.queryOne<SafeUser>(
      `INSERT INTO users (email, password_hash, first_name, last_name, manager_id, team_id, hire_date, timezone, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
       RETURNING ${SAFE_COLUMNS}`,
      [email.toLowerCase(), passwordHash, firstName, lastName, managerId || null, teamId || null, hireDate, timezone || 'America/New_York']
    );

    if (!created) throw AppError.internal('Failed to create user');

    const rolesToAssign: Role[] = roles?.length ? roles : ['developer'];
    for (const role of rolesToAssign) {
      await tx.query(
        `INSERT INTO user_roles (user_id, role_id) SELECT $1, id FROM roles WHERE name = $2`,
        [created.id, role]
      );
    }

    return created;
  });

  res.status(201).json({ success: true, data: user });
}));

/**
 * PATCH /users/:id
 * Update user
 */
router.patch('/:id', asyncHandler(async (req, res) => {
  const { firstName, lastName, managerId, teamId, timezone, status } = req.body;

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (firstName !== undefined) { fields.push(`first_name = $${idx++}`); values.push(firstName); }
  if (lastName !== undefined) { fields.push(`last_name = $${idx++}`); values.push(lastName); }
  if (managerId !== undefined) { fields.push(`manager_id = $${idx++}`); values.push(managerId); }
  if (teamId !== undefined) { fields.push(`team_id = $${idx++}`); values.push(teamId); }
  if (timezone !== undefined) { fields.push(`timezone = $${idx++}`); values.push(timezone); }
  if (status !== undefined) { fields.push(`status = $${idx++}`); values.push(status); }

  if (fields.length === 0) throw AppError.badRequest('No fields to update');

  values.push(req.params['id']);

  const user = await queryOne<SafeUser>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING ${SAFE_COLUMNS}`,
    values
  );

  if (!user) throw AppError.notFound('User not found');

  res.json({ success: true, data: user });
}));

/**
 * DELETE /users/:id
 * Soft delete user (admin only)
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const result = await queryOne<{ id: string }>(
    'UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id',
    [req.params['id']]
  );

  if (!result) throw AppError.notFound('User not found');

  res.status(204).send();
}));

export default router;
