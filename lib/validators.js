import { HttpError, checkId } from './api';
import { Unit, Tenant } from './models';

/** Ambil hanya field yang boleh diisi klien. */
export const pickUnit = (b) => ({
  number: b.number,
  price: b.price,
  status: b.status,
  facilities: Array.isArray(b.facilities) ? b.facilities.map((s) => String(s).trim()).filter(Boolean) : [],
});

export const pickTenant = (b) => ({
  name: b.name, ktp: b.ktp, phone: b.phone, emergencyContact: b.emergencyContact, entryDate: b.entryDate, unit: b.unit,
});

/** Pastikan unit ada dan belum dihuni penghuni lain. */
export async function assertUnitFree(unitId, selfId) {
  if (!unitId) return;
  checkId(unitId);
  if (!(await Unit.exists({ _id: unitId }))) throw new HttpError(404, 'Unit tidak ditemukan');
  if (await Tenant.exists({ unit: unitId, _id: { $ne: selfId } })) throw new HttpError(409, 'Unit sudah dihuni penghuni lain');
}
