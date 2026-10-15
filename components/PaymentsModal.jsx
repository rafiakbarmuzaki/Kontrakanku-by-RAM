'use client';

import { ExternalLink } from 'lucide-react';
import { api, useFetch } from '@/lib/client';
import { formatDate, formatIDR, formatPeriod } from '@/lib/format';
import { describeAllocations } from '@/lib/phone';
import { Modal } from './Modal';
import { SendReceiptButton } from './SendReceiptButton';
import { Pending } from './Loading';
import { useUser } from './UserProvider';
import { useAction } from './useAction';

/** Pembayaran yang dialokasikan ke satu tagihan bulanan: kwitansi, bukti, dan tombol kirim ulang ke WhatsApp. */
export function PaymentsModal({ bill, onClose, onChanged }) {
  const { isSuper } = useUser();
  const { data, loading, error, reload } = useFetch(`/api/payments?transaction=${bill.id}`);
  const act = useAction(async () => { await reload(); onChanged?.(); });

  const remove = (p) =>
    confirm(`Hapus pembayaran ${formatIDR(p.amount)} (${p.receiptNo})? Kwitansinya tidak akan berlaku lagi dan alokasi penghuni ini dihitung ulang.`) &&
    act(() => api('DELETE', `/api/payments/${p.id}`), 'Pembayaran dihapus');

  return (
    <Modal title={`Pembayaran ${bill.tenant?.name ?? ''} · ${formatPeriod(bill.period)}`} onClose={onClose} wide>
      {Pending({ loading, error, data }) ?? (
        data.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">Belum ada pembayaran yang dialokasikan ke bulan ini.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500"><tr>{['Tanggal', 'Jumlah', 'Dialokasikan ke', 'No. Kwitansi', ''].map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap px-3 py-2">{formatDate(p.paymentDate)}</td>
                    <td className="whitespace-nowrap px-3 py-2 font-medium">{formatIDR(p.amount)}</td>
                    <td className="px-3 py-2 text-xs text-slate-600">{describeAllocations(p.allocations)}</td>
                    <td className="whitespace-nowrap px-3 py-2">{p.receiptNo}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <SendReceiptButton link={p.waLink} size="sm" />
                        <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-sm"><ExternalLink className="h-3.5 w-3.5" />Kwitansi</a>
                        {isSuper && <button className="btn-ghost btn-sm !text-rose-600" onClick={() => remove(p)}>Hapus</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </Modal>
  );
}
