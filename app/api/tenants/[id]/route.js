import { route, json, readBody, checkId, HttpError } from '@/lib/api';
import { Tenant, Transaction, Payment } from '@/lib/models';
import { syncUnits, recomputeTenantLedger } from '@/lib/billing';
import { deleteProof } from '@/lib/storage';
import { pickTenant, assertUnitFree } from '@/lib/validators';

export const PUT = route(async ({ req, params }) => {
  const data = pickTenant(await readBody(req));
  await assertUnitFree(data.unit, checkId(params.id));
  const tenant = await Tenant.findByIdAndUpdate(params.id, data, { new: true, runValidators: true }).populate('unit', 'number price');
  if (!tenant) throw new HttpError(404, 'Penghuni tidak ditemukan');
  await syncUnits();
  await recomputeTenantLedger(tenant._id); // tanggal masuk / unit (harga) bisa berubah
  return json(tenant);
});

/** Menghapus penghuni juga menghapus tagihan, pembayaran, kwitansi, dan file buktinya. */
export const DELETE = route(async ({ params }) => {
  const id = checkId(params.id);
  const pays = await Payment.find({ tenant: id }, 'proofUrl');
  await Payment.deleteMany({ tenant: id });
  await Transaction.deleteMany({ tenant: id });
  await Tenant.findByIdAndDelete(id);
  await Promise.all(pays.map((p) => deleteProof(p.proofUrl)));
  await syncUnits();
  return json({ ok: true });
}, { superOnly: true });
