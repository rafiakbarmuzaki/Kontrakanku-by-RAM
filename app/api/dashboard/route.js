import { route, json } from '@/lib/api';
import { Unit, Transaction, Payment } from '@/lib/models';
import { currentPeriod, ensureCurrentPeriods } from '@/lib/billing';

export const GET = route(async () => {
  await ensureCurrentPeriods();
  const period = currentPeriod();
  const now = new Date();
  const months = [...Array(6)].map((_, i) => currentPeriod(new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)));
  const since = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 5, 1));

  const [byStatus, cash, pending, debt, recent] = await Promise.all([
    Unit.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    // Pemasukan = uang yang benar-benar masuk, dikelompokkan menurut TANGGAL BAYAR (bukan bulan tagihan).
    Payment.aggregate([
      { $match: { paymentDate: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$paymentDate' } }, total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { period, status: { $ne: 'Paid' } } },
      { $group: { _id: null, count: { $sum: 1 }, outstanding: { $sum: { $subtract: ['$amountDue', '$amount'] } } } },
    ]),
    // Total hutang = kekurangan semua tagihan sampai bulan berjalan (bulan di muka tidak dihitung).
    Transaction.aggregate([
      { $match: { period: { $lte: period }, $expr: { $lt: ['$amount', '$amountDue'] } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$amountDue', '$amount'] } } } },
    ]),
    Payment.find().sort({ paymentDate: -1, createdAt: -1 }).limit(6).populate('tenant', 'name').populate('unit', 'number'),
  ]);

  const count = (s) => byStatus.find((x) => x._id === s)?.n ?? 0;
  const cashMap = Object.fromEntries(cash.map((r) => [r._id, r.total]));
  return json({
    period,
    units: { total: count('Occupied') + count('Vacant') + count('Maintenance'), occupied: count('Occupied'), vacant: count('Vacant'), maintenance: count('Maintenance') },
    monthlyRevenue: cashMap[period] ?? 0,
    totalDebt: debt[0]?.total ?? 0,
    pending: { count: pending[0]?.count ?? 0, outstanding: pending[0]?.outstanding ?? 0 },
    revenueByMonth: months.map((p) => ({ period: p, total: cashMap[p] ?? 0 })),
    recent,
  });
});
