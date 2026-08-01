import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getIncomes,
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome,
  getIncomeSummary
} from '../controllers/incomeController';

const router = Router();

router.use(authMiddleware);

// GET /api/incomes - Get all incomes
router.get('/', getIncomes);

// GET /api/incomes/summary - Get income summary (must be before /:id)
router.get('/summary', getIncomeSummary);

// GET /api/incomes/:id - Get single income
router.get('/:id', getIncome);

// POST /api/incomes - Create income
router.post('/', createIncome);

// PUT /api/incomes/:id - Update income
router.put('/:id', updateIncome);

// DELETE /api/incomes/:id - Delete income
router.delete('/:id', deleteIncome);

export default router;
