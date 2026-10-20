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

  console.error('API error:', error);
  const message = error instanceof Error ? error.message : 'Internal server error';
  return NextResponse.json({ error: message }, { status: 500 });
}

/** Simple in-memory cache with TTL */
const cache = new Map<string, { data: unknown; expires: number }>();

export function getCached<T>(key: string, ttlMs: number, fn: () => T): T {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expires > now) {
    return cached.data as T;
  }
  const data = fn();
  cache.set(key, { data, expires: now + ttlMs });
  return data;
}
