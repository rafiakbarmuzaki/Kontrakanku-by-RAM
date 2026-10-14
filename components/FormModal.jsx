'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

/**
 * Modal form berbasis konfigurasi field.
 * fields: [{ name, label, type?, value?, options?: [[value, label]], required?, attrs?, hint? }]
 * onSubmit(values) harus async; modal ditutup oleh pemanggil (onClose) saat sukses.
 */
export function FormModal({ title, fields, onSubmit, onClose }) {
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSubmit(Object.fromEntries(new FormData(e.target))); } finally { setSaving(false); }
  };

  return (
    <div className="no-print fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="animate-fade absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={submit} className="card animate-popin relative max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        {fields.map((f) => (
          <label key={f.name} className="block">
            <span className="label">{f.label}</span>
            {f.type === 'select' ? (
              <select name={f.name} defaultValue={f.value ?? ''} required={f.required !== false} className="input">
                {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ) : f.type === 'file' ? (
              <>
                <input type="file" name={f.name} accept="image/*,.pdf" className="input" />
                {f.hint && <p className="mt-1 text-xs text-slate-500">{f.hint}</p>}
              </>
            ) : (
              <input
                name={f.name} type={f.type || 'text'} defaultValue={f.value ?? ''} required={f.required !== false}
                className="input" {...(f.attrs || {})}
              />
            )}
          </label>
        ))}
        <div className="flex justify-end gap-2 pt-3">
          <button type="button" className="btn-ghost" onClick={onClose}>Batal</button>
          <button className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </form>
    </div>
  );
}
