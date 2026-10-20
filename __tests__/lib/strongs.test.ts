import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { createTestDb, seedTestDb } from '../helpers/test-db';
import { coreRendering, escapeLike, getChapterTokens, getKjvRenderings, getOccurrences, plainText, primaryStrongs, searchStrongs } from '../../src/lib/strongs';

describe('primaryStrongs', () => {
  it('prefers the content word over the Hebrew object marker or Greek article', () => {
    expect(primaryStrongs(['H853', 'H1254'])).toBe('H1254');
    expect(primaryStrongs(['G3588', 'G2316'])).toBe('G2316');
  });

  it('falls back to the marker when it is the only tag', () => {
    expect(primaryStrongs(['G3588'])).toBe('G3588');
  });
});

describe('coreRendering', () => {
  it('trims prefixes and auxiliaries picked up from the original language', () => {
    expect(coreRendering('for his mercy')).toBe('mercy');
    expect(coreRendering('when they were created')).toBe('created');
    expect(coreRendering('for, behold, I create')).toBe('create');
    expect(coreRendering('according to thy lovingkindness')).toBe('lovingkindness');
  });

  it('keeps the phrase when nothing else is left', () => {
    expect(coreRendering('unto')).toBe('unto');
    expect(coreRendering('the beginning')).toBe('beginning');
  });
});

describe('plainText', () => {
  it('removes accents and breathing marks', () => {
    expect(plainText('agapáō')).toBe('agapao');
    expect(plainText('ʼâb')).toBe('ab');
  });

  it('matches everyday spellings of Hebrew transliterations', () => {
    expect(plainText('chêçêd')).toBe('chesed');
    expect(plainText('shâlôwm')).toBe('shalom');
    expect(plainText('rûwach')).toBe('ruach');
    expect(plainText('Yᵉhôvâh')).toBe('yehovah');
  });
});

describe('Strong\'s queries', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
    seedTestDb(db);
  });

  it('searches by exact number', () => {
    expect(searchStrongs(db, { q: 'g26' }).entries.map(e => e.id)).toEqual(['G26']);
  });

  it('searches by bare number across both languages, exact numbers first', () => {
    db.prepare("INSERT INTO strongs (id, original, transliteration, translit_plain, definition, language) VALUES ('H26', 'x', 'x', 'x', 'x', 'hebrew')").run();
    db.prepare("INSERT INTO strongs (id, original, transliteration, translit_plain, definition, language) VALUES ('H1', 'y', 'y', 'y', 'compare H26', 'hebrew')").run();
    const ids = searchStrongs(db, { q: '26' }).entries.map(e => e.id);
    expect(ids.slice(0, 2).sort()).toEqual(['G26', 'H26']);
    expect(ids).toContain('H1');
  });

  it('searches transliterations without accents and English meanings', () => {
    expect(searchStrongs(db, { q: 'agape' }).entries[0].id).toBe('G26');
    expect(searchStrongs(db, { q: 'charity' }).entries[0].id).toBe('G26');
  });

  it('treats % and _ as literal characters', () => {
    expect(escapeLike('50%_off')).toBe('50\\%\\_off');
    expect(searchStrongs(db, { q: '%' }).total).toBe(0);
    expect(searchStrongs(db, { q: '_' }).total).toBe(0);
  });

  it('filters by language and orders numerically', () => {
    const { total, entries } = searchStrongs(db, { language: 'hebrew' });
    expect(total).toBe(2);
    expect(entries.map(e => e.id)).toEqual(['H430', 'H1254']);
  });

  it('counts uses and paginates', () => {
    const page = searchStrongs(db, { limit: 2, offset: 0 });
    expect(page.total).toBe(5);
    expect(page.entries).toHaveLength(2);
    expect(searchStrongs(db, { q: 'G2316' }).entries[0].uses).toBe(1);
  });

  it('groups occurrences by verse', () => {
    db.prepare("INSERT INTO word_strongs (book, chapter, verse, word, strongs_id, position) VALUES (1, 1, 1, 'Gods', 'H430', 9)").run();
    const result = getOccurrences(db, 'H430');
    expect(result.totalWords).toBe(2);
    expect(result.totalVerses).toBe(1);
    expect(result.occurrences).toHaveLength(1);
    expect(result.occurrences[0].word.split(',').sort()).toEqual(['God', 'Gods']);
  });

  it('lists KJV renderings by frequency', () => {
    expect(getKjvRenderings(db, 'H430')).toEqual([{ word: 'god', count: 1 }]);
  });

  it('returns tagged tokens for a chapter', () => {
    const tokens = getChapterTokens(db, 1, 1);
    expect(tokens[1][1]).toEqual({ t: 'God', s: ['H430'] });
  });
});
