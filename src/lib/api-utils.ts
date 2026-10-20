import { NextResponse } from 'next/server';
import { DatabaseNotAvailableError } from './db';

export function handleApiError(error: unknown): NextResponse {
  // Next.js signals "this route is dynamic" by throwing during the build; let it through.
  if ((error as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') throw error;

  if (error instanceof DatabaseNotAvailableError) {
    return NextResponse.json(
      { error: 'Database not available. Run "npm run seed" first.' },
      { status: 503 }
    );
  }

  // Details go to the server log only; clients get a generic message.
  console.error('API error:', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

/** Time allowed for a call to an outside service before giving up. */
export const EXTERNAL_TIMEOUT_MS = 8000;

/** fetch() for outside services, which always gives up after EXTERNAL_TIMEOUT_MS. */
export function fetchExternal(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(EXTERNAL_TIMEOUT_MS) });
}

/** Response for a failed call to an outside service: logged in full, reported generically. */
export function upstreamError(service: string, error: unknown): NextResponse {
  const timedOut = error instanceof Error && error.name === 'TimeoutError';
  console.error(`${service} request failed:`, error);
  return NextResponse.json(
    { error: timedOut ? `${service} did not respond in time` : `${service} is unavailable` },
    { status: timedOut ? 504 : 502 }
  );
}

/** Small in-memory cache with a time limit per entry and a cap on the number of entries. */
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_MAX_ENTRIES = 500;

export function getCached<T>(key: string, ttlMs: number, fn: () => T): T {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expires > now) {
    return cached.data as T;
  }
  const data = fn();
  setCached(key, data, ttlMs);
  return data;
}

export function peekCached<T>(key: string): T | undefined {
  const cached = cache.get(key);
  if (!cached) return undefined;
  if (cached.expires <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return cached.data as T;
}

export function setCached(key: string, data: unknown, ttlMs: number) {
  cache.delete(key);
  if (cache.size >= CACHE_MAX_ENTRIES) {
    // Maps keep insertion order, so the first key is the oldest entry
    cache.delete(cache.keys().next().value as string);
  }
  cache.set(key, { data, expires: Date.now() + ttlMs });
}
