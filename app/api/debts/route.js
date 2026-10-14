import { route, json } from '@/lib/api';
import { Tenant, Transaction } from '@/lib/models';

/** Hutang per penghuni/kontrakan = jumlah (tagihan - dibayar) dari semua tagihan yang belum lunas. */
export const GET = route(async () => {
  const [tenants, unpaid] = await Promise.all([
    Tenant.find().populate('unit', 'number'),
    Transaction.find({ $expr: { $lt: ['$amount', '$amountDue'] } }).sort({ period: 1 }),
  ]);

  const byTenant = new Map();
  for (const t of unpaid) {
    const key = String(t.tenant);
    if (!byTenant.has(key)) byTenant.set(key, []);
    byTenant.get(key).push({ transactionId: String(t._id), period: t.period, due: t.amountDue, paid: t.amount, remaining: t.amountDue - t.amount });
  }

  const rows = tenants.map((t) => {
    const periods = byTenant.get(String(t._id)) ?? [];
    return {
      tenantId: String(t._id), name: t.name, phone: t.phone, unit: t.unit?.number ?? '-',
      debt: periods.reduce((s, p) => s + p.remaining, 0), unpaidMonths: periods.length, periods,
    };
  }).sort((a, b) => b.debt - a.debt || a.name.localeCompare(b.name));

  return json({ rows, totalDebt: rows.reduce((s, r) => s + r.debt, 0), debtors: rows.filter((r) => r.debt > 0).length });
});
