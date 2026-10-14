'use client';

import { useEffect, useState } from 'react';

/** Angka yang menghitung naik dari 0 ke `value` (ease-out). Langsung tampil jika pengguna mematikan animasi. */
export function CountUp({ value, format = String, duration = 900 }) {
  const [v, setV] = useState(0);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(value); return; }
    let raf, start;
    const step = (t) => {
      start ??= t;
      const p = Math.min((t - start) / duration, 1);
      setV(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{format(Math.round(v))}</>;
}
