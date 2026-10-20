import { NextResponse } from 'next/server';
import { getDb, isDatabaseAvailable } from '@/lib/db';

export const dynamic = 'force-dynamic';

const unavailable = (reason: string) =>
  NextResponse.json({ status: 'unavailable', reason }, { status: 503, headers: { 'Cache-Control': 'no-store' } });

/** Liveness and readiness: 200 when the database is present and readable, 503 otherwise. */
export function GET() {
  if (!isDatabaseAvailable()) return unavailable('database missing');
  try {
    const { ok } = getDb().prepare('SELECT EXISTS (SELECT 1 FROM verses) AS ok').get() as { ok: number };
    if (!ok) return unavailable('database empty');
    return NextResponse.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Health check failed:', error);
    return unavailable('database unreadable');
  }
}
