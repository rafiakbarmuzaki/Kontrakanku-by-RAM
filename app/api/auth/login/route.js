import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { route, HttpError, readBody } from '@/lib/api';
import { User } from '@/lib/models';
import { signToken, COOKIE, cookieOptions } from '@/lib/token';

export const POST = route(async ({ req }) => {
  const { email = '', password = '' } = await readBody(req);
  const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
    throw new HttpError(401, 'Email atau password salah');
  }
  const res = NextResponse.json({ id: String(user._id), email: user.email, role: user.role });
  res.cookies.set(COOKIE, await signToken(user._id), cookieOptions);
  return res;
}, { open: true });
