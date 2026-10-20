import type Database from 'better-sqlite3';

/**
 * A segment of a KJV verse. Plain strings are untagged text; objects carry
 * the Strong's numbers (s), optional Robinson morphology (m) and whether the
 * words were added by the translators, i.e. printed in italics (a).
 */
export type VerseToken = string | { t: string; s?: string[]; m?: string; a?: 1 };

export interface StrongsSummary {
  id: string;
  original: string;
  transliteration: string;
  definition: string;
  language: string;
}

/** The Strong's number a reader most likely means when clicking a token. */
export function primaryStrongs(ids: string[]): string | undefined {
  // Skip the Hebrew object marker and the Greek article when something more specific is present.
  const specific = ids.filter(id => id !== 'H853' && id !== 'G3588');
  return specific.length ? specific[specific.length - 1] : ids[ids.length - 1];
}

/**
 * Reduces a transliteration to plain ASCII so everyday spellings match the
 * lexicon's scholarly ones: "agapao" finds "agapáō", "chesed" finds "chêçêd",
 * "shalom" finds "shâlôwm".
 */
export function plainText(s: string): string {
  return s
    .replace(/ç/gi, 's') // samekh
    .replace(/([ôû])w/gi, '$1') // vav written as a vowel letter
    .normalize('NFKD') // also turns the superscript ᵉ into e
    .replace(/[̀-ͯʼʻʾʿ'’-]/g, '')
    .toLowerCase();
}

const NUMERIC_ORDER = 'language DESC, CAST(SUBSTR(id, 2) AS INTEGER)';

export function searchStrongs(
  db: Database.Database,
  { q = '', language, limit = 100, offset = 0 }: { q?: string; language?: string; limit?: number; offset?: number }
): { total: number; entries: (StrongsSummary & { uses: number })[] } {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (language === 'hebrew' || language === 'greek') {
    where.push('language = ?');
    params.push(language);
  }
  const term = q.trim();
  let order = NUMERIC_ORDER;
  const orderParams: (string | number)[] = [];
  if (term) {
    const id = /^[HG]?\d+$/i.test(term) ? term.toUpperCase() : null;
    const like = `%${plainText(term)}%`;
    where.push(`(${id ? (/^\d/.test(id) ? 'SUBSTR(id, 2) = ? OR ' : 'id = ? OR ') : ''}translit_plain LIKE ? OR original LIKE ? OR LOWER(definition) LIKE ? OR LOWER(kjv_usage) LIKE ?)`);
    if (id) params.push(id);
    params.push(like, `%${term}%`, like, like);

    // Best matches first: the exact number, then the transliteration, then English meanings
    // where the term starts a word ("grace" but not "disgrace"), then the most-used words.
    const plain = plainText(term);
    const words = `' ' || ${['(', ')', '-', ',', ';', '.'].reduce(
      (sql, ch) => `REPLACE(${sql}, '${ch}', ' ')`,
      `LOWER(definition || ' ' || COALESCE(kjv_usage, ''))`
    )}`;
    order = `(id = ? OR SUBSTR(id, 2) = ?) DESC, (translit_plain = ?) DESC,
      (translit_plain LIKE ? OR ${words} LIKE ?) DESC, uses DESC, ${NUMERIC_ORDER}`;
    orderParams.push(term.toUpperCase(), term, plain, `${plain}%`, `% ${term.toLowerCase()}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = (db.prepare(`SELECT COUNT(*) AS c FROM strongs ${whereSql}`).get(...params) as { c: number }).c;
  const entries = db.prepare(`
    SELECT s.id, s.original, s.transliteration, s.definition, s.language,
           (SELECT COUNT(*) FROM word_strongs ws WHERE ws.strongs_id = s.id) AS uses
    FROM strongs s ${whereSql}
    ORDER BY ${order}
    LIMIT ? OFFSET ?
  `).all(...params, ...orderParams, limit, offset) as (StrongsSummary & { uses: number })[];
  return { total, entries };
}

/** Verses containing a Strong's number, one row per verse, with the KJV words it translates. */
export function getOccurrences(db: Database.Database, id: string, { limit = 200, offset = 0 } = {}) {
  const totals = db.prepare(`
    SELECT COUNT(*) AS words, COUNT(DISTINCT book * 1000000 + chapter * 1000 + verse) AS verses
    FROM word_strongs WHERE strongs_id = ?
  `).get(id) as { words: number; verses: number };
  const occurrences = db.prepare(`
    SELECT ws.book, ws.chapter, ws.verse, GROUP_CONCAT(DISTINCT ws.word) AS word, v.text
    FROM word_strongs ws
    LEFT JOIN verses v ON v.book = ws.book AND v.chapter = ws.chapter AND v.verse = ws.verse AND v.translation = 'KJV'
    WHERE ws.strongs_id = ?
    GROUP BY ws.book, ws.chapter, ws.verse
    ORDER BY ws.book, ws.chapter, ws.verse
    LIMIT ? OFFSET ?
  `).all(id, limit, offset) as { book: number; chapter: number; verse: number; word: string; text: string | null }[];
  return { totalWords: totals.words, totalVerses: totals.verses, occurrences };
}

// Small words that the tagged KJV phrases pick up from Hebrew/Greek prefixes, suffixes and
// auxiliaries ("for his mercy", "when they were created"); trimmed from the edges of a rendering.
const EDGE_WORDS = new Set((
  'a an and as at be been behold but by for from had hast hath have he her him his i in is it its me my ' +
  'o of on our shall shalt she so that the thee their them they thou thy thine to unto us was wast we ' +
  'were when which who whom will wilt with ye you your according'
).split(' '));

/** Reduces a tagged KJV phrase to its core rendering: "for his mercy" -> "mercy". */
export function coreRendering(phrase: string): string {
  const words = phrase.toLowerCase().replace(/[^a-z\s-]/g, ' ').split(/\s+/).filter(Boolean);
  let start = 0;
  let end = words.length;
  while (start < end - 1 && EDGE_WORDS.has(words[start])) start++;
  while (end > start + 1 && EDGE_WORDS.has(words[end - 1])) end--;
  return words.slice(start, end).join(' ');
}

/** How a Strong's number is rendered in the KJV, most frequent first. */
export function getKjvRenderings(db: Database.Database, id: string, limit = 15) {
  const rows = db.prepare('SELECT word, COUNT(*) AS count FROM word_strongs WHERE strongs_id = ? GROUP BY word')
    .all(id) as { word: string; count: number }[];
  const totals = new Map<string, number>();
  for (const r of rows) {
    const core = coreRendering(r.word);
    if (core) totals.set(core, (totals.get(core) || 0) + r.count);
  }
  return [...totals]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, limit);
}

/** Tagged KJV tokens for a chapter plus a summary of every Strong's number they use. */
export function getChapterTokens(db: Database.Database, book: number, chapter: number) {
  const rows = db.prepare('SELECT verse, tokens FROM verse_tokens WHERE book = ? AND chapter = ?')
    .all(book, chapter) as { verse: number; tokens: string }[];
  const tokens: Record<number, VerseToken[]> = {};
  for (const r of rows) tokens[r.verse] = JSON.parse(r.tokens);

  const lexicon: Record<string, StrongsSummary> = {};
  const entries = db.prepare(`
    SELECT id, original, transliteration, definition, language FROM strongs
    WHERE id IN (SELECT DISTINCT strongs_id FROM word_strongs WHERE book = ? AND chapter = ?)
  `).all(book, chapter) as StrongsSummary[];
  for (const e of entries) lexicon[e.id] = e;
  return { tokens, lexicon };
}
