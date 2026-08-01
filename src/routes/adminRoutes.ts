import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetPassword
} from '../controllers/adminController';

const router = Router();

router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/users - List all users
router.get('/', getUsers);

// GET /api/admin/users/:id - Get single user
router.get('/:id', getUser);

// POST /api/admin/users - Create user
router.post('/', createUser);

// PUT /api/admin/users/:id - Update user
router.put('/:id', updateUser);

// DELETE /api/admin/users/:id - Delete user
router.delete('/:id', deleteUser);

// POST /api/admin/users/:id/reset-password - Reset user password
router.post('/:id/reset-password', resetPassword);

export default router;
