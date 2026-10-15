import { del } from '@vercel/blob';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Fitur unggah foto bukti transfer sudah dihapus dari aplikasi. Modul ini tinggal untuk
 * membersihkan file bukti LAMA (jika ada) saat pembayaran/penghuni yang memilikinya dihapus.
 *  - File di Vercel Blob (URL http...) dihapus lewat BLOB_READ_WRITE_TOKEN.
 *  - File lokal (/api/proofs/[name]) dihapus dari folder uploads/.
 */
export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function deleteProof(url) {
  if (!url) return;
  try {
    if (url.startsWith('http')) await del(url);
    else await fs.rm(path.join(UPLOAD_DIR, path.basename(url)), { force: true });
  } catch { /* file sudah hilang atau token tidak ada: abaikan */ }
}
