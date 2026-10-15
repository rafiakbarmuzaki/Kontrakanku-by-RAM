import { route, json, readBody, bad, checkId } from '@/lib/api';
import { Tenant, Payment } from '@/lib/models';
import { recomputeTenantLedger, ensureCurrentPeriods } from '@/lib/billing';
import { nextReceiptNo, newToken, signReceipt, describePayment, publicBase } from '@/lib/receipt';

/**
 * Riwayat pembayaran dengan tautan kwitansi + WhatsApp.
 *   ?tenant=ID       pembayaran seorang penghuni
 *   ?transaction=ID  pembayaran yang dialokasikan ke satu tagihan bulanan
 *   (tanpa filter)   300 pembayaran terbaru
 */
export const GET = route(async ({ req }) => {
  const sp = new URL(req.url).searchParams;
  const filter = sp.get('tenant') ? { tenant: checkId(sp.get('tenant')) }
    : sp.get('transaction') ? { 'allocations.transaction': checkId(sp.get('transaction')) } : {};
  const base = publicBase(req);
  const list = await Payment.find(filter).sort({ paymentDate: -1, createdAt: -1 }).limit(300)
    .populate('tenant', 'name phone').populate('unit', 'number');
  return json(list.filter((p) => p.tenant).map((p) => ({ ...p.toJSON(), ...describePayment(p, { tenant: p.tenant, base }) })));
});

/**
 * Catat uang masuk kapan saja, berapa pun jumlahnya, tanpa memilih periode.
 * Uang dialokasikan FIFO oleh recomputeTenantLedger: melunasi hutang terlama dulu, sisanya
 * menjadi pembayaran di muka. Lalu kwitansi bertanda tangan digital diterbitkan.
 */
export const POST = route(async ({ req, user }) => {
  const b = await readBody(req);
  const tenant = await Tenant.findById(checkId(b.tenant)).populate('unit', 'number');
  if (!tenant) throw bad('Penghuni tidak ditemukan');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.paymentDate || '')) throw bad('Tanggal bayar wajib diisi');
  const amount = Number(b.amount);
  if (!Number.isInteger(amount) || amount <= 0) throw bad('Jumlah harus lebih dari 0');

  const date = new Date(b.paymentDate);
  const receiptNo = await nextReceiptNo(date);
  const payment = await Payment.create({
    tenant: tenant._id, unit: tenant.unit?._id, amount, paymentDate: date,
    receiptNo, token: newToken(), recordedBy: user.email,
    signature: signReceipt({ receiptNo, tenantId: tenant._id, amount, paymentDate: date }),
  });
  await ensureCurrentPeriods();
  await recomputeTenantLedger(tenant._id); // mengisi alokasi + sisa hutang pada pembayaran ini
  const saved = await Payment.findById(payment._id);
  return json({ ...saved.toJSON(), ...describePayment(saved, { tenant, base: publicBase(req) }) }, 201);
});
