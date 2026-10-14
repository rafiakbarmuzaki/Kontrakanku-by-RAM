// Mengisi data contoh: 10 unit, 7 penghuni, tagihan 6 bulan terakhir beserta pembayaran dan kwitansinya.
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
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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
  entryDate: new Date(now.getFullYear(), now.getMonth() - 5, 1 + i), unit: units[i]._id, createdAt: now, updatedAt: now,
}));

// Tanda tangan kwitansi: harus identik dengan signReceipt() di lib/receipt.js.
const sign = ({ receiptNo, tenantId, period, amount, paymentDate }) =>
  crypto.createHmac('sha256', process.env.JWT_SECRET)
    .update([receiptNo, String(tenantId), period, amount, paymentDate.toISOString().slice(0, 10)].join('|')).digest('hex');

const transactions = [];
const payments = [];
const seq = {}; // nomor urut kwitansi per bulan
for (let back = 5; back >= 0; back--) {
  const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
  const period = key(d);
  tenants.forEach((t, i) => {
    const due = units[i].price;
    let status = 'Paid';
    if (back === 0) status = i === 2 || i === 6 ? 'Overdue' : i === 5 ? 'Partial' : 'Paid';
    const amount = status === 'Paid' ? due : status === 'Partial' ? Math.round(due / 2) : 0;
    const paymentDate = amount ? new Date(Date.UTC(d.getFullYear(), d.getMonth(), 3 + ((i * 2) % 8))) : null;
    const txId = oid();
    transactions.push({ _id: txId, tenant: t._id, unit: t.unit, period, paymentDate, amountDue: due, amount, status, createdAt: now, updatedAt: now });
    if (amount) {
      const ym = `${paymentDate.getUTCFullYear()}${String(paymentDate.getUTCMonth() + 1).padStart(2, '0')}`;
      seq[ym] = (seq[ym] ?? 0) + 1;
      const receiptNo = `KW-${ym}-${String(seq[ym]).padStart(4, '0')}`;
      payments.push({
        _id: oid(), transaction: txId, tenant: t._id, unit: t.unit, period, amount, paymentDate, proofUrl: '',
        receiptNo, token: crypto.randomBytes(18).toString('base64url'),
        signature: sign({ receiptNo, tenantId: t._id, period, amount, paymentDate }), recordedBy: 'seed', createdAt: now, updatedAt: now,
      });
    }
  });
}

await col('units').insertMany(units);
await col('tenants').insertMany(tenants);
await col('transactions').insertMany(transactions);
await col('payments').insertMany(payments);
await col('counters').insertMany(Object.entries(seq).map(([ym, n]) => ({ _id: `receipt-${ym}`, seq: n })));
await col('transactions').createIndex({ tenant: 1, period: 1 }, { unique: true });
console.log(`Seed selesai: ${units.length} unit, ${tenants.length} penghuni, ${transactions.length} tagihan, ${payments.length} pembayaran/kwitansi.`);
await mongoose.disconnect();
