import User from '../models/User';

const ADMIN_EMAIL = 'hasanimaghfur9@gmail.com';
const ADMIN_PASSWORD = 'iot@1999';

// Ensure the admin account exists (idempotent, safe for serverless cold starts)
export async function ensureAdmin(): Promise<void> {
  try {
    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        await existing.save();
      }
      return;
    }
    await User.create({
      name: 'Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin'
    });
    console.log(`Admin seeded: ${ADMIN_EMAIL}`);
  } catch (error) {
    console.error('Gagal memastikan akun admin:', error);
  }
}
