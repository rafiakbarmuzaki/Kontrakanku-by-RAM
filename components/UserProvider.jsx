'use client';

import { createContext, useContext } from 'react';
import { useFetch, api } from '@/lib/client';

const Ctx = createContext(null);
/** { user: {email, role}, isSuper, logout } */
export const useUser = () => useContext(Ctx);

export function UserProvider({ children }) {
  const { data: user, loading } = useFetch('/api/auth/me');
  const logout = async () => { await api('POST', '/api/auth/logout').catch(() => {}); location.href = '/login'; };

  if (loading || !user) return <p className="p-6 text-sm text-slate-500">Memuat...</p>;
  return <Ctx.Provider value={{ user, isSuper: user.role === 'super_admin', logout }}>{children}</Ctx.Provider>;
}
