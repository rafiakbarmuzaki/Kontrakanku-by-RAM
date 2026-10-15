'use client';

import { useState } from 'react';
import { Plus, Receipt, ExternalLink, Paperclip } from 'lucide-react';
import { api, useFetch } from '@/lib/client';
import { formatDate, formatIDR, formatPeriod } from '@/lib/format';
import { waLink, describeAllocations } from '@/lib/phone';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { SendReceiptButton } from '@/components/SendReceiptButton';
import { Pending } from '@/components/Loading';
import { RecordPayment } from '@/components/RecordPayment';
import { PaymentsModal } from '@/components/PaymentsModal';
import { useUser } from '@/components/UserProvider';
import { useAction } from '@/components/useAction';

/**
 * Dua tampilan:
 *  - Pemasukan: setiap uang masuk (kapan saja, berapa saja) beserta kwitansinya.
 *  - Tagihan Bulanan: tagihan per penghuni per bulan yang terisi otomatis (hutang terlama dilunasi dulu).
 */
export default function TransactionsPage() {
  const [tab, setTab] = useState('income');
  const payments = useFetch('/api/payments');
  const bills = useFetch('/api/transactions');
  const tenants = useFetch('/api/tenants');
  const { isSuper } = useUser();
  const reloadAll = () => Promise.all([payments.reload(), bills.reload()]);
  const act = useAction(reloadAll);
  const [pay, setPay] = useState(null);
  const [history, setHistory] = useState(null);

  const wait = Pending({ loading: payments.loading || bills.loading || tenants.loading, error: payments.error || bills.error || tenants.error, data: payments.data && bills.data && tenants.data });
  if (wait) return wait;

  const removePayment = (p) =>
    confirm(`Hapus pembayaran ${formatIDR(p.amount)} (${p.receiptNo})? Kwitansinya tidak akan berlaku lagi dan alokasi penghuni ini dihitung ulang.`) &&
    act(() => api('DELETE', `/api/payments/${p.id}`), 'Pembayaran dihapus');

  const recordBtn = (
    <button className="btn-primary" onClick={() => (tenants.data.length ? setPay({}) : alert('Tambahkan penghuni dulu.'))}><Plus className="h-4 w-4" />Catat Pemasukan</button>
  );

  return (
    <div className="space-y-4">
      <div className="no-print inline-flex rounded-xl border border-slate-200 bg-white p-1 text-sm">
        {[['income', 'Pemasukan'], ['bills', 'Tagihan Bulanan']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-4 py-1.5 font-medium transition ${tab === k ? 'bg-brand-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}>{l}</button>
        ))}
      </div>

      {tab === 'income' ? (
        <DataTable
          key="income" rows={payments.data}
          searchText={(r) => `${r.tenant?.name ?? ''} ${r.tenant?.phone ?? ''} ${r.unit?.number ?? ''} ${r.receiptNo}`}
          toolbar={recordBtn}
          empty="Belum ada pemasukan. Klik Catat Pemasukan setiap ada pembayaran masuk."
          columns={[
            { header: 'Tgl Bayar', cell: (r) => formatDate(r.paymentDate) },
            { header: 'Penghuni', cell: (r) => <b>{r.tenant?.name ?? '-'}</b> },
            { header: 'Telepon', cell: (r) => <a href={waLink(r.tenant?.phone) ?? undefined} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{r.tenant?.phone}</a> },
            { header: 'Unit', cell: (r) => r.unit?.number ?? '-' },
            { header: 'Jumlah', cell: (r) => <span className="font-medium">{formatIDR(r.amount)}</span> },
            { header: 'Dialokasikan ke', cell: (r) => <span className="block max-w-xs whitespace-normal text-xs text-slate-600">{describeAllocations(r.allocations)}</span> },
            { header: 'Sisa Hutang', cell: (r) => <span className={r.remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}>{r.remaining > 0 ? formatIDR(r.remaining) : 'Lunas'}</span> },
            { header: 'Kwitansi', cell: (r) => r.receiptNo },
            { header: 'Bukti', cell: (r) => r.proofUrl
              ? <a href={r.proofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:underline"><Paperclip className="h-3.5 w-3.5" />Lihat</a>
              : <span className="text-slate-400">-</span> },
            { header: '', cell: (r) => (
              <div className="flex gap-2">
                <SendReceiptButton link={r.waLink} size="sm" />
                <a href={r.receiptUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm"><ExternalLink className="h-3.5 w-3.5" />Kwitansi</a>
                {isSuper && <button className="btn-ghost btn-sm !text-rose-600" onClick={() => removePayment(r)}>Hapus</button>}
              </div>
            ) },
          ]}
        />
      ) : (
        <DataTable
          key="bills" rows={bills.data}
          searchText={(r) => `${r.tenant?.name ?? ''} ${r.unit?.number ?? ''} ${r.period} ${r.status}`}
          toolbar={recordBtn}
          columns={[
            { header: 'Periode', cell: (r) => formatPeriod(r.period) },
            { header: 'Penghuni', cell: (r) => <b>{r.tenant?.name ?? '-'}</b> },
            { header: 'Unit', cell: (r) => r.unit?.number ?? '-' },
            { header: 'Tagihan', cell: (r) => formatIDR(r.amountDue) },
            { header: 'Terbayar', cell: (r) => formatIDR(r.amount) },
            { header: 'Kurang', cell: (r) => <span className={r.amountDue - r.amount > 0 ? 'font-medium text-rose-600' : 'text-slate-400'}>{formatIDR(r.amountDue - r.amount)}</span> },
            { header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
            { header: '', cell: (r) => (
              <button className="btn-ghost btn-sm" onClick={() => setHistory(r)}><Receipt className="h-3.5 w-3.5" />Pembayaran</button>
            ) },
          ]}
        />
      )}

      {pay && <RecordPayment tenants={tenants.data} prefill={pay} onClose={() => setPay(null)} onDone={reloadAll} />}
      {history && <PaymentsModal bill={history} onClose={() => setHistory(null)} onChanged={reloadAll} />}
    </div>
  );
}
