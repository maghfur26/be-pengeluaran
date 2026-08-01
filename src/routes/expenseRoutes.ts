import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
  getMonthlyExpenses,
  getDailyExpenses
} from '../controllers/expenseController';

const router = Router();

router.use(authMiddleware);

// GET /api/expenses - Get all expenses
router.get('/', getExpenses);

// GET /api/expenses/summary - Get expense summary (must be before /:id)
router.get('/summary', getExpenseSummary);

// GET /api/expenses/monthly - Get monthly expenses for chart
router.get('/monthly', getMonthlyExpenses);

// GET /api/expenses/daily - Get daily expenses for a specific month
router.get('/daily', getDailyExpenses);

// GET /api/expenses/:id - Get single expense
router.get('/:id', getExpense);

// POST /api/expenses - Create expense
router.post('/', createExpense);

// PUT /api/expenses/:id - Update expense
router.put('/:id', updateExpense);

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', deleteExpense);

export default router;
