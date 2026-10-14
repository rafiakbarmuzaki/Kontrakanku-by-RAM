'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BadgeCheck, ShieldAlert } from 'lucide-react';
import { useFetch } from '@/lib/client';
import { formatDate, formatDateTimeLong, formatIDR, formatPeriod } from '@/lib/format';

/**
 * Tujuan scan QR di kwitansi (publik, tanpa login). Menampilkan pernyataan tanda tangan digital;
 * status VALID dihitung server dari tanda tangan HMAC terhadap data terkini.
 */
export default function VerifyPage() {
  const { token } = useParams();
  const { data: r, loading, error } = useFetch(`/api/receipts/${token}`);

  if (loading) return <p className="p-6 text-center text-sm text-slate-500">Memeriksa kwitansi...</p>;

  if (error || !r) return (
    <Shell>
      <ShieldAlert className="mx-auto h-16 w-16 text-rose-500" />
      <h1 className="mt-4 text-xl font-bold text-rose-700">Kwitansi tidak ditemukan</h1>
      <p className="mt-2 text-sm text-slate-600">QR ini tidak terdaftar di sistem, atau kwitansinya sudah dibatalkan. Jangan percayai dokumen ini sebelum dikonfirmasi ke pemilik.</p>
    </Shell>
  );

  if (!r.valid) return (
    <Shell>
      <ShieldAlert className="mx-auto h-16 w-16 text-rose-500" />
      <h1 className="mt-4 text-xl font-bold text-rose-700">Data tidak cocok</h1>
      <p className="mt-2 text-sm text-slate-600">Isi kwitansi {r.receiptNo} berbeda dari yang ditandatangani. Jangan dipercaya, hubungi pemilik.</p>
    </Shell>
  );

  return (
    <Shell>
      <BadgeCheck className="animate-popin mx-auto h-16 w-16 text-emerald-500 [animation-delay:.15s]" />
      <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-emerald-600">Kwitansi Valid</p>
      <h1 className="mt-2 text-xl font-bold leading-snug">
        Telah ditandatangani digital oleh {r.issuer.owner} pada tanggal {formatDateTimeLong(r.signedAt)}
      </h1>
      <p className="mt-1 text-sm text-slate-500">{r.issuer.property}</p>

      <dl className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-200 text-left text-sm">
        <Row label="No. Kwitansi" value={r.receiptNo} />
        <Row label="Diterima dari" value={r.tenantName} />
        <Row label="Unit" value={r.unitNumber} />
        <Row label="Periode" value={formatPeriod(r.period)} />
        <Row label="Jumlah" value={<b>{formatIDR(r.amount)}</b>} />
        <Row label="Tanggal bayar" value={formatDate(r.paymentDate)} />
        <Row label="Kode tanda tangan" value={<span className="font-mono text-xs">{r.signatureCode}</span>} />
      </dl>

      <Link href={`/kwitansi/${token}`} className="btn-primary mt-6 w-full">Lihat kwitansi lengkap</Link>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <main className="animate-popin w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-900 shadow-card sm:p-8">{children}</main>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-2.5">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
