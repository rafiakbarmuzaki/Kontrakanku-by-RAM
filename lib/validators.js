import { HttpError, checkId } from './api';
import { Unit, Tenant } from './models';
import { currentPeriod, activeTenantFilter } from './billing';

/** Ambil hanya field yang boleh diisi klien. */
export const pickUnit = (b) => ({
  number: b.number,
  price: b.price,
  status: b.status,
  facilities: Array.isArray(b.facilities) ? b.facilities.map((s) => String(s).trim()).filter(Boolean) : [],
});

/**
 * Bulan mulai ditagih: dipakai jika valid; jika kosong, bulan berjalan (atau bulan masuk bila
 * penghuni baru masuk di bulan depan), supaya penghuni lama tidak langsung punya hutang bertahun-tahun.
 */
const defaultBillingStart = (entryDate) => {
  const entryMonth = String(entryDate || '').slice(0, 7);
  const now = currentPeriod();
  return /^\d{4}-\d{2}$/.test(entryMonth) && entryMonth > now ? entryMonth : now;
};

export const pickTenant = (b) => ({
  name: b.name, ktp: b.ktp, phone: b.phone, emergencyContact: b.emergencyContact, entryDate: b.entryDate, unit: b.unit,
  billingStart: /^\d{4}-\d{2}$/.test(b.billingStart || '') ? b.billingStart : defaultBillingStart(b.entryDate),
  moveOutDate: /^\d{4}-\d{2}-\d{2}$/.test(b.moveOutDate || '') ? b.moveOutDate : null, // kosong = masih tinggal
});

/** Pastikan unit ada dan belum dihuni penghuni lain. */
export async function assertUnitFree(unitId, selfId) {
  if (!unitId) return;
  checkId(unitId);
  if (!(await Unit.exists({ _id: unitId }))) throw new HttpError(404, 'Unit tidak ditemukan');
  // Hanya penghuni yang masih tinggal yang menghalangi; penghuni yang sudah keluar tidak.
  if (await Tenant.exists({ unit: unitId, _id: { $ne: selfId }, ...activeTenantFilter() })) throw new HttpError(409, 'Unit sudah dihuni penghuni lain');
}
