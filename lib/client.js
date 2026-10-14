'use client';

import { useCallback, useEffect, useState } from 'react';

/** Panggil API. Body FormData dikirim multipart, selain itu JSON. Melempar Error dengan pesan dari server. */
export async function api(method, url, body) {
  const opt = { method, headers: {}, credentials: 'same-origin' };
  if (body instanceof FormData) opt.body = body;
  else if (body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
  const res = await fetch(url, opt);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !location.pathname.startsWith('/login')) location.href = '/login';
    throw Object.assign(new Error(data.error || 'Terjadi kesalahan'), { status: res.status });
  }
  return data;
}

/** GET dengan state loading/error dan reload(). `url` null = tunda. */
export function useFetch(url) {
  const [state, setState] = useState({ data: null, error: null, loading: Boolean(url) });
  const load = useCallback(async () => {
    if (!url) return;
    try {
      setState((s) => ({ ...s, loading: true, error: null }));
      setState({ data: await api('GET', url), error: null, loading: false });
    } catch (e) {
      setState({ data: null, error: e.message, loading: false });
    }
  }, [url]);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}
