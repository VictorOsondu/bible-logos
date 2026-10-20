import { describe, it, expect, vi, beforeEach } from 'vitest';

const request = (q: string, ip = '203.0.113.9') =>
  new Request(`http://localhost/api/research?q=${encodeURIComponent(q)}&source=openlibrary`, {
    headers: { 'x-forwarded-for': ip },
  }) as any;

describe('Research API caching and rate limits', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('serves a repeated query from cache without calling the service again', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      new Response(JSON.stringify({ docs: [{ key: '/works/1', title: 'A' }], numFound: 1 }))
    );
    const { GET } = await import('../../src/app/api/research/route');
    const first = await GET(request('cache me'));
    const second = await GET(request('cache me'));
    expect(first.status).toBe(200);
    expect(second.headers.get('X-Cache')).toBe('HIT');
    expect(await second.json()).toEqual(await first.json());
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('answers 429 with Retry-After once a client exceeds the limit', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ docs: [], numFound: 0 })));
    const { GET } = await import('../../src/app/api/research/route');
    const statuses: number[] = [];
    for (let i = 0; i < 21; i++) statuses.push((await GET(request(`query ${i}`, '198.51.100.1'))).status);
    expect(statuses.slice(0, 20).every(s => s === 200)).toBe(true);
    const limited = await GET(request('one more', '198.51.100.1'));
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get('Retry-After'))).toBeGreaterThan(0);
    // A different client is unaffected
    expect((await GET(request('other client', '198.51.100.2'))).status).toBe(200);
  });

  it('does not cache failures', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { GET } = await import('../../src/app/api/research/route');
    expect((await GET(request('failing'))).status).toBe(502);
    expect((await GET(request('failing'))).status).toBe(502);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
