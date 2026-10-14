// Aman dipakai di server maupun klien: nomor telepon dan teks pesan WhatsApp.
import { formatIDR, formatPeriod } from './format';

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

export function receiptMessage({ name, receiptNo, amount, period, remaining, url, owner, property }) {
  return [
    `Yth. ${name},`,
    '',
    `Pembayaran sewa ${property} periode ${formatPeriod(period)} sebesar *${formatIDR(amount)}* telah kami terima.`,
    remaining > 0 ? `Sisa tagihan periode ini: ${formatIDR(remaining)}.` : 'Tagihan periode ini LUNAS.',
    '',
    `No. Kwitansi: ${receiptNo}`,
    `Kwitansi digital (tertanda tangan QR): ${url}`,
    '',
    `Terima kasih. - ${owner}`,
  ].join('\n');
}

export function reminderMessage({ name, unit, debt, periods, property = 'Kontrakan Damai' }) {
  return [
    `Yth. ${name},`,
    '',
    `Pengingat dari ${property}: sewa unit ${unit} masih ada tunggakan *${formatIDR(debt)}* untuk periode ${periods.map(formatPeriod).join(', ')}.`,
    'Mohon segera diselesaikan. Abaikan pesan ini jika sudah membayar. Terima kasih.',
  ].join('\n');
}
