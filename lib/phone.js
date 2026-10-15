// Aman dipakai di server maupun klien: nomor telepon dan teks pesan WhatsApp.
import { formatIDR, formatPeriod, periodKey } from './format';

/** "0812-3456-789" / "+62 812..." / "812..." -> "62812..." (atau null jika bukan nomor Indonesia yang valid). */
export function toWaNumber(phone) {
  let d = String(phone || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = '62' + d.slice(1);
  else if (d.startsWith('8')) d = '62' + d;
  return /^62\d{8,13}$/.test(d) ? d : null;
}

/** Tautan wa.me dengan pesan terisi. null jika nomor tidak valid. */
export function waLink(phone, text = '') {
  const n = toWaNumber(phone);
  return n ? `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}` : null;
}

/** "Sep 2026 (Rp 200.000), Okt 2026 (Rp 800.000 - di muka)" dari daftar alokasi pembayaran. */
export function describeAllocations(allocations = [], now = periodKey()) {
  return allocations
    .map((a) => `${formatPeriod(a.period)} (${formatIDR(a.amount)}${a.period > now ? ', dibayar di muka' : ''})`)
    .join(', ');
}

export function receiptMessage({ name, receiptNo, amount, allocations, remaining, url, owner, property }) {
  return [
    `Yth. ${name},`,
    '',
    `Pembayaran sewa ${property} sebesar *${formatIDR(amount)}* telah kami terima.`,
    allocations.length ? `Dialokasikan untuk: ${describeAllocations(allocations)}.` : '',
    remaining > 0 ? `Sisa hutang Anda: *${formatIDR(remaining)}*.` : 'Tidak ada hutang tersisa.',
    '',
    `No. Kwitansi: ${receiptNo}`,
    `Kwitansi digital (tertanda tangan QR): ${url}`,
    '',
    `Terima kasih. - ${owner}`,
    ``
    `pesan ini dibuat oleh Sistem Kontrakan Damai`,
  ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n');
}

export function reminderMessage({ name, unit, debt, periods, property = 'Kontrakan Damai' }) {
  return [
    `Yth. ${name},`,
    '',
    `Pengingat dari ${property}: sewa unit ${unit} masih ada tunggakan *${formatIDR(debt)}* untuk periode ${periods.map(formatPeriod).join(', ')}.`,
    'Mohon segera diselesaikan. Abaikan pesan ini jika sudah membayar. Terima kasih.',
    ``
    `pesan ini dibuat oleh Sistem Kontrakan Damai`,
  ].join('\n');
}
