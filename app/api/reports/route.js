import { route, json, bad } from '@/lib/api';
import { Transaction, Payment } from '@/lib/models';
import { currentPeriod, ensureCurrentPeriods } from '@/lib/billing';

const dateStr = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

/**
 * GET /api/reports?mode=monthly&period=2026-10
 * GET /api/reports?mode=annual&year=2026
 * Tambahkan &format=csv untuk unduhan Excel/CSV.
 *
 * Dua sudut pandang:
 *  - Pemasukan (kas): uang yang masuk pada rentang tanggal itu, menurut TANGGAL BAYAR.
 *  - Tagihan: tagihan bulan-bulan dalam rentang itu beserta kekurangannya.
 */
export const GET = route(async ({ req }) => {
  await ensureCurrentPeriods();
  const sp = new URL(req.url).searchParams;
  const mode = sp.get('mode') === 'annual' ? 'annual' : 'monthly';
  const period = sp.get('period') || currentPeriod();
  const year = sp.get('year') || String(new Date().getFullYear());
  if (mode === 'monthly' && !/^\d{4}-\d{2}$/.test(period)) throw bad('Periode tidak valid');
  if (mode === 'annual' && !/^\d{4}$/.test(year)) throw bad('Tahun tidak valid');

  let from, to;
  if (mode === 'monthly') {
    const [y, m] = period.split('-').map(Number);
    from = new Date(Date.UTC(y, m - 1, 1)); to = new Date(Date.UTC(y, m, 1));
  } else {
    from = new Date(Date.UTC(Number(year), 0, 1)); to = new Date(Date.UTC(Number(year) + 1, 0, 1));
  }

  const billFilter = mode === 'monthly' ? { period } : { period: { $regex: `^${year}-` } };
  const [bills, payments] = await Promise.all([
    Transaction.find(billFilter).sort({ period: 1 }).populate('tenant', 'name').populate('unit', 'number'),
    Payment.find({ paymentDate: { $gte: from, $lt: to } }).sort({ paymentDate: 1, createdAt: 1 }).populate('tenant', 'name').populate('unit', 'number'),
  ]);

  if (sp.get('format') === 'csv') {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const line = (a) => a.map(esc).join(',');
    const out = [
      line(['PEMASUKAN (menurut tanggal bayar)']),
      line(['Tanggal Bayar', 'Penghuni', 'Unit', 'No. Kwitansi', 'Jumlah', 'Dialokasikan ke']),
      ...payments.map((p) => line([dateStr(p.paymentDate), p.tenant?.name, p.unit?.number, p.receiptNo, p.amount, (p.allocations ?? []).map((a) => `${a.period}:${a.amount}`).join('; ')])),
      '',
      line(['TAGIHAN']),
      line(['Periode', 'Penghuni', 'Unit', 'Tagihan', 'Terbayar', 'Kurang', 'Status']),
      ...bills.map((b) => line([b.period, b.tenant?.name, b.unit?.number, b.amountDue, b.amount, b.amountDue - b.amount, b.status])),
    ];
    return new Response('﻿' + out.join('\r\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="laporan-${mode === 'monthly' ? period : year}.csv"`,
      },
    });
  }

  const sum = (list, k) => list.reduce((s, r) => s + r[k], 0);
  const periods = [...new Set(bills.map((r) => r.period))];
  return json({
    mode, period, year, rows: bills, payments,
    summary: {
      billed: sum(bills, 'amountDue'),
      collected: sum(payments, 'amount'), // kas masuk pada rentang tanggal ini
      shortfall: sum(bills, 'amountDue') - sum(bills, 'amount'),
      unpaid: bills.filter((r) => r.status !== 'Paid').length,
    },
    byMonth: mode === 'annual'
      ? periods.map((p) => {
        const l = bills.filter((r) => r.period === p);
        const [y, m] = p.split('-').map(Number);
        const cash = payments.filter((x) => x.paymentDate >= new Date(Date.UTC(y, m - 1, 1)) && x.paymentDate < new Date(Date.UTC(y, m, 1)));
        return { period: p, billed: sum(l, 'amountDue'), collected: sum(cash, 'amount'), unpaid: l.filter((r) => r.status !== 'Paid').length };
      })
      : [],
  });
});
