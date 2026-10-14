'use client';

import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { NAV, isActive } from './Sidebar';
import { useUser } from './UserProvider';

export function Topbar({ menuButton }) {
  const pathname = usePathname();
  const { user, isSuper, logout } = useUser();
  const current = NAV.find((n) => isActive(pathname, n.href));
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/70 px-4 backdrop-blur-md sm:px-6">
      {menuButton}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold">{current?.label ?? 'Kontrakanku'}</h1>
        <p className="hidden text-xs text-slate-500 sm:block" suppressHydrationWarning>{today}</p>
      </div>
      <div className="hidden text-right text-xs leading-tight sm:block">
        <p className="font-medium">{user.email}</p>
        <p className="text-slate-500">{isSuper ? 'Super Admin' : 'Admin'}</p>
      </div>
      <button onClick={logout} className="btn-ghost !px-3" aria-label="Keluar"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Keluar</span></button>
    </header>
  );
}
