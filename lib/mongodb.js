import mongoose from 'mongoose';

/**
 * Koneksi MongoDB dengan cache global.
 * Di serverless (Vercel) tiap request bisa memanggil fungsi ini berulang; cache mencegah
 * pembuatan koneksi baru setiap kali dan hot-reload dev membocorkan koneksi.
 */
let cached = globalThis._mongoose;
if (!cached) cached = globalThis._mongoose = { conn: null, promise: null };

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI belum diisi di .env');
  if (cached.conn) return cached.conn;
  cached.promise ??= mongoose.connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 8000 });
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // izinkan percobaan ulang pada request berikutnya
    throw e;
  }
  return cached.conn;
}
