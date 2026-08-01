import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import expenseRoutes from './routes/expenseRoutes';

dotenv.config();

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,https://pengeluaran-harian-nu.vercel.app')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

app.use('/api/expenses', expenseRoutes);
app.use('/expenses', expenseRoutes);

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
