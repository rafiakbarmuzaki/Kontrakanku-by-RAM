'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, DoorOpen, LayoutDashboard, Receipt, FileBarChart, Users, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useUser } from './UserProvider';

export const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/units', label: 'Unit / Pintu', icon: DoorOpen },
  { href: '/tenants', label: 'Penghuni', icon: Users },
  { href: '/debts', label: 'Hutang', icon: AlertTriangle },
  { href: '/transactions', label: 'Pembayaran', icon: Receipt },
  { href: '/reports', label: 'Laporan', icon: FileBarChart },
  { href: '/users', label: 'Pengguna', icon: ShieldCheck, superOnly: true },
];

export const isActive = (pathname, href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

export function Sidebar({ onNavigate }) {
  const pathname = usePathname();
  const { isSuper } = useUser();
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center gap-2 px-2 pt-1">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-lg shadow-brand-500/30 animate-float"><Building2 className="h-5 w-5" /></div>
        <div className="leading-tight">
          <p className="font-semibold">Kontrakan Damai</p>
          <p className="text-xs text-slate-500">Manajemen Properti</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.filter((n) => !n.superOnly || isSuper).map(({ href, label, icon: Icon }) => (
          <Link
            key={href} href={href} onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive(pathname, href)
                ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-md shadow-brand-500/30'
                : 'text-slate-600 hover:translate-x-1 hover:bg-brand-50 hover:text-brand-700'}`}
          >
            <Icon className="h-4 w-4" />{label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
