import fs from 'node:fs/promises';
import path from 'node:path';
import { route, bad, HttpError } from '@/lib/api';
import { UPLOAD_DIR } from '@/lib/storage';

const TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.pdf': 'application/pdf' };

/** Hanya untuk development lokal (tanpa Vercel Blob). Wajib login. */
export const GET = route(async ({ params }) => {
  if (!/^[\w.-]+$/.test(params.name)) throw bad('Nama file tidak valid');
  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, params.name));
    return new Response(data, { headers: { 'Content-Type': TYPES[path.extname(params.name).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'private, max-age=3600' } });
  } catch {
    throw new HttpError(404, 'File tidak ditemukan');
  }
});
