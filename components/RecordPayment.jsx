'use client';

import { useState } from 'react';
import { CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import { api } from '@/lib/client';
import { formatIDR, formatPeriod, periodKey, toInputDate } from '@/lib/format';
import { FormModal } from './FormModal';
import { Modal } from './Modal';
import { SendReceiptButton } from './SendReceiptButton';
import { useToast } from './Toast';

/**
 * Alur catat pembayaran: form -> simpan -> layar "kwitansi siap" dengan tombol kirim WhatsApp.
 * prefill: { tenantId, period, amount } opsional (mis. dari tombol "Bayar" pada tagihan).
 */
export function RecordPayment({ tenants, prefill = {}, onClose, onDone }) {
  const toast = useToast();
  const [result, setResult] = useState(null);

  const save = async (v) => {
    const fd = new FormData();
    ['tenant', 'period', 'paymentDate', 'amount'].forEach((k) => fd.append(k, v[k]));
    if (v.proof?.size) fd.append('proof', v.proof);
    try {
      setResult(await api('POST', '/api/payments', fd));
      onDone?.();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (result) return <ReceiptReady payment={result} onClose={onClose} />;

  return (
    <FormModal
      title="Catat Pembayaran" onClose={onClose} onSubmit={save}
      fields={[
        { name: 'tenant', label: 'Penghuni', type: 'select', value: prefill.tenantId, options: tenants.map((t) => [t.id, `${t.name} (${t.unit?.number ?? '-'}) · ${t.phone}`]) },
        { name: 'period', label: 'Untuk Periode Sewa', type: 'month', value: prefill.period ?? periodKey() },
        { name: 'paymentDate', label: 'Tanggal Bayar', type: 'date', value: toInputDate(new Date()) },
        { name: 'amount', label: 'Jumlah Dibayar (Rp)', type: 'number', value: prefill.amount, attrs: { min: 1 } },
        { name: 'proof', label: 'Bukti Transfer (gambar / PDF, maks. 4 MB)', type: 'file', required: false },
      ]}
    />
  );
}

/** Layar sukses: ringkasan, tombol kirim WhatsApp, lihat kwitansi, salin tautan. */
export function ReceiptReady({ payment, onClose }) {
  const toast = useToast();
  const copy = async () => {
    try { await navigator.clipboard.writeText(payment.receiptUrl); toast('Tautan kwitansi disalin'); } catch { toast('Gagal menyalin tautan', 'error'); }
  };
  return (
    <Modal title="Pembayaran Tercatat" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div className="text-sm">
            <p className="font-medium">{formatIDR(payment.amount)} · {formatPeriod(payment.period)}</p>
            <p className="text-slate-600">No. kwitansi {payment.receiptNo}</p>
            <p className="text-slate-600">{payment.remaining > 0 ? `Sisa tagihan periode ini ${formatIDR(payment.remaining)}` : 'Tagihan periode ini lunas'}</p>
          </div>
        </div>
        <p className="text-sm text-slate-500">Kwitansi bertanda tangan QR sudah dibuat. Kirim ke penghuni lewat WhatsApp (tinggal tekan kirim di aplikasi WhatsApp).</p>
        <div className="flex flex-wrap gap-2">
          <SendReceiptButton link={payment.waLink} />
          <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost"><ExternalLink className="h-4 w-4" />Lihat Kwitansi</a>
          <button className="btn-ghost" onClick={copy}><Copy className="h-4 w-4" />Salin Tautan</button>
        </div>
        <div className="flex justify-end"><button className="btn-ghost" onClick={onClose}>Selesai</button></div>
      </div>
    </Modal>
  );
}
