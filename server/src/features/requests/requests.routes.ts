import { Router } from 'express';
import { asyncHandler } from '../../types/express.js';

const router = Router();

/**
 * GET /requests
 * List PTO requests (own requests, or team if manager)
 */
router.get('/', asyncHandler(async (_req, res) => {
  // TODO: Implement requests listing
  res.json({
    success: true,
    data: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  });
}));

/**
 * GET /requests/:id
 * Get request by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  // TODO: Implement get request by ID
  res.json({
    success: true,
    data: { id: req.params['id'] },
  });
}));

/**
 * POST /requests
 * Create new PTO request
 */
router.post('/', asyncHandler(async (_req, res) => {
  // TODO: Implement request creation
  res.status(201).json({
    success: true,
    data: {},
  });
}));

/**
 * PATCH /requests/:id
 * Update PTO request (only if pending)
 */
router.patch('/:id', asyncHandler(async (req, res) => {
  // TODO: Implement request update
  res.json({
    success: true,
    data: { id: req.params['id'] },
  });
}));

/**
 * POST /requests/:id/cancel
 * Cancel PTO request
 */
router.post('/:id/cancel', asyncHandler(async (req, res) => {
  // TODO: Implement request cancellation
  res.json({
    success: true,
    data: { id: req.params['id'], status: 'cancelled' },
  });
}));

export default router;
