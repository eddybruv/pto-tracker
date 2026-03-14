import { Router } from 'express';
import { asyncHandler } from '../../types/express.js';

const router = Router();

/**
 * GET /holidays
 * List all holidays
 */
router.get('/', asyncHandler(async (_req, res) => {
  // TODO: Implement holidays listing
  res.json({
    success: true,
    data: [],
  });
}));

/**
 * POST /holidays
 * Create holiday (admin only)
 */
router.post('/', asyncHandler(async (_req, res) => {
  // TODO: Implement holiday creation
  res.status(201).json({
    success: true,
    data: {},
  });
}));

/**
 * DELETE /holidays/:id
 * Delete holiday (admin only)
 */
router.delete('/:id', asyncHandler(async (_req, res) => {
  // TODO: Implement holiday deletion
  res.status(204).send();
}));

export default router;
