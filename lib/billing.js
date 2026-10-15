import { Unit, Tenant, Transaction, Payment } from './models';

/** Status tagihan dihitung dari tagihan vs jumlah yang sudah teralokasi. */
export const computeStatus = (amount, due) => (amount >= due ? 'Paid' : amount > 0 ? 'Partial' : 'Overdue');

/** Status unit mengikuti penempatan penghuni (Maintenance diatur manual). */
export async function syncUnits() {
  const occupied = await Tenant.distinct('unit');
  await Unit.updateMany({ _id: { $in: occupied }, status: { $ne: 'Maintenance' } }, { status: 'Occupied' });
  await Unit.updateMany({ _id: { $nin: occupied }, status: { $ne: 'Maintenance' } }, { status: 'Vacant' });
}

/** "2026-10" untuk tanggal tertentu (lokal server). */
export const currentPeriod = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** Bulan masuk penghuni, dibaca dari tanggal yang disimpan sebagai UTC tengah malam. */
const periodOfDate = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

const nextPeriod = (p) => {
  const [y, m] = p.split('-').map(Number);
  return currentPeriod(new Date(y, m, 1)); // m berbasis-1, jadi indeks `m` = bulan berikutnya
};

const periodsBetween = (from, to) => {
  const out = [];
  for (let p = from, guard = 0; p <= to && guard < 600; p = nextPeriod(p), guard++) out.push(p);
  return out;
};

/**
 * Hitung ulang seluruh tagihan dan alokasi pembayaran satu penghuni dari nol.
 *
 * Aturan:
 *  - Tagihan dibuat otomatis tiap bulan, dari bulan masuk sampai bulan berjalan (nominal = harga unit).
 *  - Pembayaran diproses berurutan menurut tanggal bayar; tiap pembayaran melunasi tagihan
 *    TERLAMA yang belum lunas lebih dulu (FIFO). Kekurangan satu bulan otomatis terbawa ke
 *    pembayaran berikutnya.
 *  - Uang yang melebihi seluruh tagihan sampai bulan berjalan menjadi pembayaran di muka:
 *    tagihan bulan-bulan berikutnya dibuat dan terisi sesuai kelebihannya.
 *  - Karena dihitung ulang dari seluruh pembayaran, hasilnya konsisten walau ada pembayaran
 *    yang dihapus atau tanggalnya berurutan tidak sesuai urutan input.
 */
export async function recomputeTenantLedger(tenantId) {
  const tenant = await Tenant.findById(tenantId).populate('unit', 'price');
  if (!tenant) return null;

  const price = tenant.unit?.price ?? 0;
  const thisMonth = currentPeriod();
  const payments = await Payment.find({ tenant: tenant._id }).sort({ paymentDate: 1, createdAt: 1, _id: 1 });

  // Bulan pertama yang ditagih. Penghuni dari data lama (belum punya billingStart) mulai dari
  // tagihan/pembayaran tertua yang sudah tercatat, atau bulan ini jika belum ada; lalu disimpan.
  let startMonth = tenant.billingStart;
  if (!startMonth) {
    const oldestBill = await Transaction.findOne({ tenant: tenant._id }).sort({ period: 1 }).select('period');
    const candidates = [oldestBill?.period, payments[0] && periodOfDate(payments[0].paymentDate), thisMonth].filter(Boolean);
    startMonth = candidates.sort()[0];
    await Tenant.updateOne({ _id: tenant._id }, { $set: { billingStart: startMonth } });
  }
  const entryMonth = startMonth; // nama lama dipertahankan di bawah: awal rentang tagihan
  const dueRange = periodsBetween(entryMonth, thisMonth); // kosong jika mulai ditagih bulan depan
  const totalDue = dueRange.length * price;

  const ledger = new Map(); // period -> { amount, lastDate }
  const entry = (p) => {
    if (!ledger.has(p)) ledger.set(p, { amount: 0, lastDate: null });
    return ledger.get(p);
  };
  let lastPeriod = entryMonth > thisMonth ? entryMonth : thisMonth;
  let paidWithinRange = 0; // total teralokasi ke bulan <= bulan berjalan (mengurangi hutang)
  const perPayment = [];

  for (const pay of payments) {
    let remaining = pay.amount;
    const allocations = [];
    if (price > 0) {
      for (let p = entryMonth, guard = 0; remaining > 0 && guard < 600; p = nextPeriod(p), guard++) {
        const e = entry(p);
        const room = price - e.amount;
        if (room <= 0) continue;
        const take = Math.min(room, remaining);
        e.amount += take;
        e.lastDate = pay.paymentDate;
        remaining -= take;
        allocations.push({ period: p, amount: take });
        if (p > lastPeriod) lastPeriod = p;
        if (p <= thisMonth) paidWithinRange += take;
      }
    }
    perPayment.push({ id: pay._id, allocations, remainingAfter: Math.max(0, totalDue - paidWithinRange) });
  }

  // Tagihan untuk setiap periode dari bulan masuk sampai periode terakhir yang tersentuh.
  const periods = periodsBetween(entryMonth, lastPeriod);
  if (periods.length) {
    await Transaction.bulkWrite(periods.map((p) => {
      const amount = ledger.get(p)?.amount ?? 0;
      return {
        updateOne: {
          filter: { tenant: tenant._id, period: p },
          update: { $set: { unit: tenant.unit?._id, amountDue: price, amount, status: computeStatus(amount, price), paymentDate: ledger.get(p)?.lastDate ?? null } },
          upsert: true,
        },
      };
    }));
  }

  // Hapus tagihan sisa yang tidak lagi relevan (mis. bulan di muka yang pembayarannya sudah dihapus).
  await Transaction.deleteMany({ tenant: tenant._id, $or: [{ period: { $lt: entryMonth } }, { period: { $gt: lastPeriod } }] });

  const txs = await Transaction.find({ tenant: tenant._id }, 'period');
  const txId = Object.fromEntries(txs.map((t) => [t.period, t._id]));
  if (perPayment.length) {
    await Payment.bulkWrite(perPayment.map(({ id, allocations, remainingAfter }) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { remainingAfter, allocations: allocations.map((a) => ({ ...a, transaction: txId[a.period] })) } },
      },
    })));
  }
  return { periods, totalDue };
}

/**
 * Pastikan setiap penghuni punya tagihan sampai bulan berjalan (mis. saat pergantian bulan).
 * Murah: hanya penghuni yang tagihan terakhirnya masih bulan lalu yang dihitung ulang.
 */
export async function ensureCurrentPeriods() {
  const thisMonth = currentPeriod();
  const tenants = await Tenant.find({}, '_id billingStart');
  // Penghuni dengan pembayaran format lama (belum punya alokasi) dihitung ulang sekali agar kwitansi lamanya terisi.
  const legacy = new Set((await Payment.distinct('tenant', { 'allocations.0': { $exists: false } })).map(String));
  const stale = [];
  for (const t of tenants) {
    if (legacy.has(String(t._id)) || !t.billingStart) { stale.push(t._id); continue; }
    if (t.billingStart > thisMonth) continue; // belum mulai ditagih
    const latest = await Transaction.findOne({ tenant: t._id }).sort({ period: -1 }).select('period');
    if (!latest || latest.period < thisMonth) stale.push(t._id);
  }
  await Promise.all(stale.map((id) => recomputeTenantLedger(id)));
}
