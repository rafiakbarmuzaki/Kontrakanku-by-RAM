// Mengisi data contoh: 10 unit, 7 penghuni, dan pembayaran 6 bulan terakhir beserta kwitansinya.
// Tagihan bulanan dan alokasi pembayaran TIDAK diisi di sini: dibuat otomatis oleh aplikasi
// (recomputeTenantLedger) saat data pertama kali dibuka.
//   npm run seed             (menolak jika sudah ada data)
//   npm run seed -- --reset  (HAPUS unit/penghuni/tagihan/pembayaran lalu isi ulang; akun pengguna tidak disentuh)
import crypto from 'node:crypto';
import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) { console.error('MONGODB_URI belum diisi di .env'); process.exit(1); }
if (!process.env.JWT_SECRET) { console.error('JWT_SECRET belum diisi di .env'); process.exit(1); }
await mongoose.connect(process.env.MONGODB_URI);
const col = (n) => mongoose.connection.collection(n);
const oid = () => new mongoose.Types.ObjectId();

if (process.argv.includes('--reset')) {
  for (const c of ['units', 'tenants', 'transactions', 'payments', 'counters']) await col(c).deleteMany({});
  console.log('Data lama dihapus (akun pengguna tidak disentuh).');
} else if (await col('units').countDocuments()) {
  console.log('Database sudah berisi unit, seed dibatalkan. Pakai --reset untuk menimpa.');
  process.exit(0);
}

const now = new Date();
const prices = [750000, 800000, 800000, 850000, 900000, 900000, 950000, 1000000, 1000000, 1100000];
const pool = ['Kamar mandi dalam', 'AC', 'Kasur', 'Dapur', 'Parkir motor', 'WiFi'];

const units = prices.map((price, i) => ({
  _id: oid(), number: `A-${String(i + 1).padStart(2, '0')}`, price,
  status: i < 7 ? 'Occupied' : i === 7 ? 'Maintenance' : 'Vacant',
  facilities: pool.filter((_, k) => (i + k) % 2 === 0 || k === 0).slice(0, 2 + (i % 3)),
  createdAt: now, updatedAt: now,
}));

const names = ['Budi Santoso', 'Siti Rahayu', 'Andi Wijaya', 'Dewi Lestari', 'Joko Prasetyo', 'Rina Marlina', 'Agus Setiawan'];
const tenants = names.map((name, i) => ({
  _id: oid(), name, ktp: `3174${String(1000000000000 + i * 7919).slice(0, 12)}`,
  phone: `0812${String(30000000 + i * 123457).slice(0, 8)}`,
  emergencyContact: `Keluarga ${name.split(' ')[1]} - 0857${String(10000000 + i * 99991).slice(0, 8)}`,
  // Masuk 5 bulan lalu, sehingga tagihan 6 bulan (termasuk bulan ini) terbentuk otomatis.
  entryDate: new Date(Date.UTC(now.getFullYear(), now.getMonth() - 5, 1 + i)), unit: units[i]._id,
  billingStart: (() => { const d = new Date(now.getFullYear(), now.getMonth() - 5, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; })(),
  createdAt: now, updatedAt: now,
}));

// Tanda tangan kwitansi: harus identik dengan signReceipt() di lib/receipt.js.
const sign = ({ receiptNo, tenantId, amount, paymentDate }) =>
  crypto.createHmac('sha256', process.env.JWT_SECRET)
    .update([receiptNo, String(tenantId), amount, paymentDate.toISOString().slice(0, 10)].join('|')).digest('hex');

const payments = [];
const seq = {}; // nomor urut kwitansi per bulan
for (let back = 5; back >= 0; back--) {
  const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
  tenants.forEach((t, i) => {
    const due = units[i].price;
    // Bulan ini: dua penghuni belum bayar, satu baru bayar setengah, sisanya lunas.
    let amount = due;
    if (back === 0) amount = i === 2 || i === 6 ? 0 : i === 5 ? Math.round(due / 2) : due;
    if (!amount) return;
    const paymentDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), 3 + ((i * 2) % 8)));
    const ym = `${paymentDate.getUTCFullYear()}${String(paymentDate.getUTCMonth() + 1).padStart(2, '0')}`;
    seq[ym] = (seq[ym] ?? 0) + 1;
    const receiptNo = `KW-${ym}-${String(seq[ym]).padStart(4, '0')}`;
    payments.push({
      _id: oid(), tenant: t._id, unit: t.unit, amount, paymentDate, proofUrl: '', receiptNo,
      token: crypto.randomBytes(18).toString('base64url'),
      signature: sign({ receiptNo, tenantId: t._id, amount, paymentDate }),
      recordedBy: 'seed', allocations: [], remainingAfter: 0, createdAt: paymentDate, updatedAt: paymentDate,
    });
  });
}

await col('units').insertMany(units);
await col('tenants').insertMany(tenants);
await col('payments').insertMany(payments);
await col('counters').insertMany(Object.entries(seq).map(([ym, n]) => ({ _id: `receipt-${ym}`, seq: n })));
await col('transactions').createIndex({ tenant: 1, period: 1 }, { unique: true });
console.log(`Seed selesai: ${units.length} unit, ${tenants.length} penghuni, ${payments.length} pembayaran/kwitansi.`);
console.log('Tagihan bulanan & alokasi dibuat otomatis saat aplikasi dibuka pertama kali.');
await mongoose.disconnect();
