'use client';

import { useState } from 'react';
import { formatIDR } from '@/lib/format';

/** Grafik batang SVG responsif tanpa library. data: [{ label, value }] */
export function RevenueChart({ data }) {
  const [hover, setHover] = useState(null);
  const W = 600, H = 240, top = 20, bottom = 28;
  const max = Math.max(...data.map((d) => d.value), 1);
  const innerH = H - top - bottom, slot = W / data.length, barW = Math.min(48, slot * 0.55);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Pendapatan 6 bulan terakhir">
        <defs>
          <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1="0" x2={W} y1={top + innerH * (1 - g)} y2={top + innerH * (1 - g)} className="stroke-slate-200" strokeDasharray="3 4" />
        ))}
        {data.map((d, i) => {
          const h = (d.value / max) * innerH, x = slot * i + (slot - barW) / 2;
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={slot * i} y="0" width={slot} height={H} fill="transparent" />
              <rect x={x} y={top + innerH - h} width={barW} height={h} rx="8" fill="url(#bar-grad)" className="bar" style={{ animationDelay: `${i * 90}ms`, opacity: hover === null || hover === i ? 1 : 0.55 }} />
              <text x={x + barW / 2} y={top + innerH - h - 6} textAnchor="middle" fontSize="10" className="fill-slate-500">{(d.value / 1e6).toFixed(1)}jt</text>
              <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="11" className="fill-slate-500">{d.label}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute right-2 top-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white shadow">
          {data[hover].label}: <b>{formatIDR(data[hover].value)}</b>
        </div>
      )}
    </div>
  );
}
