import { Request, Response } from 'express';
import User from '../models/User';
import { signToken, AuthRequest } from '../middleware/auth';

const toUserJson = (user: any) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role
});

// Register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email: (email || '').toLowerCase() });
    if (existing) {
      res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
      return;
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user.id);

    res.status(201).json({
      success: true,
      data: { token, user: toUserJson(user) },
      message: 'Registrasi berhasil'
    });
  } catch (error: any) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ success: false, message: messages.join(', ') });
    } else {
      res.status(500).json({ success: false, message: 'Gagal melakukan registrasi' });
    }
  }
};

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ success: false, message: 'Email atau password salah' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Email atau password salah' });
      return;
    }

    user.lastActive = new Date();
    await user.save();

    const token = signToken(user.id);

    res.json({
      success: true,
      data: { token, user: toUserJson(user) },
      message: 'Login berhasil'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal melakukan login' });
  }
};

// Get current user
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      return;
    }

    res.json({
      success: true,
      data: { user: toUserJson(user) }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data user' });
  }
};
