import { route, json, checkId } from '@/lib/api';
import { Payment } from '@/lib/models';
import { recalcTransaction } from '@/lib/billing';
import { deleteProof } from '@/lib/storage';

/**
 * Hapus pembayaran yang salah input (hanya super admin). Kwitansinya ikut tidak berlaku
 * (tautan jadi 404) dan status tagihan dihitung ulang. Pembayaran tidak bisa diedit agar
 * kwitansi yang sudah terkirim tidak berubah isinya; koreksi = hapus lalu input ulang.
 */
export const DELETE = route(async ({ params }) => {
  const p = await Payment.findByIdAndDelete(checkId(params.id));
  if (p) {
    await deleteProof(p.proofUrl);
    await recalcTransaction(p.transaction);
  }
  return json({ ok: true });
}, { superOnly: true });
