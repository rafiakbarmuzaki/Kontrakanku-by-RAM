import { route, json, HttpError } from '@/lib/api';
import { Payment } from '@/lib/models';
import { signReceipt, signatureCode, issuer, publicBase } from '@/lib/receipt';

/**
 * Publik (tanpa login): dipakai halaman /kwitansi/[token] dan tujuan scan QR.
 * Hanya mengembalikan data yang memang tercetak di kwitansi (tanpa telepon/KTP).
 */
export const GET = route(async ({ req, params }) => {
  const p = await Payment.findOne({ token: params.token }).populate('tenant', 'name').populate('unit', 'number');
  if (!p || !p.tenant) throw new HttpError(404, 'Kwitansi tidak ditemukan');

  const expected = signReceipt({ receiptNo: p.receiptNo, tenantId: p.tenant._id, amount: p.amount, paymentDate: p.paymentDate, period: p.period });
  return json({
    receiptNo: p.receiptNo,
    issuedAt: p.createdAt,
    signedAt: p.createdAt, // waktu kwitansi diterbitkan dan ditandatangani digital oleh sistem
    paymentDate: p.paymentDate,
    tenantName: p.tenant.name,
    unitNumber: p.unit?.number ?? '-',
    amount: p.amount,
    allocations: (p.allocations ?? []).map((a) => ({ period: a.period, amount: a.amount })),
    remaining: p.remainingAfter ?? 0, // sisa hutang total penghuni tepat setelah pembayaran ini
    issuer: issuer(),
    signatureCode: signatureCode(p.signature),
    valid: expected === p.signature, // false jika data kwitansi diubah setelah diterbitkan
    verifyUrl: `${publicBase(req)}/verifikasi/${p.token}`, // isi QR di kwitansi
  });
}, { open: true });
