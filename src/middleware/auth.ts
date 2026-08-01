import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User';

export interface AuthRequest extends Request {
  userId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export const signToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const getUserId = (req: AuthRequest): mongoose.Types.ObjectId =>
  new mongoose.Types.ObjectId(req.userId as string);

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
    return;
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = payload.userId;

    // Track last active (fire-and-forget, non-blocking)
    User.updateOne({ _id: payload.userId }, { lastActive: new Date() }).catch(() => {});

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token tidak valid atau sudah kedaluwarsa' });
  }
};

export const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(401).json({ success: false, message: 'Tidak terautentikasi' });
      return;
    }
    if (user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Akses ditolak. Hanya admin yang diizinkan.' });
      return;
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal memverifikasi hak akses admin' });
  }
};
