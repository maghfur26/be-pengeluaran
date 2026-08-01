import { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/server';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
