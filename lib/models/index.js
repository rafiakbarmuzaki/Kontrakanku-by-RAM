import mongoose from 'mongoose';

const { Schema, model, models } = mongoose;

/** Semua dokumen dikirim ke klien dengan `id` (string) menggantikan `_id`. */
const opts = {
  timestamps: true,
  toJSON: {
    versionKey: false,
    transform: (doc, ret) => { ret.id = String(ret._id); delete ret._id; return ret; },
  },
};

const UnitSchema = new Schema({
  number: { type: String, required: [true, 'Nomor unit wajib diisi'], unique: true, trim: true },
  price: { type: Number, required: [true, 'Harga wajib diisi'], min: [0, 'Harga tidak boleh negatif'] }, // IDR / bulan
  status: { type: String, enum: ['Occupied', 'Vacant', 'Maintenance'], default: 'Vacant' },
  facilities: { type: [String], default: [] },
}, opts);

const TenantSchema = new Schema({
  name: { type: String, required: [true, 'Nama wajib diisi'], trim: true },
  ktp: { type: String, required: true, unique: true, match: [/^\d{16}$/, 'No. KTP harus 16 digit'] },
  phone: { type: String, required: [true, 'Telepon wajib diisi'], trim: true },
  emergencyContact: { type: String, required: [true, 'Kontak darurat wajib diisi'], trim: true },
  entryDate: { type: Date, required: [true, 'Tanggal masuk wajib diisi'] },
  unit: { type: Schema.Types.ObjectId, ref: 'Unit', required: [true, 'Pilih unit'] },
}, opts);

/**
 * Tagihan: satu per penghuni per bulan. `amount` dan `status` adalah hasil jumlah dari
 * koleksi Payment (dihitung ulang oleh recalcTransaction), bukan diisi langsung.
 */
const TransactionSchema = new Schema({
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  unit: { type: Schema.Types.ObjectId, ref: 'Unit' },
  period: { type: String, required: true, match: [/^\d{4}-\d{2}$/, 'Periode tidak valid'] }, // bulan yang ditagih
  paymentDate: { type: Date, default: null }, // tanggal pembayaran terakhir
  amountDue: { type: Number, required: true, min: 0 }, // tagihan
  amount: { type: Number, default: 0, min: 0 }, // total sudah dibayar
  status: { type: String, enum: ['Paid', 'Partial', 'Overdue'], required: true },
}, opts);
TransactionSchema.index({ tenant: 1, period: 1 }, { unique: true });

/** Satu kali uang masuk. Setiap Payment punya kwitansi sendiri (receiptNo + token publik + tanda tangan HMAC). */
const PaymentSchema = new Schema({
  transaction: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true, index: true },
  tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  unit: { type: Schema.Types.ObjectId, ref: 'Unit' },
  period: { type: String, required: true },
  amount: { type: Number, required: true, min: [1, 'Jumlah harus lebih dari 0'] },
  paymentDate: { type: Date, required: true },
  proofUrl: { type: String, default: '' }, // bukti transfer
  receiptNo: { type: String, required: true, unique: true },
  token: { type: String, required: true, unique: true }, // dipakai di tautan kwitansi publik
  signature: { type: String, required: true },
  recordedBy: { type: String, default: '' },
}, opts);

const CounterSchema = new Schema({ _id: String, seq: { type: Number, default: 0 } }, { versionKey: false });

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['super_admin', 'admin'], default: 'admin' },
}, opts);

export const Unit = models.Unit || model('Unit', UnitSchema);
export const Tenant = models.Tenant || model('Tenant', TenantSchema);
export const Transaction = models.Transaction || model('Transaction', TransactionSchema);
export const Payment = models.Payment || model('Payment', PaymentSchema);
export const Counter = models.Counter || model('Counter', CounterSchema);
export const User = models.User || model('User', UserSchema);
