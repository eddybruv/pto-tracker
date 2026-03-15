import { Router } from 'express';
import { query, queryOne } from '../../config/database.js';
import { asyncHandler } from '../../types/express.js';
import { AppError } from '../../utils/errors.js';
import type { Team } from '../../types/index.js';

const router = Router();

/**
 * GET /teams
 * List all active teams
 */
router.get('/', asyncHandler(async (_req, res) => {
  const teams = await query<Team & { leadFirstName: string | null; leadLastName: string | null; memberCount: string }>(
    `SELECT t.*, u.first_name as lead_first_name, u.last_name as lead_last_name,
            (SELECT COUNT(*) FROM users WHERE team_id = t.id AND deleted_at IS NULL)::text as member_count
     FROM teams t
     LEFT JOIN users u ON u.id = t.lead_id
     WHERE t.is_active = true
     ORDER BY t.name`
  );

  res.json({ success: true, data: teams });
}));

/**
 * GET /teams/:id
 * Get team by ID with members
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const team = await queryOne<Team>(
    'SELECT * FROM teams WHERE id = $1 AND is_active = true',
    [req.params['id']]
  );

  if (!team) throw AppError.notFound('Team not found');

  const members = await query<{ id: string; firstName: string; lastName: string; email: string; status: string }>(
    `SELECT id, first_name, last_name, email, status
     FROM users WHERE team_id = $1 AND deleted_at IS NULL
     ORDER BY last_name, first_name`,
    [team.id]
  );

  res.json({ success: true, data: { ...team, members } });
}));

/**
 * POST /teams
 * Create a new team (admin only)
 */
router.post('/', asyncHandler(async (req, res) => {
  const { name, code, leadId } = req.body;

  if (!name || !code) throw AppError.badRequest('name and code are required');

  const team = await queryOne<Team>(
    `INSERT INTO teams (name, code, lead_id) VALUES ($1, $2, $3) RETURNING *`,
    [name, code, leadId || null]
  );

  res.status(201).json({ success: true, data: team });
}));

/**
 * PATCH /teams/:id
 * Update team
 */
router.patch('/:id', asyncHandler(async (req, res) => {
  const { name, code, leadId, isActive } = req.body;

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
  if (code !== undefined) { fields.push(`code = $${idx++}`); values.push(code); }
  if (leadId !== undefined) { fields.push(`lead_id = $${idx++}`); values.push(leadId); }
  if (isActive !== undefined) { fields.push(`is_active = $${idx++}`); values.push(isActive); }

  if (fields.length === 0) throw AppError.badRequest('No fields to update');

  values.push(req.params['id']);

  const team = await queryOne<Team>(
    `UPDATE teams SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  if (!team) throw AppError.notFound('Team not found');

  res.json({ success: true, data: team });
}));

export default router;
