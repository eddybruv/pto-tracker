import { Router } from 'express';
import { query, queryOne } from '../../config/database.js';
import { asyncHandler } from '../../types/express.js';
import { requireRoles } from '../../middleware/auth.js';
import { AppError } from '../../utils/errors.js';
import type { Holiday } from '../../types/index.js';

const router = Router();

/**
 * GET /holidays
 * List all holidays
 */
router.get('/', asyncHandler(async (req, res) => {
  const year = req.query['year'] ? Number(req.query['year']) : undefined;

  let holidays: Holiday[];
  if (year) {
    holidays = await query<Holiday>(
      'SELECT * FROM holidays WHERE EXTRACT(YEAR FROM date) = $1 ORDER BY date',
      [year]
    );
  } else {
    holidays = await query<Holiday>(
      'SELECT * FROM holidays ORDER BY date'
    );
  }

  res.json({ success: true, data: holidays });
}));

/**
 * POST /holidays
 * Create holiday (admin only)
 */
router.post('/', requireRoles('admin') as never, asyncHandler(async (req, res) => {
  const { name, date, isRecurring, recurrenceRule } = req.body;

  if (!name || !date) throw AppError.badRequest('name and date are required');

  const holiday = await queryOne<Holiday>(
    `INSERT INTO holidays (name, date, is_recurring, recurrence_rule)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, date, isRecurring ?? false, recurrenceRule || null]
  );

  res.status(201).json({ success: true, data: holiday });
}));

/**
 * DELETE /holidays/:id
 * Delete holiday (admin only)
 */
router.delete('/:id', requireRoles('admin') as never, asyncHandler(async (req, res) => {
  const result = await queryOne<{ id: string }>(
    'DELETE FROM holidays WHERE id = $1 RETURNING id',
    [req.params['id']]
  );

  if (!result) throw AppError.notFound('Holiday not found');

  res.status(204).send();
}));

export default router;
