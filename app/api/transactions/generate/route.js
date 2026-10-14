import { route, json, readBody, bad } from '@/lib/api';
import { Tenant, Transaction } from '@/lib/models';
import { currentPeriod } from '@/lib/billing';

/** Buat tagihan (status Overdue, belum dibayar) untuk semua penghuni yang belum punya tagihan di periode itu. */
export const POST = route(async ({ req }) => {
  const { period = currentPeriod() } = await readBody(req);
  if (!/^\d{4}-\d{2}$/.test(period)) throw bad('Periode tidak valid');
  const have = await Transaction.distinct('tenant', { period });
  const tenants = await Tenant.find({ _id: { $nin: have } }).populate('unit', 'price');
  const docs = tenants.map((t) => ({
    tenant: t._id, unit: t.unit?._id, period, paymentDate: null,
    amountDue: t.unit?.price ?? 0, amount: 0, status: 'Overdue',
  }));
  if (docs.length) await Transaction.insertMany(docs);
  return json({ created: docs.length, period });
});
