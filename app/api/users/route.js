import bcrypt from 'bcryptjs';
import { route, json, readBody, bad } from '@/lib/api';
import { User } from '@/lib/models';

export const GET = route(async () => json(await User.find().sort({ createdAt: 1 })), { superOnly: true });

export const POST = route(async ({ req }) => {
  const { email = '', password = '', role = 'admin' } = await readBody(req);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw bad('Email tidak valid');
  if (String(password).length < 8) throw bad('Password minimal 8 karakter');
  if (!['admin', 'super_admin'].includes(role)) throw bad('Peran tidak valid');
  const user = await User.create({ email, role, passwordHash: await bcrypt.hash(password, 12) });
  return json(await User.findById(user._id), 201);
}, { superOnly: true });
