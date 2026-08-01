import { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import app from '../src/server';

let cachedDb: typeof mongoose | null = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const conn = await mongoose.connect(process.env.MONGODB_URI || '');
  cachedDb = conn;
  return conn;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await connectToDatabase();
  return app(req, res);
}
