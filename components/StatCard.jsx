import { CountUp } from './CountUp';

const tones = {
  brand: 'from-brand-500 to-violet-500 shadow-brand-500/30',
  emerald: 'from-emerald-400 to-teal-500 shadow-emerald-500/30',
  amber: 'from-amber-400 to-orange-500 shadow-amber-500/30',
  rose: 'from-rose-400 to-pink-500 shadow-rose-500/30',
};

/** Kartu statistik. Beri `amount` (+ `format`) agar angkanya menghitung naik; atau `value` untuk teks biasa. */
export function StatCard({ label, value, amount, format, hint, icon: Icon, tone = 'brand' }) {
  return (
    <div className="card shine flex items-start justify-between gap-3 p-5 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300">
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 truncate text-2xl font-semibold tracking-tight">
          {amount != null ? <CountUp value={amount} format={format} /> : value}
        </p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}
