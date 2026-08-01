import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';
import expenseRoutes from './routes/expenseRoutes';

dotenv.config();

const app = express();

const defaultOrigins = [
  'http://localhost:5173',
  'https://pengeluaran-harian-nu.vercel.app'
];

const envOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Gagal terhubung ke database. Pastikan MONGODB_URI sudah diset.',
      detail: (error as Error).message
    });
  }
});

app.use('/api/expenses', expenseRoutes);
app.use('/expenses', expenseRoutes);

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
