import { route, json, readBody } from '@/lib/api';
import { Tenant } from '@/lib/models';
import { syncUnits } from '@/lib/billing';
import { pickTenant, assertUnitFree } from '@/lib/validators';

export const GET = route(async () => json(await Tenant.find().populate('unit', 'number price').sort({ name: 1 })));

export const POST = route(async ({ req }) => {
  const data = pickTenant(await readBody(req));
  await assertUnitFree(data.unit);
  const tenant = await Tenant.create(data);
  await syncUnits();
  return json(await Tenant.findById(tenant._id).populate('unit', 'number price'), 201);
});
