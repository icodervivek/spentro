const mongoose = require('mongoose');

// Cache the connection promise so warm serverless invocations reuse it
let cached = global._mongoConn;
if (!cached) {
  cached = global._mongoConn = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not set in environment variables.');
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
  return cached.conn;
};

module.exports = connectDB;
