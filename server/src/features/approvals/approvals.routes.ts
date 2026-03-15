import { Router } from 'express';
import { query, queryOne, transaction } from '../../config/database.js';
import { asyncHandler } from '../../types/express.js';
import { AppError } from '../../utils/errors.js';
import type { Approval, PtoRequest, PtoBalance } from '../../types/index.js';

const router = Router();

/**
 * GET /approvals
 * List pending approvals for current user (as approver)
 */
router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query['page']) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 20));
  const offset = (page - 1) * limit;
  const status = (req.query['status'] as string) || 'pending';

  const [approvals, countResult] = await Promise.all([
    query<Approval & { firstName: string; lastName: string; ptoTypeName: string; ptoTypeColor: string; startDate: Date; endDate: Date; totalHours: number; requestNotes: string | null }>(
      `SELECT a.*, u.first_name, u.last_name, pt.name as pto_type_name, pt.color as pto_type_color,
              pr.start_date, pr.end_date, pr.total_hours, pr.notes as request_notes
       FROM approvals a
       JOIN pto_requests pr ON pr.id = a.request_id
       JOIN users u ON u.id = pr.user_id
       JOIN pto_types pt ON pt.id = pr.pto_type_id
       WHERE a.approver_id = $1 AND a.status = $2
       ORDER BY pr.start_date ASC
       LIMIT $3 OFFSET $4`,
      [req.user.userId, status, limit, offset]
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM approvals a
       JOIN pto_requests pr ON pr.id = a.request_id
       WHERE a.approver_id = $1 AND a.status = $2`,
      [req.user.userId, status]
    ),
  ]);

  const total = Number(countResult?.count ?? 0);

  res.json({
    success: true,
    data: approvals,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}));

/**
 * POST /approvals/:requestId/approve
 * Approve a PTO request
 */
router.post('/:requestId/approve', asyncHandler(async (req, res) => {
  const { comment } = req.body ?? {};

  const result = await processDecision(req.params['requestId']!, req.user.userId, 'approved', comment);

  res.json({ success: true, data: result });
}));

/**
 * POST /approvals/:requestId/deny
 * Deny a PTO request
 */
router.post('/:requestId/deny', asyncHandler(async (req, res) => {
  const { comment } = req.body ?? {};

  const result = await processDecision(req.params['requestId']!, req.user.userId, 'denied', comment);

  res.json({ success: true, data: result });
}));

/**
 * POST /approvals/bulk
 * Bulk approve/deny requests
 */
router.post('/bulk', asyncHandler(async (req, res) => {
  const { decisions } = req.body as { decisions: { requestId: string; status: 'approved' | 'denied'; comment?: string }[] };

  if (!decisions?.length) throw AppError.badRequest('decisions array is required');

  const results = [];
  for (const decision of decisions) {
    const result = await processDecision(decision.requestId, req.user.userId, decision.status, decision.comment);
    results.push(result);
  }

  res.json({ success: true, data: { processed: results.length, results } });
}));

async function processDecision(
  requestId: string,
  approverId: string,
  decision: 'approved' | 'denied',
  comment?: string
) {
  return transaction(async (tx) => {
    // Verify approval record exists and belongs to this approver
    const approval = await tx.queryOne<Approval>(
      `SELECT * FROM approvals WHERE request_id = $1 AND approver_id = $2 AND status = 'pending' FOR UPDATE`,
      [requestId, approverId]
    );

    if (!approval) throw AppError.notFound('Pending approval not found for this request');

    // Get the request
    const request = await tx.queryOne<PtoRequest>(
      'SELECT * FROM pto_requests WHERE id = $1 FOR UPDATE',
      [requestId]
    );

    if (!request) throw AppError.notFound('Request not found');
    if (request.status !== 'pending') throw AppError.badRequest('Request is no longer pending');

    // Update approval
    await tx.query(
      `UPDATE approvals SET status = $1, comment = $2, responded_at = NOW() WHERE id = $3`,
      [decision, comment || null, approval.id]
    );

    // Update request status
    await tx.query(
      'UPDATE pto_requests SET status = $1 WHERE id = $2',
      [decision, requestId]
    );

    // Update balances
    if (decision === 'approved') {
      await tx.query(
        `UPDATE pto_balances SET
           pending_hours = pending_hours - $1,
           available_hours = available_hours - $1,
           used_ytd = used_ytd + $1
         WHERE user_id = $2 AND pto_type_id = $3`,
        [request.totalHours, request.userId, request.ptoTypeId]
      );
    } else {
      // Denied — reverse pending
      await tx.query(
        'UPDATE pto_balances SET pending_hours = pending_hours - $1 WHERE user_id = $2 AND pto_type_id = $3',
        [request.totalHours, request.userId, request.ptoTypeId]
      );
    }

    // Ledger entry
    const balance = await tx.queryOne<PtoBalance>(
      'SELECT available_hours FROM pto_balances WHERE user_id = $1 AND pto_type_id = $2',
      [request.userId, request.ptoTypeId]
    );

    const txnType = decision === 'approved' ? 'debit' : 'adjustment';
    const description = decision === 'approved' ? 'Request approved' : 'Request denied — balance restored';
    const hours = decision === 'approved' ? -request.totalHours : request.totalHours;

    await tx.query(
      `INSERT INTO balance_ledger (user_id, pto_type_id, transaction_type, hours, running_balance, effective_date, request_id, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [request.userId, request.ptoTypeId, txnType, hours, balance?.availableHours ?? 0, request.startDate, requestId, description]
    );

    return { requestId, status: decision, comment: comment || null };
  });
}

export default router;
