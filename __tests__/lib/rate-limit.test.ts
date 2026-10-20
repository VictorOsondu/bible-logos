import { describe, it, expect } from 'vitest';
import { RateLimiter, clientKey } from '../../src/lib/rate-limit';

describe('RateLimiter', () => {
  it('allows up to the limit, then reports the wait until the window resets', () => {
    const limiter = new RateLimiter(3, 1000);
    expect([0, 1, 2].map(() => limiter.hit('a', 0))).toEqual([0, 0, 0]);
    expect(limiter.hit('a', 400)).toBe(600);
    expect(limiter.hit('a', 1000)).toBe(0); // new window
  });

  it('counts each client separately', () => {
    const limiter = new RateLimiter(1, 1000);
    expect(limiter.hit('a', 0)).toBe(0);
    expect(limiter.hit('b', 0)).toBe(0);
    expect(limiter.hit('a', 0)).toBeGreaterThan(0);
  });
});

describe('clientKey', () => {
  it('uses the first forwarded address, then x-real-ip', () => {
    expect(clientKey(new Headers({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' }))).toBe('203.0.113.5');
    expect(clientKey(new Headers({ 'x-real-ip': '198.51.100.7' }))).toBe('198.51.100.7');
    expect(clientKey(new Headers())).toBe('unknown');
  });
});
