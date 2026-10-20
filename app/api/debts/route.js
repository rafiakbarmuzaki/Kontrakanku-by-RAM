import { route, json } from '@/lib/api';
import { Tenant, Transaction } from '@/lib/models';
import { currentPeriod, ensureCurrentPeriods } from '@/lib/billing';

/**
 * Hutang per penghuni/kontrakan = jumlah kekurangan tagihan dari bulan masuk sampai bulan berjalan.
 * `advance` = uang yang sudah dibayar di muka untuk bulan-bulan setelah bulan berjalan.
 */
export const GET = route(async () => {
  await ensureCurrentPeriods();
  const now = currentPeriod();
  const [tenants, unpaid, prepaid] = await Promise.all([
    Tenant.find().populate('unit', 'number'),
    Transaction.find({ period: { $lte: now }, $expr: { $lt: ['$amount', '$amountDue'] } }).sort({ period: 1 }),
    Transaction.find({ period: { $gt: now }, amount: { $gt: 0 } }).sort({ period: 1 }),
  ]);

  const group = (list) => {
    const m = new Map();
    for (const t of list) {
      const k = String(t.tenant);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(t);
    }
    return m;
  };
  const owed = group(unpaid);
  const ahead = group(prepaid);

  const rows = tenants.map((t) => {
    const periods = (owed.get(String(t._id)) ?? []).map((x) => ({ period: x.period, due: x.amountDue, paid: x.amount, remaining: x.amountDue - x.amount }));
    const advance = ahead.get(String(t._id)) ?? [];
    return {
      tenantId: String(t._id), name: t.name, phone: t.phone, unit: t.unit?.number ?? '-', movedOut: Boolean(t.moveOutDate && t.moveOutDate <= new Date()),
      debt: periods.reduce((s, p) => s + p.remaining, 0), unpaidMonths: periods.length, periods,
      advance: advance.reduce((s, x) => s + x.amount, 0), advancePeriods: advance.map((x) => x.period),
    };
  })
    // Penghuni yang sudah keluar hanya ditampilkan selama masih punya hutang / uang di muka.
    .filter((r) => !r.movedOut || r.debt > 0 || r.advance > 0)
    .sort((a, b) => b.debt - a.debt || a.name.localeCompare(b.name));

  return json({ rows, totalDebt: rows.reduce((s, r) => s + r.debt, 0), debtors: rows.filter((r) => r.debt > 0).length });
});
