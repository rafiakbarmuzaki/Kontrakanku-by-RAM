// Hanya bergantung pada `jose` supaya aman dipakai di middleware (edge runtime).
import { SignJWT, jwtVerify } from 'jose';

export const COOKIE = 'token';
export const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 7 * 24 * 3600,
};

const secret = () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET belum diisi di .env');
  return new TextEncoder().encode(process.env.JWT_SECRET);
};

export const signToken = (userId) =>
  new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(String(userId)).setExpirationTime('7d').sign(secret());

/** Mengembalikan user id, atau null jika token tidak valid. */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.sub || null;
  } catch {
    return null;
  }
}
