import { route, json } from '@/lib/api';
import { Transaction } from '@/lib/models';

/** Daftar tagihan (opsional ?period=YYYY-MM). Pembayaran dicatat lewat /api/payments. */
export const GET = route(async ({ req }) => {
  const period = new URL(req.url).searchParams.get('period');
  return json(
    await Transaction.find(period ? { period } : {}).sort({ period: -1, createdAt: -1 })
      .populate('tenant', 'name phone').populate('unit', 'number'),
  );
});
