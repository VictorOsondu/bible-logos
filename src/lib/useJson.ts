'use client';

import { useEffect, useState } from 'react';

interface Result<T> {
  key: string;
  data: T | null;
  error: boolean;
  notFound: boolean;
}

/**
 * Fetches JSON for a client component. Distinguishes "not found" (404) from "failed", ignores
 * responses for a URL that is no longer current, and offers retry().
 */
export function useJson<T>(url: string | null) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);
  const key = url ? `${attempt}:${url}` : null;

  useEffect(() => {
    if (!url) return;
    const requestKey = `${attempt}:${url}`;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then(async res => {
        if (res.status === 404) return setResult({ key: requestKey, data: null, error: false, notFound: true });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setResult({ key: requestKey, data: (await res.json()) as T, error: false, notFound: false });
      })
      .catch(err => {
        if (err?.name !== 'AbortError') setResult({ key: requestKey, data: null, error: true, notFound: false });
      });
    return () => controller.abort();
  }, [url, attempt]);

  // The stored result only counts if it belongs to the current request
  const current = result && result.key === key ? result : null;
  return {
    data: current?.data ?? null,
    loading: key !== null && !current,
    error: current?.error ?? false,
    notFound: current?.notFound ?? false,
    retry: () => setAttempt(a => a + 1),
  };
}
