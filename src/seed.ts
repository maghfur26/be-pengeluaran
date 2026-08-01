import connectDB from './config/database';
import { ensureAdmin } from './config/seedAdmin';

const seed = async () => {
  try {
    await connectDB();
    await ensureAdmin();
    console.log('Seed selesai.');
    process.exit(0);
  } catch (error) {
    console.error('Seed gagal:', error);
    process.exit(1);
  }
};

seed();
