import { route, json, checkId } from '@/lib/api';
import { Payment } from '@/lib/models';
import { recomputeTenantLedger } from '@/lib/billing';
import { deleteProof } from '@/lib/storage';

/**
 * Hapus pembayaran yang salah input (hanya super admin). Kwitansinya tidak berlaku lagi
 * (tautan jadi 404) dan seluruh alokasi penghuni itu dihitung ulang. Pembayaran tidak bisa
 * diedit agar kwitansi yang sudah terkirim tidak berubah isinya; koreksi = hapus lalu input ulang.
 */
export const DELETE = route(async ({ params }) => {
  const p = await Payment.findByIdAndDelete(checkId(params.id));
  if (p) {
    await deleteProof(p.proofUrl);
    await recomputeTenantLedger(p.tenant);
  }
  return json({ ok: true });
}, { superOnly: true });
