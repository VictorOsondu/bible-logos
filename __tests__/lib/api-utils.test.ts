import { describe, it, expect } from 'vitest';
import { handleApiError, getCached, peekCached, setCached, upstreamError, fetchExternal, EXTERNAL_TIMEOUT_MS } from '@/lib/api-utils';
import { vi } from 'vitest';
import { DatabaseNotAvailableError } from '@/lib/db';

describe('handleApiError', () => {
  it('returns 503 for DatabaseNotAvailableError', () => {
    const error = new DatabaseNotAvailableError('DB missing');
    const response = handleApiError(error);
    expect(response.status).toBe(503);
  });

  it('returns 500 for generic errors', () => {
    const response = handleApiError(new Error('something broke'));
    expect(response.status).toBe(500);
  });

  it('does not reveal internal error details', async () => {
    const response = handleApiError(new Error('SQLITE_ERROR: no such column: secret_col'));
    expect(await response.json()).toEqual({ error: 'Internal server error' });
  });

  it('returns 500 for non-Error values', () => {
    const response = handleApiError('string error');
    expect(response.status).toBe(500);
  });
});

describe('getCached', () => {
  it('caches results within TTL', () => {
    let callCount = 0;
    const fn = () => { callCount++; return 'result'; };
    
    const r1 = getCached('test-key-1', 10000, fn);
    const r2 = getCached('test-key-1', 10000, fn);
    
    expect(r1).toBe('result');
    expect(r2).toBe('result');
    expect(callCount).toBe(1);
  });

  it('uses different cache entries for different keys', () => {
    let callCount = 0;
    const fn = () => { callCount++; return callCount; };
    
    const r1 = getCached('key-a', 10000, fn);
    const r2 = getCached('key-b', 10000, fn);
    
    expect(r1).toBe(1);
    expect(r2).toBe(2);
  });
});

describe('upstreamError', () => {
  it('reports timeouts as 504 and other failures as 502, without details', async () => {
    const timeout = Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' });
    const slow = upstreamError('PubMed', timeout);
    expect(slow.status).toBe(504);
    expect(await slow.json()).toEqual({ error: 'PubMed did not respond in time' });

    const down = upstreamError('PubMed', new Error('getaddrinfo ENOTFOUND internal-host'));
    expect(down.status).toBe(502);
    expect(JSON.stringify(await down.json())).not.toContain('ENOTFOUND');
  });
});

describe('fetchExternal', () => {
  it('always passes a timeout signal', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
    await fetchExternal('https://example.org', { headers: { Accept: 'application/json' } });
    const init = spy.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect((init.headers as Record<string, string>).Accept).toBe('application/json');
    expect(EXTERNAL_TIMEOUT_MS).toBeLessThanOrEqual(10000);
    spy.mockRestore();
  });
});

describe('cache size cap', () => {
  it('evicts the oldest entries beyond the cap', () => {
    for (let i = 0; i < 600; i++) setCached(`cap-${i}`, i, 60000);
    expect(peekCached('cap-0')).toBeUndefined();
    expect(peekCached('cap-599')).toBe(599);
  });

  it('expires entries after their time limit', () => {
    setCached('short', 1, -1);
    expect(peekCached('short')).toBeUndefined();
  });
});
