'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/** Kerangka halaman: sidebar tetap di desktop, drawer di mobile. */
export function AppShell({ children }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen">
      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <Sidebar />
      </aside>

      {open && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div className="animate-fade absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="animate-slideleft relative h-full w-64 bg-white">
            <button className="absolute right-3 top-3 p-1" onClick={() => setOpen(false)} aria-label="Tutup menu"><X className="h-5 w-5" /></button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar menuButton={<button className="btn-ghost !p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Buka menu"><Menu className="h-4 w-4" /></button>} />
        <main className="flex-1 p-4 sm:p-6"><div key={pathname} className="animate-fadeup">{children}</div></main>
      </div>
    </div>
  );
}
