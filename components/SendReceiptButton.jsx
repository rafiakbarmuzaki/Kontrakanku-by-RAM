import { MessageCircle } from 'lucide-react';

/**
 * Buka WhatsApp ke nomor terdaftar penghuni dengan teks kwitansi sudah terisi (tinggal tekan kirim).
 * `link` berasal dari server (payment.waLink); null jika nomor telepon tidak valid.
 */
export function SendReceiptButton({ link, size = 'md' }) {
  const cls = `btn-primary ${size === 'sm' ? 'btn-sm' : ''}`;
  if (!link) {
    return <button className={`${cls} !bg-none !bg-slate-400 !shadow-none`} disabled title="Nomor telepon penghuni tidak valid. Perbaiki di menu Penghuni."><MessageCircle className="h-4 w-4" />Nomor tidak valid</button>;
  }
  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className={`${cls} !bg-none !bg-emerald-600 hover:!bg-emerald-700 !shadow-emerald-500/30`}>
      <MessageCircle className="h-4 w-4" />Kirim ke WhatsApp
    </a>
  );
}
