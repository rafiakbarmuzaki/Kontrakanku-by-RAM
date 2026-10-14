'use client';

import { DoorOpen, Users, Wallet, AlertTriangle } from 'lucide-react';
import { useFetch } from '@/lib/client';
import { formatIDR, formatDate, formatPeriod } from '@/lib/format';
import { StatCard } from '@/components/StatCard';
import { RevenueChart } from '@/components/RevenueChart';
import { Pending } from '@/components/Loading';

export default function DashboardPage() {
  const { data, loading, error } = useFetch('/api/dashboard');
  const wait = Pending({ loading, error, data });
  if (wait) return wait;

  const { units, monthlyRevenue, totalDebt, pending, revenueByMonth, recent, period } = data;
  const occupancy = units.total ? Math.round((units.occupied / units.total) * 100) : 0;
  const chart = revenueByMonth.map((m) => ({ label: formatPeriod(m.period).split(' ')[0], value: m.total }));

  return (
    <div className="space-y-6">
      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Unit" amount={units.total} hint={`${units.maintenance} dalam perbaikan`} icon={DoorOpen} />
        <StatCard label="Terisi vs Kosong" value={`${units.occupied} / ${units.vacant}`} hint={`Okupansi ${occupancy}%`} icon={Users} tone="emerald" />
        <StatCard label="Pendapatan Bulan Ini" amount={monthlyRevenue} format={formatIDR} hint={formatPeriod(period)} icon={Wallet} tone="brand" />
        <StatCard label="Total Hutang" amount={totalDebt} format={formatIDR} hint={`${pending.count} tagihan belum lunas bulan ini`} icon={AlertTriangle} tone="rose" />
      </div>

      <div className="stagger grid gap-4 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <h2 className="font-semibold">Pendapatan 6 Bulan Terakhir</h2>
          <p className="mb-3 text-xs text-slate-500">Total pembayaran yang diterima per bulan</p>
          <RevenueChart data={chart} />
        </div>
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Pembayaran Terbaru</h2>
          <ul className="space-y-3">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.tenant?.name ?? '-'}</p>
                  <p className="text-xs text-slate-500">{t.unit?.number} · {formatDate(t.paymentDate)}</p>
                </div>
                <span className="font-medium">{formatIDR(t.amount)}</span>
              </li>
            ))}
            {recent.length === 0 && <li className="text-sm text-slate-500">Belum ada pembayaran.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
