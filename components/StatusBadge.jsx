const styles = {
  Occupied: 'bg-emerald-50 text-emerald-700',
  Paid: 'bg-emerald-50 text-emerald-700',
  Vacant: 'bg-slate-100 text-slate-600',
  Maintenance: 'bg-amber-50 text-amber-700',
  Partial: 'bg-amber-50 text-amber-700',
  Overdue: 'bg-rose-50 text-rose-700',
  super_admin: 'bg-brand-50 text-brand-700',
};

export function StatusBadge({ status, label }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.Vacant}`}>{label ?? status}</span>;
}
