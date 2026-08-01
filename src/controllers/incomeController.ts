import { Response } from 'express';
import Income from '../models/Income';
import { AuthRequest, getUserId } from '../middleware/auth';

// Get all incomes
export const getIncomes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, search } = req.query;

    const filter: any = { userId: getUserId(req) };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    if (search) {
      filter.description = { $regex: search, $options: 'i' };
    }

    const incomes = await Income.find(filter).sort({ date: -1 });

    res.json({
      success: true,
      data: incomes,
      count: incomes.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pemasukan'
    });
  }
};

// Get single income
export const getIncome = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const income = await Income.findOne({ _id: req.params.id, userId: getUserId(req) });

    if (!income) {
      res.status(404).json({
        success: false,
        message: 'Pemasukan tidak ditemukan'
      });
      return;
    }

    res.json({ success: true, data: income });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data pemasukan'
    });
  }
};

// Create income
export const createIncome = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { description, amount, date, notes } = req.body;

    const income = await Income.create({
      userId: getUserId(req),
      description,
      amount,
      date: date || new Date(),
      notes
    });

    res.status(201).json({
      success: true,
      data: income,
      message: 'Pemasukan berhasil ditambahkan'
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
        message: 'Gagal menambahkan pemasukan'
      });
    }
  }
};

// Update income
export const updateIncome = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, userId: getUserId(req) },
      req.body,
      { new: true, runValidators: true }
    );

    if (!income) {
      res.status(404).json({
        success: false,
        message: 'Pemasukan tidak ditemukan'
      });
      return;
    }

    res.json({
      success: true,
      data: income,
      message: 'Pemasukan berhasil diupdate'
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
        message: 'Gagal mengupdate pemasukan'
      });
    }
  }
};

// Delete income
export const deleteIncome = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const income = await Income.findOneAndDelete({ _id: req.params.id, userId: getUserId(req) });

    if (!income) {
      res.status(404).json({
        success: false,
        message: 'Pemasukan tidak ditemukan'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Pemasukan berhasil dihapus'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus pemasukan'
    });
  }
};

// Get income summary (total)
export const getIncomeSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const matchFilter: any = { userId: getUserId(req) };
    if (startDate || endDate) {
      matchFilter.date = {};
      if (startDate) matchFilter.date.$gte = new Date(startDate as string);
      if (endDate) matchFilter.date.$lte = new Date(endDate as string);
    }

    const result = await Income.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const total = result.length > 0 ? result[0].total : 0;
    const count = result.length > 0 ? result[0].count : 0;

    res.json({
      success: true,
      data: { total, count }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil ringkasan pemasukan'
    });
  }
};
