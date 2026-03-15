import { Router } from 'express';
import { query } from '../../config/database.js';
import { asyncHandler } from '../../types/express.js';
import { AppError } from '../../utils/errors.js';

const router = Router();

/**
 * GET /calendar/team
 * Get approved/pending PTO requests for the team in a given month.
 * Returns requests with nested user and ptoType info for calendar display.
 *
 * Query params:
 *   month - yyyy-MM format (required)
 */
router.get('/team', asyncHandler(async (req, res) => {
  const month = req.query['month'] as string;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    throw AppError.badRequest('month query param is required in yyyy-MM format');
  }

  const startDate = `${month}-01`;
  // Last day of the month
  const endDate = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)
    .toISOString().split('T')[0];

  const rows = await query<Record<string, unknown>>(
    `SELECT
       pr.id, pr.user_id, pr.pto_type_id, pr.start_date, pr.end_date,
       pr.is_half_day_start, pr.is_half_day_end, pr.total_hours,
       pr.notes, pr.status, pr.created_at, pr.updated_at,
       u.id as "u_id", u.first_name as "u_first_name", u.last_name as "u_last_name", u.email as "u_email",
       pt.id as "pt_id", pt.name as "pt_name", pt.code as "pt_code", pt.color as "pt_color"
     FROM pto_requests pr
     JOIN users u ON u.id = pr.user_id
     JOIN pto_types pt ON pt.id = pr.pto_type_id
     WHERE pr.status IN ('approved', 'pending')
       AND pr.start_date <= $2
       AND pr.end_date >= $1
     ORDER BY pr.start_date, u.last_name`,
    [startDate, endDate]
  );

  // Shape into nested objects the frontend expects
  const data = rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    ptoTypeId: r.ptoTypeId,
    startDate: r.startDate,
    endDate: r.endDate,
    isHalfDayStart: r.isHalfDayStart,
    isHalfDayEnd: r.isHalfDayEnd,
    totalHours: r.totalHours,
    notes: r.notes,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    user: {
      id: r.uId,
      firstName: r.uFirstName,
      lastName: r.uLastName,
      email: r.uEmail,
    },
    ptoType: {
      id: r.ptId,
      name: r.ptName,
      code: r.ptCode,
      color: r.ptColor,
    },
  }));

  res.json({ success: true, data });
}));

export default router;
