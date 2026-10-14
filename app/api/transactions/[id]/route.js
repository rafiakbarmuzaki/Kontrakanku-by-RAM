import { route, json, checkId } from '@/lib/api';
import { Transaction, Payment } from '@/lib/models';
import { deleteProof } from '@/lib/storage';

/** Hapus tagihan beserta semua pembayaran, kwitansi, dan file buktinya (hanya super admin). */
export const DELETE = route(async ({ params }) => {
  const id = checkId(params.id);
  const pays = await Payment.find({ transaction: id }, 'proofUrl');
  await Payment.deleteMany({ transaction: id });
  await Transaction.findByIdAndDelete(id);
  await Promise.all(pays.map((p) => deleteProof(p.proofUrl)));
  return json({ ok: true });
}, { superOnly: true });
