import { Response } from 'express';
import mongoose from 'mongoose';
import Expense from '../models/Expense';
import { AuthRequest } from '../middleware/auth';

const getUserId = (req: AuthRequest): mongoose.Types.ObjectId =>
  new mongoose.Types.ObjectId(req.userId as string);

// Get all expenses with optional filtering
export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, startDate, endDate, search } = req.query;
    
    const filter: any = { userId: getUserId(req) };
    
    if (category) {
      filter.category = category;
    }
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }
    
    if (search) {
      filter.description = { $regex: search, $options: 'i' };
    }
    
    const expenses = await Expense.find(filter).sort({ date: -1 });
    
    res.json({
      success: true,
      data: expenses,
      count: expenses.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal mengambil data pengeluaran' 
    });
  }
};

// Get single expense
export const getExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: getUserId(req) });
    
    if (!expense) {
      res.status(404).json({ 
        success: false, 
        message: 'Pengeluaran tidak ditemukan' 
      });
      return;
    }
    
    res.json({ success: true, data: expense });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal mengambil data pengeluaran' 
    });
  }
};

// Create expense
export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { description, amount, category, date, notes } = req.body;
    
    const expense = await Expense.create({
      userId: getUserId(req),
      description,
      amount,
      category,
      date: date || new Date(),
      notes
    });
    
    res.status(201).json({ 
      success: true, 
      data: expense,
      message: 'Pengeluaran berhasil ditambahkan' 
    });
  } catch (error: any) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ 
        success: false, 
        message: messages.join(', ') 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Gagal menambahkan pengeluaran' 
      });
    }
  }
};

// Update expense
export const updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: getUserId(req) },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!expense) {
      res.status(404).json({ 
        success: false, 
        message: 'Pengeluaran tidak ditemukan' 
      });
      return;
    }
    
    res.json({ 
      success: true, 
      data: expense,
      message: 'Pengeluaran berhasil diupdate' 
    });
  } catch (error: any) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ 
        success: false, 
        message: messages.join(', ') 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Gagal mengupdate pengeluaran' 
      });
    }
  }
};

// Delete expense
export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: getUserId(req) });
    
    if (!expense) {
      res.status(404).json({ 
        success: false, 
        message: 'Pengeluaran tidak ditemukan' 
      });
      return;
    }
    
    res.json({ 
      success: true, 
      message: 'Pengeluaran berhasil dihapus' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal menghapus pengeluaran' 
    });
  }
};

// Get monthly expenses (for chart)
export const getMonthlyExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { year } = req.query;
    const matchFilter: any = { userId: getUserId(req) };

    if (year) {
      const startOfYear = new Date(`${year}-01-01`);
      const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);
      matchFilter.date = { $gte: startOfYear, $lte: endOfYear };
    }

    const monthly = await Expense.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    const result = monthly.map((item) => ({
      year: item._id.year,
      month: item._id.month,
      monthName: new Date(item._id.year, item._id.month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      total: item.total,
      count: item.count
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pengeluaran bulanan'
    });
  }
};

// Get daily expenses for a specific month (for detailed view)
export const getDailyExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      res.status(400).json({
        success: false,
        message: 'Parameter year dan month wajib diisi'
      });
      return;
    }

    const startDate = new Date(`${year}-${String(month).padStart(2, '0')}-01`);
    const nextMonth = new Date(startDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const daily = await Expense.aggregate([
      { $match: { userId: getUserId(req), date: { $gte: startDate, $lt: nextMonth } } },
      {
        $group: {
          _id: { $dayOfMonth: '$date' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
    const result = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const found = daily.find((item) => item._id === d);
      result.push({
        day: d,
        total: found ? found.total : 0,
        count: found ? found.count : 0
      });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pengeluaran harian'
    });
  }
};

// Get expense summary by category
export const getExpenseSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchFilter: any = { userId: getUserId(req) };
    if (startDate || endDate) {
      matchFilter.date = {};
      if (startDate) matchFilter.date.$gte = new Date(startDate as string);
      if (endDate) matchFilter.date.$lte = new Date(endDate as string);
    }
    
    const summary = await Expense.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);
    
    const totalExpenses = summary.reduce((acc, item) => acc + item.total, 0);
    
    res.json({
      success: true,
      data: {
        summary,
        total: totalExpenses
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal mengambil ringkasan pengeluaran' 
    });
  }
};
