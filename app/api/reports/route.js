import { route, json, bad } from '@/lib/api';
import { Transaction } from '@/lib/models';
import { currentPeriod } from '@/lib/billing';

const dateStr = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

/**
 * GET /api/reports?mode=monthly&period=2026-10
 * GET /api/reports?mode=annual&year=2026
 * Tambahkan &format=csv untuk unduhan Excel/CSV.
 */
export const GET = route(async ({ req }) => {
  const sp = new URL(req.url).searchParams;
  const mode = sp.get('mode') === 'annual' ? 'annual' : 'monthly';
  const period = sp.get('period') || currentPeriod();
  const year = sp.get('year') || String(new Date().getFullYear());
  if (mode === 'monthly' && !/^\d{4}-\d{2}$/.test(period)) throw bad('Periode tidak valid');
  if (mode === 'annual' && !/^\d{4}$/.test(year)) throw bad('Tahun tidak valid');

  const filter = mode === 'monthly' ? { period } : { period: { $regex: `^${year}-` } };
  const rows = await Transaction.find(filter).sort({ period: 1 }).populate('tenant', 'name').populate('unit', 'number');

  if (sp.get('format') === 'csv') {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [['Periode', 'Penghuni', 'Unit', 'Tanggal Bayar', 'Tagihan', 'Dibayar', 'Status']]
      .concat(rows.map((r) => [r.period, r.tenant?.name, r.unit?.number, dateStr(r.paymentDate), r.amountDue, r.amount, r.status]));
    return new Response('﻿' + lines.map((l) => l.map(esc).join(',')).join('\r\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="laporan-${mode === 'monthly' ? period : year}.csv"`,
      },
    });
  }

  const sum = (list, k) => list.reduce((s, r) => s + r[k], 0);
  const periods = [...new Set(rows.map((r) => r.period))];
  return json({
    mode, period, year, rows,
    summary: { billed: sum(rows, 'amountDue'), collected: sum(rows, 'amount'), unpaid: rows.filter((r) => r.status !== 'Paid').length },
    byMonth: mode === 'annual'
      ? periods.map((p) => { const l = rows.filter((r) => r.period === p); return { period: p, billed: sum(l, 'amountDue'), collected: sum(l, 'amount'), unpaid: l.filter((r) => r.status !== 'Paid').length }; })
      : [],
  });
});
