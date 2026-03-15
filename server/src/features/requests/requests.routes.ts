import { Router } from 'express';
import { query, queryOne, transaction } from '../../config/database.js';
import { asyncHandler } from '../../types/express.js';
import { AppError } from '../../utils/errors.js';
import type { PtoRequest, PtoBalance } from '../../types/index.js';

const router = Router();

/**
 * GET /requests
 * List PTO requests (own requests, or team if manager/admin)
 */
router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query['page']) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 20));
  const offset = (page - 1) * limit;
  const status = req.query['status'] as string | undefined;
  const isAdmin = req.user.roles.includes('admin');
  const isLead = req.user.roles.includes('tech_lead');

  let whereClause = '';
  const params: unknown[] = [];
  let idx = 1;

  if (isAdmin) {
    // Admin sees all requests
    whereClause = 'WHERE 1=1';
  } else if (isLead) {
    // Tech lead sees own + team requests
    whereClause = `WHERE (pr.user_id = $${idx} OR u.manager_id = $${idx})`;
    params.push(req.user.userId);
    idx++;
  } else {
    // Developer sees only own
    whereClause = `WHERE pr.user_id = $${idx}`;
    params.push(req.user.userId);
    idx++;
  }

  if (status) {
    whereClause += ` AND pr.status = $${idx}`;
    params.push(status);
    idx++;
  }

  const countParams = [...params];

  params.push(limit, offset);

  const requests = await query<PtoRequest & { firstName: string; lastName: string; ptoTypeName: string; ptoTypeColor: string }>(
    `SELECT pr.*, u.first_name, u.last_name, pt.name as pto_type_name, pt.color as pto_type_color
     FROM pto_requests pr
     JOIN users u ON u.id = pr.user_id
     JOIN pto_types pt ON pt.id = pr.pto_type_id
     ${whereClause}
     ORDER BY pr.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    params
  );

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM pto_requests pr JOIN users u ON u.id = pr.user_id ${whereClause}`,
    countParams
  );

  const total = Number(countResult?.count ?? 0);

  res.json({
    success: true,
    data: requests,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}));

/**
 * GET /requests/:id
 * Get request by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const request = await queryOne<PtoRequest & { firstName: string; lastName: string; ptoTypeName: string }>(
    `SELECT pr.*, u.first_name, u.last_name, pt.name as pto_type_name
     FROM pto_requests pr
     JOIN users u ON u.id = pr.user_id
     JOIN pto_types pt ON pt.id = pr.pto_type_id
     WHERE pr.id = $1`,
    [req.params['id']]
  );

  if (!request) throw AppError.notFound('Request not found');

  res.json({ success: true, data: request });
}));

/**
 * POST /requests
 * Create new PTO request
 */
router.post('/', asyncHandler(async (req, res) => {
  const { ptoTypeId, startDate, endDate, isHalfDayStart, isHalfDayEnd, totalHours, notes } = req.body;
  const userId = req.user.userId;

  if (!ptoTypeId || !startDate || !endDate || !totalHours) {
    throw AppError.badRequest('ptoTypeId, startDate, endDate, and totalHours are required');
  }

  const result = await transaction(async (tx) => {
    // Check balance sufficiency
    const balance = await tx.queryOne<PtoBalance>(
      'SELECT * FROM pto_balances WHERE user_id = $1 AND pto_type_id = $2 FOR UPDATE',
      [userId, ptoTypeId]
    );

    if (!balance) throw AppError.badRequest('No balance found for this PTO type');

    if (balance.availableHours - balance.pendingHours < totalHours) {
      throw AppError.badRequest('Insufficient PTO balance');
    }

    // Check for overlapping requests
    const overlap = await tx.queryOne<{ id: string }>(
      `SELECT id FROM pto_requests
       WHERE user_id = $1 AND status IN ('pending', 'approved')
       AND start_date <= $3 AND end_date >= $2`,
      [userId, startDate, endDate]
    );

    if (overlap) throw AppError.conflict('You have an overlapping PTO request for these dates');

    // Create request
    const request = await tx.queryOne<PtoRequest>(
      `INSERT INTO pto_requests (user_id, pto_type_id, start_date, end_date, is_half_day_start, is_half_day_end, total_hours, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING *`,
      [userId, ptoTypeId, startDate, endDate, isHalfDayStart ?? false, isHalfDayEnd ?? false, totalHours, notes || null]
    );

    if (!request) throw AppError.internal('Failed to create request');

    // Update pending balance
    await tx.query(
      'UPDATE pto_balances SET pending_hours = pending_hours + $1 WHERE user_id = $2 AND pto_type_id = $3',
      [totalHours, userId, ptoTypeId]
    );

    // Create pending ledger entry
    await tx.query(
      `INSERT INTO balance_ledger (user_id, pto_type_id, transaction_type, hours, running_balance, effective_date, request_id, description)
       VALUES ($1, $2, 'debit', $3, $4, $5, $6, 'PTO request submitted')`,
      [userId, ptoTypeId, -totalHours, balance.availableHours, startDate, request.id]
    );

    // Create approval record — find the user's manager or an admin
    const approver = await tx.queryOne<{ id: string }>(
      `SELECT COALESCE(
         (SELECT manager_id FROM users WHERE id = $1 AND manager_id IS NOT NULL),
         (SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id JOIN roles r ON r.id = ur.role_id WHERE r.name = 'admin' AND u.id != $1 LIMIT 1)
       ) as id`,
      [userId]
    );

    if (approver?.id) {
      await tx.query(
        `INSERT INTO approvals (request_id, approver_id, status) VALUES ($1, $2, 'pending')`,
        [request.id, approver.id]
      );
    }

    return request;
  });

  res.status(201).json({ success: true, data: result });
}));

/**
 * PATCH /requests/:id
 * Update PTO request (only if pending)
 */
router.patch('/:id', asyncHandler(async (req, res) => {
  const { startDate, endDate, isHalfDayStart, isHalfDayEnd, totalHours, notes } = req.body;

  const existing = await queryOne<PtoRequest>(
    'SELECT * FROM pto_requests WHERE id = $1 AND user_id = $2',
    [req.params['id'], req.user.userId]
  );

  if (!existing) throw AppError.notFound('Request not found');
  if (existing.status !== 'pending') throw AppError.badRequest('Only pending requests can be updated');

  const result = await transaction(async (tx) => {
    const newHours = totalHours ?? existing.totalHours;
    const hoursDiff = newHours - existing.totalHours;

    if (hoursDiff !== 0) {
      await tx.query(
        'UPDATE pto_balances SET pending_hours = pending_hours + $1 WHERE user_id = $2 AND pto_type_id = $3',
        [hoursDiff, req.user.userId, existing.ptoTypeId]
      );
    }

    return tx.queryOne<PtoRequest>(
      `UPDATE pto_requests SET
         start_date = COALESCE($1, start_date),
         end_date = COALESCE($2, end_date),
         is_half_day_start = COALESCE($3, is_half_day_start),
         is_half_day_end = COALESCE($4, is_half_day_end),
         total_hours = COALESCE($5, total_hours),
         notes = COALESCE($6, notes)
       WHERE id = $7 RETURNING *`,
      [startDate || null, endDate || null, isHalfDayStart ?? null, isHalfDayEnd ?? null,
       totalHours ?? null, notes ?? null, req.params['id']]
    );
  });

  res.json({ success: true, data: result });
}));

/**
 * POST /requests/:id/cancel
 * Cancel PTO request
 */
router.post('/:id/cancel', asyncHandler(async (req, res) => {
  const result = await transaction(async (tx) => {
    const request = await tx.queryOne<PtoRequest>(
      'SELECT * FROM pto_requests WHERE id = $1 FOR UPDATE',
      [req.params['id']]
    );

    if (!request) throw AppError.notFound('Request not found');

    // Only the owner or an admin can cancel
    if (request.userId !== req.user.userId && !req.user.roles.includes('admin')) {
      throw AppError.forbidden('You can only cancel your own requests');
    }

    if (request.status === 'cancelled') throw AppError.badRequest('Request is already cancelled');

    // Reverse balance changes
    if (request.status === 'pending') {
      await tx.query(
        'UPDATE pto_balances SET pending_hours = pending_hours - $1 WHERE user_id = $2 AND pto_type_id = $3',
        [request.totalHours, request.userId, request.ptoTypeId]
      );
    } else if (request.status === 'approved') {
      await tx.query(
        `UPDATE pto_balances SET
           available_hours = available_hours + $1,
           used_ytd = used_ytd - $1
         WHERE user_id = $2 AND pto_type_id = $3`,
        [request.totalHours, request.userId, request.ptoTypeId]
      );
    }

    // Create reversal ledger entry
    const balance = await tx.queryOne<PtoBalance>(
      'SELECT available_hours FROM pto_balances WHERE user_id = $1 AND pto_type_id = $2',
      [request.userId, request.ptoTypeId]
    );

    await tx.query(
      `INSERT INTO balance_ledger (user_id, pto_type_id, transaction_type, hours, running_balance, effective_date, request_id, description)
       VALUES ($1, $2, 'adjustment', $3, $4, CURRENT_DATE, $5, 'Request cancelled')`,
      [request.userId, request.ptoTypeId, request.totalHours, balance?.availableHours ?? 0, request.id]
    );

    const updated = await tx.queryOne<PtoRequest>(
      `UPDATE pto_requests SET status = 'cancelled', cancelled_at = NOW(), cancelled_by = $1
       WHERE id = $2 RETURNING *`,
      [req.user.userId, request.id]
    );

    return updated;
  });

  res.json({ success: true, data: result });
}));

export default router;
