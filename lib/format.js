const idr = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export const formatIDR = (n) => idr.format(n ?? 0);

/** Menerima ISO string / Date; mengembalikan "05 Okt 2026" atau "-". */
export const formatDate = (v) =>
  v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '-';

/** "14 Oktober 2026 pukul 09.30 WIB" (zona waktu Jakarta). */
export const formatDateTimeLong = (v) => {
  const d = new Date(v);
  const date = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).replace(':', '.');
  return `${date} pukul ${time} WIB`;
};

/** "2026-10" -> "Okt 2026" */
export const formatPeriod = (p) =>
  new Date(p + '-01T00:00:00Z').toLocaleDateString('id-ID', { month: 'short', year: 'numeric', timeZone: 'UTC' });

export const periodKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** Date/ISO -> "YYYY-MM-DD" untuk input type=date. */
export const toInputDate = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '');

const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
function eja(n) {
  if (n < 12) return SATUAN[n];
  if (n < 20) return eja(n - 10) + ' belas';
  if (n < 100) return eja(Math.floor(n / 10)) + ' puluh' + (n % 10 ? ' ' + eja(n % 10) : '');
  if (n < 200) return 'seratus' + (n % 100 ? ' ' + eja(n % 100) : '');
  if (n < 1000) return eja(Math.floor(n / 100)) + ' ratus' + (n % 100 ? ' ' + eja(n % 100) : '');
  if (n < 2000) return 'seribu' + (n % 1000 ? ' ' + eja(n % 1000) : '');
  if (n < 1e6) return eja(Math.floor(n / 1000)) + ' ribu' + (n % 1000 ? ' ' + eja(n % 1000) : '');
  if (n < 1e9) return eja(Math.floor(n / 1e6)) + ' juta' + (n % 1e6 ? ' ' + eja(n % 1e6) : '');
  return eja(Math.floor(n / 1e9)) + ' miliar' + (n % 1e9 ? ' ' + eja(n % 1e9) : '');
}
/** 1250000 -> "Satu juta dua ratus lima puluh ribu rupiah" */
export function terbilang(n) {
  const words = n > 0 ? eja(Math.floor(n)) : 'nol';
  return words.charAt(0).toUpperCase() + words.slice(1) + ' rupiah';
}
