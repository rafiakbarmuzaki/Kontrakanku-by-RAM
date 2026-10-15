import { route, json } from '@/lib/api';
import { Transaction } from '@/lib/models';
import { ensureCurrentPeriods } from '@/lib/billing';

/**
 * Tagihan bulanan (opsional ?period=YYYY-MM). Dibuat dan diisi otomatis oleh recomputeTenantLedger;
 * pembayaran dicatat lewat /api/payments dan dialokasikan ke tagihan terlama dulu.
 */
export const GET = route(async ({ req }) => {
  await ensureCurrentPeriods();
  const period = new URL(req.url).searchParams.get('period');
  return json(
    await Transaction.find(period ? { period } : {}).sort({ period: -1, createdAt: -1 })
      .populate('tenant', 'name phone').populate('unit', 'number'),
  );
});
