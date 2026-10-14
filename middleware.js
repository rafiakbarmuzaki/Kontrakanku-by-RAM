import { NextResponse } from 'next/server';
import { verifyToken, COOKIE } from '@/lib/token';

/**
 * Gerbang login: tanpa token valid, halaman dialihkan ke /login dan API dijawab 401.
 * Pengecekan peran dan keberadaan akun dilakukan di tiap Route Handler (lib/api.js).
 */
export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const valid = Boolean(await verifyToken(req.cookies.get(COOKIE)?.value || ''));

  if (pathname === '/login') {
    return valid ? NextResponse.redirect(new URL('/', req.url)) : NextResponse.next();
  }
  // Kwitansi bersifat publik: dibuka penghuni dari tautan WhatsApp dan tujuan scan QR.
  if (pathname === '/api/auth/login' || pathname.startsWith('/kwitansi/') || pathname.startsWith('/verifikasi/') || pathname.startsWith('/api/receipts/')) return NextResponse.next();
  if (valid) return NextResponse.next();

  return pathname.startsWith('/api')
    ? NextResponse.json({ error: 'Silakan login' }, { status: 401 })
    : NextResponse.redirect(new URL('/login', req.url));
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
