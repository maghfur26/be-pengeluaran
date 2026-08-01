import mongoose from 'mongoose';

let cached = global as typeof globalThis & {
  mongooseConn: typeof mongoose | null;
};

if (!cached.mongooseConn) {
  cached.mongooseConn = null;
}

const connectDB = async (): Promise<typeof mongoose> => {
  if (cached.mongooseConn) {
    return cached.mongooseConn;
  }

  const conn = await mongoose.connect(process.env.MONGODB_URI || '');
  cached.mongooseConn = conn;
  console.log(`MongoDB connected: ${conn.connection.host}`);
  return conn;
};

export default connectDB;
