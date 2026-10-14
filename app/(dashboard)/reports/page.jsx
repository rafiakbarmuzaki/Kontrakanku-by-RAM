'use client';

import { useState } from 'react';
import { FileText, Sheet, Receipt, Wallet, AlertTriangle } from 'lucide-react';
import { useFetch } from '@/lib/client';
import { formatDate, formatIDR, formatPeriod, periodKey } from '@/lib/format';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Pending } from '@/components/Loading';

export default function ReportsPage() {
  const [mode, setMode] = useState('monthly');
  const [period, setPeriod] = useState(periodKey());
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const query = mode === 'monthly' ? `mode=monthly&period=${period}` : `mode=annual&year=${year}`;
  const { data, loading, error } = useFetch(`/api/reports?${query}`);
  const label = mode === 'monthly' ? formatPeriod(period) : `Tahun ${year}`;

  return (
    <div className="space-y-6">
      <div className="no-print card flex flex-wrap items-end gap-3 p-4">
        <label><span className="label">Jenis Laporan</span>
          <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="monthly">Bulanan</option><option value="annual">Tahunan</option>
          </select></label>
        {mode === 'monthly'
          ? <label><span className="label">Bulan</span><input type="month" className="input" value={period} onChange={(e) => e.target.value && setPeriod(e.target.value)} /></label>
          : <label><span className="label">Tahun</span><input type="number" className="input" value={year} onChange={(e) => setYear(e.target.value)} min="2000" max="2100" /></label>}
        <div className="ml-auto flex gap-2">
          <button className="btn-ghost" onClick={() => window.print()}><FileText className="h-4 w-4" />Export PDF</button>
          <a className="btn-primary" href={`/api/reports?${query}&format=csv`}><Sheet className="h-4 w-4" />Export Excel/CSV</a>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold">Laporan Keuangan {mode === 'monthly' ? 'Bulanan' : 'Tahunan'} - {label}</h2>
        <p className="text-sm text-slate-500">Kontrakanku · dicetak {formatDate(new Date())}</p>
      </div>

      {Pending({ loading, error, data }) ?? (
        <>
          <div className="stagger grid gap-4 sm:grid-cols-3">
            <StatCard label="Total Tagihan" amount={data.summary.billed} format={formatIDR} hint={`${data.rows.length} transaksi`} icon={Receipt} />
            <StatCard label="Total Diterima" amount={data.summary.collected} format={formatIDR} hint={data.summary.billed ? `${Math.round((data.summary.collected / data.summary.billed) * 100)}% terkumpul` : ''} icon={Wallet} tone="emerald" />
            <StatCard label="Belum Terbayar" amount={data.summary.billed - data.summary.collected} format={formatIDR} hint={`${data.summary.unpaid} tagihan`} icon={AlertTriangle} tone="rose" />
          </div>

          {mode === 'annual' && data.byMonth.length > 0 && (
            <DataTable paginate={false} rows={data.byMonth} rowKey={(r) => r.period} columns={[
              { header: 'Bulan', cell: (r) => formatPeriod(r.period) },
              { header: 'Tagihan', cell: (r) => formatIDR(r.billed) },
              { header: 'Diterima', cell: (r) => formatIDR(r.collected) },
              { header: 'Belum Lunas', cell: (r) => r.unpaid },
            ]} />
          )}

          <DataTable paginate={false} rows={data.rows} empty="Tidak ada transaksi pada periode ini." columns={[
            { header: 'Periode', cell: (r) => formatPeriod(r.period) },
            { header: 'Penghuni', cell: (r) => r.tenant?.name ?? '-' },
            { header: 'Unit', cell: (r) => r.unit?.number ?? '-' },
            { header: 'Tgl Bayar', cell: (r) => formatDate(r.paymentDate) },
            { header: 'Tagihan', cell: (r) => formatIDR(r.amountDue) },
            { header: 'Dibayar', cell: (r) => formatIDR(r.amount) },
            { header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
          ]} />
        </>
      )}
    </div>
  );
}
