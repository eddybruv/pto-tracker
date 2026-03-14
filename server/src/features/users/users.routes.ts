import { Router } from 'express';
import { asyncHandler } from '../../types/express.js';

const router = Router();

/**
 * GET /users
 * List all users (admin only)
 */
router.get('/', asyncHandler(async (_req, res) => {
  // TODO: Implement user listing
  res.json({
    success: true,
    data: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  });
}));

/**
 * GET /users/:id
 * Get user by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  // TODO: Implement get user by ID
  res.json({
    success: true,
    data: { id: req.params['id'] },
  });
}));

/**
 * POST /users
 * Create new user (admin only)
 */
router.post('/', asyncHandler(async (_req, res) => {
  // TODO: Implement user creation
  res.status(201).json({
    success: true,
    data: {},
  });
}));

/**
 * PATCH /users/:id
 * Update user
 */
router.patch('/:id', asyncHandler(async (req, res) => {
  // TODO: Implement user update
  res.json({
    success: true,
    data: { id: req.params['id'] },
  });
}));

/**
 * DELETE /users/:id
 * Soft delete user (admin only)
 */
router.delete('/:id', asyncHandler(async (_req, res) => {
  // TODO: Implement user deletion
  res.status(204).send();
}));

export default router;
