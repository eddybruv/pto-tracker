import { Router } from 'express';
import { asyncHandler } from '../../types/express.js';

const router = Router();

/**
 * GET /pto-types
 * List all PTO types
 */
router.get('/', asyncHandler(async (_req, res) => {
  // TODO: Implement PTO types listing
  res.json({
    success: true,
    data: [],
  });
}));

/**
 * POST /pto-types
 * Create new PTO type (admin only)
 */
router.post('/', asyncHandler(async (_req, res) => {
  // TODO: Implement PTO type creation
  res.status(201).json({
    success: true,
    data: {},
  });
}));

/**
 * PATCH /pto-types/:id
 * Update PTO type (admin only)
 */
router.patch('/:id', asyncHandler(async (req, res) => {
  // TODO: Implement PTO type update
  res.json({
    success: true,
    data: { id: req.params['id'] },
  });
}));

export default router;
