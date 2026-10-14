'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

const PAGE_SIZE = 10;

/**
 * Tabel generik dengan pencarian dan paginasi.
 * columns: [{ header, cell: (row) => node }]   searchText: (row) => string (kosongkan untuk sembunyikan pencarian)
 */
export function DataTable({ columns, rows, rowKey = (r) => r.id, searchText, toolbar, empty = 'Belum ada data.', paginate = true }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(
    () => (q && searchText ? rows.filter((r) => searchText(r).toLowerCase().includes(q.toLowerCase())) : rows),
    [rows, q, searchText],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = paginate ? filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE) : filtered;

  return (
    <div className="card overflow-hidden">
      {(searchText || toolbar) && (
        <div className="no-print flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          {searchText && (
            <div className="relative min-w-48 flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input className="input !pl-9" placeholder="Cari..." value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
            </div>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2">{toolbar}</div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table key={`${q}-${current}`} className="table-anim w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>{columns.map((c) => <th key={c.header} className="whitespace-nowrap px-4 py-3 font-medium">{c.header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((row) => (
              <tr key={rowKey(row)} className="transition-colors hover:bg-brand-50/60">
                {columns.map((c) => <td key={c.header} className="whitespace-nowrap px-4 py-3">{c.cell(row)}</td>)}
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">{empty}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {paginate && filtered.length > PAGE_SIZE && (
        <div className="no-print flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          <span>{filtered.length} data</span>
          <div className="flex items-center gap-2">
            <button className="btn-ghost btn-sm" disabled={current === 0} onClick={() => setPage(current - 1)}>Sebelumnya</button>
            <span>{current + 1} / {pages}</span>
            <button className="btn-ghost btn-sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Berikutnya</button>
          </div>
        </div>
      )}
    </div>
  );
}
