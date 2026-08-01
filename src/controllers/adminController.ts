import { Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Expense from '../models/Expense';
import Income from '../models/Income';
import { AuthRequest } from '../middleware/auth';

const toUserJson = (user: any) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  lastActive: user.lastActive,
  createdAt: user.createdAt
});

// Get all users with transaction counts
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search } = req.query;

    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    const [expenseCounts, incomeCounts] = await Promise.all([
      Expense.aggregate([
        { $match: { userId: { $in: users.map((u) => u._id) } } },
        { $group: { _id: '$userId', count: { $sum: 1 }, total: { $sum: '$amount' } } }
      ]),
      Income.aggregate([
        { $match: { userId: { $in: users.map((u) => u._id) } } },
        { $group: { _id: '$userId', count: { $sum: 1 }, total: { $sum: '$amount' } } }
      ])
    ]);

    const expenseMap = new Map(expenseCounts.map((c) => [String(c._id), c]));
    const incomeMap = new Map(incomeCounts.map((c) => [String(c._id), c]));

    const data = users.map((user) => {
      const e = expenseMap.get(String(user._id));
      const i = incomeMap.get(String(user._id));
      return {
        ...toUserJson(user),
        expenseCount: e?.count ?? 0,
        expenseTotal: e?.total ?? 0,
        incomeCount: i?.count ?? 0,
        incomeTotal: i?.total ?? 0
      };
    });

    res.json({ success: true, data, count: data.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar user' });
  }
};

// Get single user
export const getUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      return;
    }

    const [expenseStats, incomeStats] = await Promise.all([
      Expense.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } }
      ]),
      Income.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        ...toUserJson(user),
        expenseCount: expenseStats[0]?.count ?? 0,
        expenseTotal: expenseStats[0]?.total ?? 0,
        incomeCount: incomeStats[0]?.count ?? 0,
        incomeTotal: incomeStats[0]?.total ?? 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data user' });
  }
};

// Create user
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
      return;
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'user'
    });

    res.status(201).json({
      success: true,
      data: toUserJson(user),
      message: 'User berhasil ditambahkan'
    });
  } catch (error: any) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ success: false, message: messages.join(', ') });
    } else {
      res.status(500).json({ success: false, message: 'Gagal menambahkan user' });
    }
  }
};

// Update user (name, email, role)
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, role } = req.body;
    const id = req.params.id;

    const existing = await User.findOne({ email: (email || '').toLowerCase(), _id: { $ne: id } });
    if (existing) {
      res.status(400).json({ success: false, message: 'Email sudah digunakan user lain' });
      return;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role === 'admin' ? 'admin' : 'user';

    const user = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!user) {
      res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      return;
    }

    res.json({
      success: true,
      data: toUserJson(user),
      message: 'User berhasil diupdate'
    });
  } catch (error: any) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ success: false, message: messages.join(', ') });
    } else {
      res.status(500).json({ success: false, message: 'Gagal mengupdate user' });
    }
  }
};

// Delete user (and their transactions)
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      return;
    }

    if (String(user._id) === String(req.userId)) {
      res.status(400).json({ success: false, message: 'Tidak bisa menghapus akun sendiri' });
      return;
    }

    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        res.status(400).json({ success: false, message: 'Tidak bisa menghapus admin terakhir' });
        return;
      }
    }

    const userId = user._id as mongoose.Types.ObjectId;
    await Promise.all([
      Expense.deleteMany({ userId }),
      Income.deleteMany({ userId }),
      User.findByIdAndDelete(user._id)
    ]);

    res.json({ success: true, message: 'User beserta datanya berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal menghapus user' });
  }
};

// Reset password
export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      return;
    }

    user.password = password;
    await user.save();

    res.json({
      success: true,
      message: 'Password user berhasil direset'
    });
  } catch (error: any) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ success: false, message: messages.join(', ') });
    } else {
      res.status(500).json({ success: false, message: 'Gagal mereset password' });
    }
  }
};
