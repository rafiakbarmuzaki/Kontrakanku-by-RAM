'use client';

import { useToast } from './Toast';

/**
 * Jalankan aksi tulis dengan toast sukses/gagal, lalu muat ulang data.
 *   const act = useAction(reload);
 *   const ok = await act(() => api('POST', '/api/units', body), 'Unit ditambahkan');
 */
export function useAction(reload) {
  const toast = useToast();
  return async (fn, okMessage) => {
    try {
      await fn();
      toast(okMessage);
      await reload?.();
      return true;
    } catch (e) {
      toast(e.message, 'error');
      return false;
    }
  };
}
