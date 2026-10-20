'use client';

import { useState } from 'react';
import { Wallet, BellRing, AlertTriangle, Users } from 'lucide-react';
import { useFetch } from '@/lib/client';
import { formatIDR, formatPeriod } from '@/lib/format';
import { waLink, reminderMessage } from '@/lib/phone';
import { StatCard } from '@/components/StatCard';
import { DataTable } from '@/components/DataTable';
import { Pending } from '@/components/Loading';
import { RecordPayment } from '@/components/RecordPayment';

/** Hutang per kontrakan: total tunggakan tiap penghuni, rinci per bulan, dengan tombol bayar dan pengingat WhatsApp. */
export default function DebtsPage() {
  const debts = useFetch('/api/debts');
  const tenants = useFetch('/api/tenants');
  const [pay, setPay] = useState(null);

  const wait = Pending({ loading: debts.loading || tenants.loading, error: debts.error || tenants.error, data: debts.data && tenants.data });
  if (wait) return wait;
  const { rows, totalDebt, debtors } = debts.data;
  const reload = () => Promise.all([debts.reload(), tenants.reload()]);

  return (
    <div className="space-y-6">
      <div className="stagger grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Hutang Semua Kontrakan" amount={totalDebt} format={formatIDR} hint="Kekurangan bulan-bulan sebelumnya ikut terhitung" icon={AlertTriangle} tone="rose" />
        <StatCard label="Penghuni Berhutang" value={`${debtors} dari ${rows.length}`} hint={debtors ? 'Urut dari hutang terbesar' : 'Semua lunas'} icon={Users} tone="amber" />
      </div>

      <DataTable
        rows={rows} rowKey={(r) => r.tenantId}
        searchText={(r) => `${r.name} ${r.unit} ${r.phone}`}
        empty="Belum ada penghuni."
        columns={[
          { header: 'Unit', cell: (r) => <b>{r.unit}</b> },
          { header: 'Penghuni', cell: (r) => <>{r.name}{r.movedOut && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">sudah keluar</span>}</> },
          { header: 'Telepon', cell: (r) => <a href={waLink(r.phone) ?? undefined} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{r.phone}</a> },
          { header: 'Bulan Menunggak', cell: (r) => r.unpaidMonths ? r.periods.map((p) => formatPeriod(p.period)).join(', ') : <span className="text-slate-400">-</span> },
          { header: 'Hutang', cell: (r) => <span className={r.debt > 0 ? 'font-semibold text-rose-600' : 'text-emerald-600'}>{r.debt > 0 ? formatIDR(r.debt) : 'Lunas'}</span> },
          { header: 'Dibayar di Muka', cell: (r) => r.advance > 0
            ? <span className="text-emerald-600" title={r.advancePeriods.map(formatPeriod).join(', ')}>{formatIDR(r.advance)}</span>
            : <span className="text-slate-400">-</span> },
          { header: '', cell: (r) => r.debt > 0 && (
            <div className="flex gap-2">
              <button className="btn-primary btn-sm" onClick={() => setPay({ tenantId: r.tenantId, amount: r.debt })}><Wallet className="h-3.5 w-3.5" />Bayar</button>
              {waLink(r.phone) && (
                <a className="btn-ghost btn-sm" target="_blank" rel="noopener noreferrer"
                  href={waLink(r.phone, reminderMessage({ name: r.name, unit: r.unit, debt: r.debt, periods: r.periods.map((p) => p.period) }))}>
                  <BellRing className="h-3.5 w-3.5" />Ingatkan
                </a>
              )}
            </div>
          ) },
        ]}
      />
      {pay && <RecordPayment tenants={tenants.data} prefill={pay} onClose={() => setPay(null)} onDone={reload} />}
    </div>
  );
}
