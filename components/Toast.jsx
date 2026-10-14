'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

const Ctx = createContext(() => {});
/** const toast = useToast(); toast('Unit ditambahkan'); toast('Gagal', 'error'); */
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const dismiss = (id) => setItems((l) => l.filter((t) => t.id !== id));
  const push = useCallback((message, kind = 'success') => {
    const id = Math.random();
    setItems((l) => [...l, { id, message, kind }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="no-print fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {items.map((t) => (
          <div key={t.id} className="card flex min-w-64 max-w-sm animate-slidein items-center gap-3 px-4 py-3 text-sm">
            {t.kind === 'success'
              ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              : <XCircle className="h-5 w-5 shrink-0 text-rose-500" />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Tutup" className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
