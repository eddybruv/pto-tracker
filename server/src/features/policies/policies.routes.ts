import { Router } from 'express';
import { query, queryOne, transaction } from '../../config/database.js';
import { asyncHandler } from '../../types/express.js';
import { requireRoles } from '../../middleware/auth.js';
import { AppError } from '../../utils/errors.js';
import type { Policy } from '../../types/index.js';

const router = Router();

/**
 * GET /policies
 * List all policies (admin only)
 */
router.get('/', asyncHandler(async (_req, res) => {
  const policies = await query<Policy & { ptoTypeName: string }>(
    `SELECT p.*, pt.name as pto_type_name
     FROM policies p
     JOIN pto_types pt ON pt.id = p.pto_type_id
     WHERE p.is_active = true
     ORDER BY p.name`
  );

  res.json({ success: true, data: policies });
}));

/**
 * GET /policies/:id
 * Get policy by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const policy = await queryOne<Policy & { ptoTypeName: string }>(
    `SELECT p.*, pt.name as pto_type_name
     FROM policies p
     JOIN pto_types pt ON pt.id = p.pto_type_id
     WHERE p.id = $1`,
    [req.params['id']]
  );

  if (!policy) throw AppError.notFound('Policy not found');

  res.json({ success: true, data: policy });
}));

/**
 * POST /policies
 * Create new policy (admin only)
 */
router.post('/', requireRoles('admin') as never, asyncHandler(async (req, res) => {
  const {
    name, ptoTypeId, accrualRate, accrualFrequency, maxAccrual,
    carryoverCap, carryoverExpiryMonths, allowNegative, maxNegative,
    probationDays, minIncrementHours,
  } = req.body;

  const policy = await queryOne<Policy>(
    `INSERT INTO policies (
       name, pto_type_id, accrual_rate, accrual_frequency, max_accrual,
       carryover_cap, carryover_expiry_months, allow_negative, max_negative,
       probation_days, min_increment_hours
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [name, ptoTypeId, accrualRate, accrualFrequency || 'monthly', maxAccrual ?? null,
     carryoverCap ?? null, carryoverExpiryMonths ?? null, allowNegative ?? false,
     maxNegative ?? 0, probationDays ?? 0, minIncrementHours ?? 1]
  );

  res.status(201).json({ success: true, data: policy });
}));

/**
 * PATCH /policies/:id
 * Update policy (admin only)
 */
router.patch('/:id', requireRoles('admin') as never, asyncHandler(async (req, res) => {
  const allowed = [
    'name', 'accrualRate', 'accrualFrequency', 'maxAccrual', 'carryoverCap',
    'carryoverExpiryMonths', 'allowNegative', 'maxNegative', 'probationDays',
    'minIncrementHours', 'isActive',
  ];

  const snakeMap: Record<string, string> = {
    name: 'name', accrualRate: 'accrual_rate', accrualFrequency: 'accrual_frequency',
    maxAccrual: 'max_accrual', carryoverCap: 'carryover_cap',
    carryoverExpiryMonths: 'carryover_expiry_months', allowNegative: 'allow_negative',
    maxNegative: 'max_negative', probationDays: 'probation_days',
    minIncrementHours: 'min_increment_hours', isActive: 'is_active',
  };

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      fields.push(`${snakeMap[key]} = $${idx++}`);
      values.push(req.body[key]);
    }
  }

  if (fields.length === 0) throw AppError.badRequest('No fields to update');

  values.push(req.params['id']);

  const policy = await queryOne<Policy>(
    `UPDATE policies SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  if (!policy) throw AppError.notFound('Policy not found');

  res.json({ success: true, data: policy });
}));

/**
 * POST /policies/:id/assign
 * Assign policy to users
 */
router.post('/:id/assign', requireRoles('admin') as never, asyncHandler(async (req, res) => {
  const policyId = req.params['id'];
  const { userIds, effectiveDate } = req.body as { userIds: string[]; effectiveDate?: string };

  if (!userIds?.length) throw AppError.badRequest('userIds array is required');

  const policy = await queryOne<Policy>('SELECT * FROM policies WHERE id = $1', [policyId]);
  if (!policy) throw AppError.notFound('Policy not found');

  await transaction(async (tx) => {
    for (const userId of userIds) {
      await tx.query(
        `INSERT INTO policy_assignments (user_id, policy_id, effective_date)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, policy_id, effective_date) DO NOTHING`,
        [userId, policyId, effectiveDate || new Date().toISOString().split('T')[0]]
      );

      // Create initial balance if it doesn't exist
      await tx.query(
        `INSERT INTO pto_balances (user_id, pto_type_id, policy_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, pto_type_id) DO NOTHING`,
        [userId, policy.ptoTypeId, policyId]
      );
    }
  });

  res.json({ success: true, data: { policyId, assignedCount: userIds.length } });
}));

export default router;
