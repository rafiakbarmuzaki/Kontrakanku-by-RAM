import { put, del } from '@vercel/blob';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { bad, HttpError } from './api';

/**
 * Penyimpanan bukti transfer.
 *  - Produksi (Vercel): Vercel Blob, aktif jika BLOB_READ_WRITE_TOKEN ada.
 *  - Lokal: folder uploads/, dilayani lewat /api/proofs/[name] (wajib login).
 * Batas 4 MB karena body request serverless Vercel maksimal ~4,5 MB.
 */
export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX = 4 * 1024 * 1024;

export async function saveProof(file) {
  if (!file || typeof file === 'string' || !file.size) return '';
  if (!/^(image\/|application\/pdf$)/.test(file.type)) throw bad('Bukti harus berupa gambar atau PDF');
  if (file.size > MAX) throw bad('File maksimal 4 MB');
  const safe = file.name.replace(/[^\w.-]/g, '_');

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return (await put(`proofs/${safe}`, file, { access: 'public', addRandomSuffix: true })).url;
  }
  if (process.env.VERCEL) throw new HttpError(500, 'Penyimpanan bukti belum dikonfigurasi (BLOB_READ_WRITE_TOKEN)');
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = crypto.randomUUID() + path.extname(safe).toLowerCase();
  await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return `/api/proofs/${name}`;
}

export async function deleteProof(url) {
  if (!url) return;
  try {
    if (url.startsWith('http')) await del(url);
    else await fs.rm(path.join(UPLOAD_DIR, path.basename(url)), { force: true });
  } catch { /* file sudah hilang: abaikan */ }
}
