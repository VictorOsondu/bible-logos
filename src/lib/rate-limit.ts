// Fixed-window rate limiting, in memory (per server process).

interface Window {
  count: number;
  resetAt: number;
}

const MAX_TRACKED_KEYS = 10_000;

export class RateLimiter {
  private windows = new Map<string, Window>();

  constructor(private limit: number, private windowMs: number) {}

  /** Counts a request for `key`; returns how long to wait (ms) if it is over the limit, else 0. */
  hit(key: string, now = Date.now()): number {
    let window = this.windows.get(key);
    if (!window || window.resetAt <= now) {
      if (this.windows.size >= MAX_TRACKED_KEYS) this.prune(now);
      window = { count: 0, resetAt: now + this.windowMs };
      this.windows.set(key, window);
    }
    if (window.count >= this.limit) return window.resetAt - now;
    window.count++;
    return 0;
  }

  private prune(now: number) {
    for (const [key, window] of this.windows) {
      if (window.resetAt <= now) this.windows.delete(key);
    }
    // Still full: drop the oldest keys rather than grow without bound
    while (this.windows.size >= MAX_TRACKED_KEYS) {
      this.windows.delete(this.windows.keys().next().value as string);
    }
  }
}

/**
 * Best-effort client identifier. Forwarded headers are only meaningful behind a proxy that sets
 * them, so callers should pair a per-client limit with a global one.
 */
export function clientKey(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0].trim() || headers.get('x-real-ip') || 'unknown';
}
