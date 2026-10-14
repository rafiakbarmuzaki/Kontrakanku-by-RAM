import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from './mongodb';
import { getUser } from './auth';

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const bad = (msg) => new HttpError(400, msg);
export const json = (data, status = 200) => NextResponse.json(data, { status });
export const checkId = (id) => { if (!mongoose.isValidObjectId(id)) throw bad('ID tidak valid'); return id; };

/**
 * Pembungkus Route Handler: koneksi DB, autentikasi, cek peran, dan pemetaan error ke JSON.
 *   export const GET = route(async ({ req, user, params }) => json(...));
 *   export const DELETE = route(handler, { superOnly: true });
 */
export function route(fn, { superOnly = false, open = false } = {}) {
  return async (req, ctx) => {
    try {
      await connectDB();
      let user = null;
      if (!open) {
        user = await getUser();
        if (!user) throw new HttpError(401, 'Silakan login');
        if (superOnly && user.role !== 'super_admin') throw new HttpError(403, 'Hanya super admin');
      }
      const params = ctx?.params ? await ctx.params : {};
      return await fn({ req, user, params });
    } catch (e) {
      return errorResponse(e);
    }
  };
}

function errorResponse(e) {
  if (e instanceof HttpError) return json({ error: e.message }, e.status);
  if (e?.code === 11000) return json({ error: 'Data duplikat (nomor unit / KTP / email / periode sudah ada)' }, 409);
  if (e?.name === 'ValidationError') return json({ error: Object.values(e.errors)[0]?.message || 'Data tidak valid' }, 400);
  if (e?.name === 'CastError') return json({ error: 'Format data tidak valid' }, 400);
  console.error(e);
  if (/MONGODB_URI|JWT_SECRET/.test(e?.message)) return json({ error: e.message }, 500);
  if (/ServerSelection|ECONNREFUSED|ENOTFOUND|authentication failed/i.test(`${e?.name} ${e?.message}`)) {
    return json({ error: 'Tidak bisa terhubung ke database. Periksa MONGODB_URI dan izin IP di MongoDB Atlas.' }, 503);
  }
  return json({ error: 'Terjadi kesalahan server' }, 500);
}

/** Baca body JSON atau multipart/form-data menjadi objek biasa (file ada di key aslinya). */
export async function readBody(req) {
  if ((req.headers.get('content-type') || '').includes('multipart/form-data')) {
    return Object.fromEntries((await req.formData()).entries());
  }
  return req.json().catch(() => ({}));
}
