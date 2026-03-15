import { Router } from 'express';
import { query, queryOne } from '../../config/database.js';
import { asyncHandler } from '../../types/express.js';
import { requireRoles } from '../../middleware/auth.js';
import { AppError } from '../../utils/errors.js';
import type { PtoType } from '../../types/index.js';

const router = Router();

/**
 * GET /pto-types
 * List all PTO types
 */
router.get('/', asyncHandler(async (_req, res) => {
  const types = await query<PtoType>(
    'SELECT * FROM pto_types WHERE is_active = true ORDER BY name'
  );

  res.json({ success: true, data: types });
}));

/**
 * POST /pto-types
 * Create new PTO type (admin only)
 */
router.post('/', requireRoles('admin') as never, asyncHandler(async (req, res) => {
  const { name, code, color, isPaid, requiresApproval } = req.body;

  const ptoType = await queryOne<PtoType>(
    `INSERT INTO pto_types (name, code, color, is_paid, requires_approval)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, code, color || '#3B82F6', isPaid ?? true, requiresApproval ?? true]
  );

  res.status(201).json({ success: true, data: ptoType });
}));

/**
 * PATCH /pto-types/:id
 * Update PTO type (admin only)
 */
router.patch('/:id', requireRoles('admin') as never, asyncHandler(async (req, res) => {
  const { name, code, color, isPaid, requiresApproval, isActive } = req.body;

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
  if (code !== undefined) { fields.push(`code = $${idx++}`); values.push(code); }
  if (color !== undefined) { fields.push(`color = $${idx++}`); values.push(color); }
  if (isPaid !== undefined) { fields.push(`is_paid = $${idx++}`); values.push(isPaid); }
  if (requiresApproval !== undefined) { fields.push(`requires_approval = $${idx++}`); values.push(requiresApproval); }
  if (isActive !== undefined) { fields.push(`is_active = $${idx++}`); values.push(isActive); }

  if (fields.length === 0) throw AppError.badRequest('No fields to update');

  values.push(req.params['id']);

  const ptoType = await queryOne<PtoType>(
    `UPDATE pto_types SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  if (!ptoType) throw AppError.notFound('PTO type not found');

  res.json({ success: true, data: ptoType });
}));

export default router;
