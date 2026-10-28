import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('window', { dispatchEvent: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());

describe('saved reading resilience', () => {
  it('ignores JSON of the wrong shape instead of crashing array-based preferences', async () => {
    vi.stubGlobal('localStorage', { getItem: () => 'null' });
    const { readStoredJson } = await import('@/lib/storage');
    expect(readStoredJson('collections', [])).toEqual([]);
  });
  it('keeps failed writes readable within the session and can recover persistence', async () => {
    let persisted: string | null = null;
    let fail = true;
    vi.stubGlobal('localStorage', { getItem: () => persisted, setItem: (_: string, value: string) => { if (fail) throw new Error('quota'); persisted = value; } });
    const { readStoredJson, writeStoredJson } = await import('@/lib/storage');
    writeStoredJson('notes', ['temporary']);
    expect(readStoredJson('notes', [])).toEqual(['temporary']);
    expect(persisted).toBeNull();
    fail = false;
    writeStoredJson('notes', ['saved']);
    expect(readStoredJson('notes', [])).toEqual(['saved']);
    expect(persisted).toBe('["saved"]');
  });
  it('filters malformed legacy records and preserves legitimate verse zero bookmarks', async () => {
    const bookmark = { id: 'zero', book: 23, chapter: 1, verse: 0, translation: 'LXX-SWETE', note: '', createdAt: '2026-10-28' };
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify([null, 12, { id: 'broken' }, bookmark]) });
    const { getBookmarks } = await import('@/lib/reading');
    expect(getBookmarks()).toEqual([bookmark]);
  });
});

describe('saved-item identifiers', () => {
  it('works without crypto.randomUUID and stays unique with a fixed clock', async () => {
    vi.stubGlobal('crypto', {});
    const clock = vi.spyOn(Date, 'now').mockReturnValue(1);
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    try {
      const { localId } = await import('@/lib/local-id');
      expect(localId()).not.toBe(localId());
    } finally { clock.mockRestore(); random.mockRestore(); }
  });
});
