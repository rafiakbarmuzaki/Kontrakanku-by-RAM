// Membuat akun super admin pertama.  Pakai: npm run admin   (atau: npm run admin -- email password)
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const email = (process.argv[2] || process.env.SUPER_EMAIL || '').trim().toLowerCase();
const password = process.argv[3] || process.env.SUPER_PASSWORD || '';
if (!process.env.MONGODB_URI) { console.error('MONGODB_URI belum diisi di .env'); process.exit(1); }
if (!email || password.length < 8) { console.error('Isi SUPER_EMAIL dan SUPER_PASSWORD (min 8 karakter) di .env'); process.exit(1); }

await mongoose.connect(process.env.MONGODB_URI);
const users = mongoose.connection.collection('users');
await users.createIndex({ email: 1 }, { unique: true });

if (await users.countDocuments({ role: 'super_admin' })) {
  console.log('Super admin sudah ada, tidak dibuat ulang.');
} else {
  const now = new Date();
  await users.insertOne({ email, passwordHash: await bcrypt.hash(password, 12), role: 'super_admin', createdAt: now, updatedAt: now });
  console.log('Super admin dibuat:', email);
}
await mongoose.disconnect();
