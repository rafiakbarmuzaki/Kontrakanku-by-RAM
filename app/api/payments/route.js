import { route, json, readBody, bad, checkId, HttpError } from '@/lib/api';
import { Tenant, Transaction, Payment } from '@/lib/models';
import { recalcTransaction } from '@/lib/billing';
import { saveProof, deleteProof } from '@/lib/storage';
import { nextReceiptNo, newToken, signReceipt, describePayment, publicBase } from '@/lib/receipt';
import { formatIDR } from '@/lib/format';

/** Riwayat pembayaran sebuah tagihan (?transaction=ID) atau seorang penghuni (?tenant=ID), lengkap dengan tautan kwitansi. */
export const GET = route(async ({ req }) => {
  const sp = new URL(req.url).searchParams;
  const filter = sp.get('transaction') ? { transaction: checkId(sp.get('transaction')) } : sp.get('tenant') ? { tenant: checkId(sp.get('tenant')) } : null;
  if (!filter) throw bad('Sertakan ?transaction= atau ?tenant=');
  const base = publicBase(req);
  const list = await Payment.find(filter).sort({ paymentDate: -1, createdAt: -1 }).populate('tenant', 'name phone').populate('transaction', 'amountDue amount');
  return json(list.map((p) => ({ ...p.toJSON(), ...describePayment(p, { tenant: p.tenant, tx: p.transaction, base }) })));
});

/**
 * Catat uang masuk. Membuat tagihan periode itu jika belum ada (tagihan = harga unit),
 * menambah Payment, menghitung ulang status tagihan, dan menerbitkan kwitansi bertanda tangan digital.
 */
export const POST = route(async ({ req, user }) => {
  const b = await readBody(req);
  const tenant = await Tenant.findById(checkId(b.tenant)).populate('unit', 'price number');
  if (!tenant) throw bad('Penghuni tidak ditemukan');
  if (!/^\d{4}-\d{2}$/.test(b.period || '')) throw bad('Periode tidak valid');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.paymentDate || '')) throw bad('Tanggal bayar wajib diisi');
  const amount = Number(b.amount);
  if (!Number.isInteger(amount) || amount <= 0) throw bad('Jumlah harus lebih dari 0');

  let tx = await Transaction.findOne({ tenant: tenant._id, period: b.period });
  const remaining = tx ? tx.amountDue - tx.amount : (tenant.unit?.price ?? 0);
  if (amount > remaining) {
    throw new HttpError(409, remaining <= 0 ? 'Tagihan periode ini sudah lunas' : `Jumlah melebihi sisa tagihan (${formatIDR(remaining)})`);
  }
  tx ??= await Transaction.create({
    tenant: tenant._id, unit: tenant.unit?._id, period: b.period, amountDue: tenant.unit?.price ?? 0, amount: 0, status: 'Overdue',
  });

  const proofUrl = await saveProof(b.proof);
  try {
    const date = new Date(b.paymentDate);
    const receiptNo = await nextReceiptNo(date);
    const payment = await Payment.create({
      transaction: tx._id, tenant: tenant._id, unit: tenant.unit?._id, period: b.period, amount, paymentDate: date, proofUrl,
      receiptNo, token: newToken(), recordedBy: user.email,
      signature: signReceipt({ receiptNo, tenantId: tenant._id, period: b.period, amount, paymentDate: date }),
    });
    tx = await recalcTransaction(tx._id);
    return json({ ...payment.toJSON(), ...describePayment(payment, { tenant, tx, base: publicBase(req) }) }, 201);
  } catch (e) {
    await deleteProof(proofUrl); // jangan tinggalkan file yatim
    throw e;
  }
});
