import { Router } from 'express';
import { query, queryOne, transaction } from '../../config/database.js';
import { asyncHandler } from '../../types/express.js';
import { AppError } from '../../utils/errors.js';
import type { PtoBalance, BalanceLedger } from '../../types/index.js';

const router = Router();

const BALANCE_QUERY = `
  SELECT pb.*, pt.name as pto_type_name, pt.code as pto_type_code, pt.color as pto_type_color
  FROM pto_balances pb
  JOIN pto_types pt ON pt.id = pb.pto_type_id
`;

/**
 * GET /balances
 * Get current user's balances
 */
router.get('/', asyncHandler(async (req, res) => {
  const balances = await query<PtoBalance & { ptoTypeName: string; ptoTypeCode: string; ptoTypeColor: string }>(
    `${BALANCE_QUERY} WHERE pb.user_id = $1 ORDER BY pt.name`,
    [req.user.userId]
  );

  res.json({ success: true, data: balances });
}));

/**
 * GET /balances/user/:userId
 * Get balances for specific user (admin/manager)
 */
router.get('/user/:userId', asyncHandler(async (req, res) => {
  const balances = await query<PtoBalance & { ptoTypeName: string; ptoTypeCode: string; ptoTypeColor: string }>(
    `${BALANCE_QUERY} WHERE pb.user_id = $1 ORDER BY pt.name`,
    [req.params['userId']]
  );

  res.json({ success: true, data: balances });
}));

/**
 * GET /balances/ledger
 * Get balance ledger/history for current user
 */
router.get('/ledger', asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query['page']) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 20));
  const offset = (page - 1) * limit;
  const userId = (req.query['userId'] as string) || req.user.userId;

  const [entries, countResult] = await Promise.all([
    query<BalanceLedger & { ptoTypeName: string }>(
      `SELECT bl.*, pt.name as pto_type_name
       FROM balance_ledger bl
       JOIN pto_types pt ON pt.id = bl.pto_type_id
       WHERE bl.user_id = $1
       ORDER BY bl.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    ),
    queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM balance_ledger WHERE user_id = $1',
      [userId]
    ),
  ]);

  const total = Number(countResult?.count ?? 0);

  res.json({
    success: true,
    data: entries,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}));

/**
 * POST /balances/adjust
 * Manual balance adjustment (admin only)
 */
router.post('/adjust', asyncHandler(async (req, res) => {
  const { userId, ptoTypeId, hours, description } = req.body;

  if (!userId || !ptoTypeId || hours === undefined) {
    throw AppError.badRequest('userId, ptoTypeId, and hours are required');
  }

  const result = await transaction(async (tx) => {
    const balance = await tx.queryOne<PtoBalance>(
      'SELECT * FROM pto_balances WHERE user_id = $1 AND pto_type_id = $2 FOR UPDATE',
      [userId, ptoTypeId]
    );

    if (!balance) throw AppError.notFound('Balance not found for this user and PTO type');

    const newAvailable = balance.availableHours + hours;

    await tx.query(
      `UPDATE pto_balances SET available_hours = $1 WHERE id = $2`,
      [newAvailable, balance.id]
    );

    const ledger = await tx.queryOne<BalanceLedger>(
      `INSERT INTO balance_ledger (user_id, pto_type_id, transaction_type, hours, running_balance, effective_date, adjusted_by, description)
       VALUES ($1, $2, 'adjustment', $3, $4, CURRENT_DATE, $5, $6)
       RETURNING *`,
      [userId, ptoTypeId, hours, newAvailable, req.user.userId, description || 'Manual adjustment']
    );

    return ledger;
  });

  res.json({ success: true, data: result });
}));

export default router;
