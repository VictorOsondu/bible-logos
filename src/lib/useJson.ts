'use client';

import { useEffect, useState } from 'react';

interface JsonState<T> {
  data: T | null;
  loading: boolean;
  /** The request failed (network error or a 5xx/4xx other than 404). */
  error: boolean;
  /** The server answered 404. */
  notFound: boolean;
}

/**
 * Fetches JSON for a client component. Distinguishes "not found" from "failed", ignores
 * responses for a URL that is no longer current, and offers retry().
 */
export function useJson<T>(url: string | null) {
  const [state, setState] = useState<JsonState<T>>({ data: null, loading: !!url, error: false, notFound: false });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    setState({ data: null, loading: true, error: false, notFound: false });
    fetch(url, { signal: controller.signal })
      .then(async res => {
        if (res.status === 404) return setState({ data: null, loading: false, error: false, notFound: true });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setState({ data: (await res.json()) as T, loading: false, error: false, notFound: false });
      })
      .catch(err => {
        if (err?.name !== 'AbortError') setState({ data: null, loading: false, error: true, notFound: false });
      });
    return () => controller.abort();
  }, [url, attempt]);

  return { ...state, retry: () => setAttempt(a => a + 1) };
}
