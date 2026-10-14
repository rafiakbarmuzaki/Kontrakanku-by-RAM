import { route, json, readBody } from '@/lib/api';
import { Unit } from '@/lib/models';
import { syncUnits } from '@/lib/billing';
import { pickUnit } from '@/lib/validators';

export const GET = route(async () => json(await Unit.find().sort({ number: 1 })));

export const POST = route(async ({ req }) => {
  const unit = await Unit.create(pickUnit(await readBody(req)));
  await syncUnits();
  return json(await Unit.findById(unit._id), 201);
});
