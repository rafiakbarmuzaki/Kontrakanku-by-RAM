'use client';

import { useState } from 'react';
import { Plus, FilePlus2, Wallet, Receipt } from 'lucide-react';
import { api, useFetch } from '@/lib/client';
import { formatIDR, formatPeriod, periodKey } from '@/lib/format';
import { waLink } from '@/lib/phone';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Pending } from '@/components/Loading';
import { RecordPayment } from '@/components/RecordPayment';
import { PaymentsModal } from '@/components/PaymentsModal';
import { useUser } from '@/components/UserProvider';
import { useAction } from '@/components/useAction';
import { useToast } from '@/components/Toast';

/** Tagihan per penghuni per bulan. Pembayaran (dan kwitansinya) dicatat per kejadian uang masuk. */
export default function TransactionsPage() {
  const bills = useFetch('/api/transactions');
  const tenants = useFetch('/api/tenants');
  const { isSuper } = useUser();
  const toast = useToast();
  const act = useAction(bills.reload);
  const [pay, setPay] = useState(null); // {} atau prefill
  const [history, setHistory] = useState(null); // tagihan yang riwayatnya dibuka

  const wait = Pending({ loading: bills.loading || tenants.loading, error: bills.error || tenants.error, data: bills.data && tenants.data });
  if (wait) return wait;

  const remove = (r) =>
    confirm(`Hapus tagihan ${r.tenant?.name} ${formatPeriod(r.period)} beserta semua pembayaran dan kwitansinya?`) &&
    act(() => api('DELETE', `/api/transactions/${r.id}`), 'Tagihan dihapus');
  const generate = async () => {
    const period = periodKey();
    if (!confirm(`Buat tagihan ${formatPeriod(period)} untuk semua penghuni yang belum punya tagihan?`)) return;
    try {
      const { created } = await api('POST', '/api/transactions/generate', { period });
      toast(created ? `${created} tagihan dibuat` : 'Semua penghuni sudah punya tagihan bulan ini');
      bills.reload();
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <DataTable
        rows={bills.data}
        searchText={(r) => `${r.tenant?.name ?? ''} ${r.tenant?.phone ?? ''} ${r.unit?.number ?? ''} ${r.period} ${r.status}`}
        toolbar={<>
          <button className="btn-ghost" onClick={generate}><FilePlus2 className="h-4 w-4" />Buat Tagihan Bulan Ini</button>
          <button className="btn-primary" onClick={() => (tenants.data.length ? setPay({}) : alert('Tambahkan penghuni dulu.'))}><Plus className="h-4 w-4" />Catat Pembayaran</button>
        </>}
        columns={[
          { header: 'Periode', cell: (r) => formatPeriod(r.period) },
          { header: 'Penghuni', cell: (r) => <b>{r.tenant?.name ?? '-'}</b> },
          { header: 'Telepon', cell: (r) => r.tenant?.phone
            ? <a href={waLink(r.tenant.phone) ?? undefined} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{r.tenant.phone}</a> : '-' },
          { header: 'Unit', cell: (r) => r.unit?.number ?? '-' },
          { header: 'Tagihan', cell: (r) => formatIDR(r.amountDue) },
          { header: 'Dibayar', cell: (r) => formatIDR(r.amount) },
          { header: 'Sisa', cell: (r) => <span className={r.amountDue - r.amount > 0 ? 'font-medium text-rose-600' : 'text-slate-400'}>{formatIDR(r.amountDue - r.amount)}</span> },
          { header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
          { header: '', cell: (r) => (
            <div className="flex gap-2">
              {r.amount < r.amountDue && (
                <button className="btn-primary btn-sm" onClick={() => setPay({ tenantId: r.tenant?.id, period: r.period, amount: r.amountDue - r.amount })}><Wallet className="h-3.5 w-3.5" />Bayar</button>
              )}
              <button className="btn-ghost btn-sm" onClick={() => setHistory(r)}><Receipt className="h-3.5 w-3.5" />Kwitansi</button>
              {isSuper && <button className="btn-ghost btn-sm !text-rose-600" onClick={() => remove(r)}>Hapus</button>}
            </div>
          ) },
        ]}
      />
      {pay && <RecordPayment tenants={tenants.data} prefill={pay} onClose={() => setPay(null)} onDone={bills.reload} />}
      {history && <PaymentsModal bill={history} onClose={() => setHistory(null)} onChanged={bills.reload} />}
    </>
  );
}
