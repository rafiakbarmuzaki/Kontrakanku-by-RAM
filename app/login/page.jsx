'use client';

import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { api } from '@/lib/client';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await api('POST', '/api/auth/login', Object.fromEntries(new FormData(e.target)));
      location.href = '/';
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden p-4">
      {/* Latar bergerak */}
      <div className="animate-blob pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-400/30 blur-3xl" />
      <div className="animate-blob pointer-events-none absolute -bottom-32 -right-20 h-[28rem] w-[28rem] rounded-full bg-violet-400/30 blur-3xl [animation-delay:-6s]" />

      <form onSubmit={submit} className="card animate-popin relative w-full max-w-sm space-y-4 p-7 backdrop-blur">
        <div className="flex flex-col items-center gap-3 pb-2 text-center">
          <div className="animate-float grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-xl shadow-brand-500/30">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xl font-bold">Kontrakan Damai</p>
            <p className="text-sm text-slate-500">Masuk untuk mengelola kontrakan</p>
          </div>
        </div>
        <label className="block"><span className="label">Email</span>
          <input name="email" type="email" required autoComplete="username" className="input" /></label>
        <label className="block"><span className="label">Password</span>
          <input name="password" type="password" required autoComplete="current-password" className="input" /></label>
        {error && <p className="animate-fadein rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Masuk...' : 'Masuk'}</button>
      </form>
    </div>
  );
}
