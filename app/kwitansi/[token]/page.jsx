'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import { ShieldCheck, ShieldAlert, Printer } from 'lucide-react';
import { useFetch } from '@/lib/client';
import { formatDate, formatIDR, formatPeriod, periodKey, terbilang } from '@/lib/format';

const nowPeriod = periodKey();

/**
 * Halaman kwitansi PUBLIK (tanpa login): dibuka penghuni dari tautan WhatsApp dan oleh siapa pun yang memindai QR.
 * Status "VALID" berasal dari server, yang menghitung ulang tanda tangan HMAC dari data terkini.
 */
export default function ReceiptPage() {
  const { token } = useParams();
  const { data: r, loading, error } = useFetch(`/api/receipts/${token}`);
  const [qr, setQr] = useState('');

  useEffect(() => {
    if (r?.verifyUrl) QRCode.toDataURL(r.verifyUrl, { margin: 1, width: 192, errorCorrectionLevel: 'M' }).then(setQr);
  }, [r?.verifyUrl]);

  if (loading) return <p className="p-6 text-sm text-slate-500">Memuat kwitansi...</p>;
  if (error || !r) return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="card max-w-sm p-6 text-center">
        <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-rose-500" />
        <p className="font-semibold">Kwitansi tidak ditemukan</p>
        <p className="mt-1 text-sm text-slate-500">Tautan salah, atau kwitansi ini sudah dibatalkan oleh pemilik.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="no-print mx-auto mb-4 flex max-w-2xl justify-end">
        <button className="btn-ghost" onClick={() => window.print()}><Printer className="h-4 w-4" />Cetak / Simpan PDF</button>
      </div>

      <article className="animate-fadeup mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-card sm:p-10">
        <header className="border-b-2 border-slate-900 pb-4 text-center">
          <p className="text-lg font-bold uppercase tracking-wide">{r.issuer.property}</p>
          {r.issuer.address && <p className="text-sm text-slate-600">{r.issuer.address}</p>}
        </header>

        <div className="my-5 flex items-end justify-between">
          <h1 className="text-2xl font-bold tracking-widest">KWITANSI</h1>
          <p className="text-sm">No. <b>{r.receiptNo}</b></p>
        </div>

        <dl className="space-y-3 text-sm">
          <Row label="Telah terima dari" value={r.tenantName} />
          <Row label="Unit" value={r.unitNumber} />
          <Row label="Untuk pembayaran" value="Sewa kontrakan" />
          <Row label="Terbilang" value={<i>{terbilang(r.amount)}</i>} />
        </dl>

        <div className="my-5 rounded-xl bg-slate-100 px-5 py-4 text-center">
          <p className="text-xs uppercase tracking-wide text-slate-500">Jumlah</p>
          <p className="text-3xl font-bold">{formatIDR(r.amount)}</p>
        </div>

        <dl className="space-y-1 text-sm text-slate-700">
          {r.allocations.length > 0 && (
            <div>
              <p className="mb-1 text-slate-500">Dialokasikan untuk</p>
              <ul className="space-y-0.5 rounded-lg bg-slate-50 px-3 py-2">
                {r.allocations.map((a) => (
                  <li key={a.period} className="flex justify-between gap-3">
                    <span>{formatPeriod(a.period)}{a.period > nowPeriod && <i className="ml-1 text-xs text-slate-500">(dibayar di muka)</i>}</span>
                    <span>{formatIDR(a.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Row label="Sisa kekurangan" value={<b className={r.remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}>{r.remaining > 0 ? formatIDR(r.remaining) : 'TIDAK ADA (LUNAS)'}</b>} />
        </dl>

        <footer className="mt-8 flex flex-wrap items-end justify-between gap-6">
          <div className="text-sm">
            <p>Dibayar pada {formatDate(r.paymentDate)}</p>
            <p className="mt-4 font-semibold">{r.issuer.owner}</p>
            <p className="text-xs text-slate-500">Pemilik / penerima</p>
            <p className="mt-3 text-[11px] leading-tight text-slate-500">Kode tanda tangan digital<br /><span className="font-mono text-xs text-slate-700">{r.signatureCode}</span></p>
          </div>
          <div className="text-center">
            {qr && <img src={qr} alt="QR verifikasi kwitansi" className="mx-auto h-32 w-32" />}
            <p className="mt-1 text-[11px] text-slate-500">Pindai untuk memverifikasi</p>
          </div>
        </footer>

        <div className={`mt-6 flex items-start gap-3 rounded-xl p-4 text-sm ${r.valid ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
          {r.valid ? <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /> : <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />}
          <p>
            {r.valid
              ? <><b>KWITANSI VALID.</b> Ditandatangani digital oleh {r.issuer.owner} dan tercatat di sistem pada {formatDate(r.issuedAt)}.</>
              : <><b>PERINGATAN: data tidak cocok.</b> Isi kwitansi ini berbeda dari yang ditandatangani. Jangan dipercaya, hubungi pemilik.</>}
          </p>
        </div>
      </article>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-3">
      <dt className="w-40 shrink-0 text-slate-500">{label}</dt>
      <dd className="flex-1">{value}</dd>
    </div>
  );
}
