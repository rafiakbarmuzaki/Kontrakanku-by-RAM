import { route, json } from '@/lib/api';
import { Unit, Transaction } from '@/lib/models';
import { currentPeriod } from '@/lib/billing';

export const GET = route(async () => {
  const period = currentPeriod();
  const now = new Date();
  const months = [...Array(6)].map((_, i) => currentPeriod(new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)));

  const [byStatus, revenue, pending, recent, debt] = await Promise.all([
    Unit.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Transaction.aggregate([
      { $match: { period: { $in: months } } },
      { $group: { _id: '$period', total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { period, status: { $ne: 'Paid' } } },
      { $group: { _id: null, count: { $sum: 1 }, outstanding: { $sum: { $subtract: ['$amountDue', '$amount'] } } } },
    ]),
    Transaction.find({ paymentDate: { $ne: null } }).sort({ paymentDate: -1 }).limit(6).populate('tenant', 'name').populate('unit', 'number'),
    // Total hutang semua periode = jumlah (tagihan - dibayar) dari tagihan yang belum lunas.
    Transaction.aggregate([
      { $match: { $expr: { $lt: ['$amount', '$amountDue'] } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$amountDue', '$amount'] } } } },
    ]),
  ]);

  const count = (s) => byStatus.find((x) => x._id === s)?.n ?? 0;
  const revMap = Object.fromEntries(revenue.map((r) => [r._id, r.total]));
  return json({
    period,
    units: { total: count('Occupied') + count('Vacant') + count('Maintenance'), occupied: count('Occupied'), vacant: count('Vacant'), maintenance: count('Maintenance') },
    monthlyRevenue: revMap[period] ?? 0,
    totalDebt: debt[0]?.total ?? 0,
    pending: { count: pending[0]?.count ?? 0, outstanding: pending[0]?.outstanding ?? 0 },
    revenueByMonth: months.map((p) => ({ period: p, total: revMap[p] ?? 0 })),
    recent,
  });
});
