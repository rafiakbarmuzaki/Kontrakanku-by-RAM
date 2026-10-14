'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Modal generik (untuk konten non-form). Tutup dengan Esc atau klik latar. */
export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ui = (
    <div className="no-print fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="animate-fade absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`card animate-popin relative max-h-[90vh] w-full overflow-y-auto p-6 ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Tutup" className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
  // Dirender di luar pohon halaman agar posisi fixed selalu relatif ke layar (bukan ke elemen beranimasi).
  return createPortal(ui, document.body);
}
