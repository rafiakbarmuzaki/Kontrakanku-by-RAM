import crypto from 'node:crypto';
import { Counter } from './models';
import { waLink, receiptMessage } from './phone';

/** Nomor kwitansi berurutan per bulan: KW-202610-0001 (atomik, aman untuk request bersamaan). */
export async function nextReceiptNo(date = new Date()) {
  const key = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const c = await Counter.findOneAndUpdate({ _id: `receipt-${key}` }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return `KW-${key}-${String(c.seq).padStart(4, '0')}`;
}

/** Token acak untuk tautan publik kwitansi (tidak bisa ditebak). */
export const newToken = () => crypto.randomBytes(18).toString('base64url');

/**
 * Tanda tangan digital kwitansi: HMAC-SHA256 atas isi pentingnya dengan kunci rahasia server.
 * Disimpan saat kwitansi dibuat; saat diverifikasi dihitung ulang dari data terkini. Jika ada
 * yang mengubah jumlah/tanggal/penghuni di database, kodenya tidak lagi cocok.
 * (Alokasi per periode sengaja tidak ikut ditandatangani: bisa terhitung ulang bila ada
 * pembayaran lain dihapus, sementara jumlah dan tanggal uang masuk tetap.)
 */
export function signReceipt({ receiptNo, tenantId, amount, paymentDate, period }) {
  // period hanya ada pada kwitansi format lama; ikut ditandatangani agar kwitansi lama tetap valid.
  const data = [receiptNo, String(tenantId), ...(period ? [period] : []), amount, new Date(paymentDate).toISOString().slice(0, 10)].join('|');
  return crypto.createHmac('sha256', process.env.JWT_SECRET).update(data).digest('hex');
}

/** "AB12C-D34EF-..." versi ringkas yang dicetak di kwitansi. */
export const signatureCode = (sig) => sig.slice(0, 20).toUpperCase().match(/.{1,5}/g).join('-');

export const issuer = () => ({
  owner: process.env.OWNER_NAME || 'Pemilik Kontrakan',
  property: process.env.PROPERTY_NAME || 'Kontrakan Damai',
  address: process.env.PROPERTY_ADDRESS || '',
});

/** Basis URL publik untuk tautan kwitansi (PUBLIC_URL di produksi, origin request saat lokal). */
export const publicBase = (req) => (process.env.PUBLIC_URL || new URL(req.url).origin).replace(/\/$/, '');

/** Tautan kwitansi + tautan WhatsApp siap kirim untuk sebuah pembayaran. */
export function describePayment(payment, { tenant, base }) {
  const receiptUrl = `${base}/kwitansi/${payment.token}`;
  const { owner, property } = issuer();
  const message = receiptMessage({
    name: tenant.name, receiptNo: payment.receiptNo, amount: payment.amount, allocations: payment.allocations ?? [],
    remaining: payment.remainingAfter ?? 0, url: receiptUrl, owner, property,
  });
  return { receiptUrl, remaining: payment.remainingAfter ?? 0, message, waLink: waLink(tenant.phone, message) };
}
