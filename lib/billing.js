import { Unit, Tenant, Transaction, Payment } from './models';

/** Status tagihan dihitung dari tagihan vs total dibayar. */
export const computeStatus = (amount, due) => (amount >= due ? 'Paid' : amount > 0 ? 'Partial' : 'Overdue');

/** Status unit mengikuti penempatan penghuni (Maintenance diatur manual). */
export async function syncUnits() {
  const occupied = await Tenant.distinct('unit');
  await Unit.updateMany({ _id: { $in: occupied }, status: { $ne: 'Maintenance' } }, { status: 'Occupied' });
  await Unit.updateMany({ _id: { $nin: occupied }, status: { $ne: 'Maintenance' } }, { status: 'Vacant' });
}

export const currentPeriod = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** Hitung ulang total dibayar, tanggal bayar terakhir, dan status sebuah tagihan dari daftar Payment-nya. */
export async function recalcTransaction(txId) {
  const tx = await Transaction.findById(txId);
  if (!tx) return null;
  const pays = await Payment.find({ transaction: txId }).sort({ paymentDate: 1 });
  tx.amount = pays.reduce((s, p) => s + p.amount, 0);
  tx.paymentDate = pays.length ? pays[pays.length - 1].paymentDate : null;
  tx.status = computeStatus(tx.amount, tx.amountDue);
  await tx.save();
  return tx;
}
