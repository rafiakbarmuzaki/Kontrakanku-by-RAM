import { route, json, readBody, checkId, HttpError } from '@/lib/api';
import { Unit, Tenant } from '@/lib/models';
import { syncUnits, recomputeTenantLedger } from '@/lib/billing';
import { pickUnit } from '@/lib/validators';

export const PUT = route(async ({ req, params }) => {
  const unit = await Unit.findByIdAndUpdate(checkId(params.id), pickUnit(await readBody(req)), { new: true, runValidators: true });
  if (!unit) throw new HttpError(404, 'Unit tidak ditemukan');
  await syncUnits();
  const tenant = await Tenant.findOne({ unit: unit._id }, '_id');
  if (tenant) await recomputeTenantLedger(tenant._id); // harga baru memengaruhi nominal tagihan
  return json(await Unit.findById(unit._id));
});

export const DELETE = route(async ({ params }) => {
  if (await Tenant.exists({ unit: checkId(params.id) })) throw new HttpError(409, 'Unit masih dihuni, pindahkan penghuni dulu');
  await Unit.findByIdAndDelete(params.id);
  return json({ ok: true });
}, { superOnly: true });
