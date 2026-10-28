// Native-reference library imports. These never reuse KJV word tags or cross-reference identities.
import type Database from 'better-sqlite3';
import { fetchFileSet, fetchSource, fetchZippedSource } from './download';
import { parseUsfx, USFM_CODES, type FlatVerse } from './bibles';
import swete from './library-swete.json';
import { normalizeSearchText } from '../src/lib/search';
import { LIBRARY_BOOKS } from '../src/lib/text-library';
import { BIBLE_BOOKS } from '../src/lib/bible-books';

export const LIBRARY_VERSION_IDS = ['LXX-SWETE', 'HEB-SG', 'WEB-DC', 'DID-HB', 'ENO-CHARLES'];
export const LIBRARY_SOURCES = {
  swete: { name: 'lxx-swete', urls: swete.files.map(f => `https://raw.githubusercontent.com/nathans/lxx-swete/${swete.revision}/data/${f.name}`), sha256: swete.sha256 },
  hebrew: { url: 'https://ebible.org/Scriptures/hebsg_usfx.zip', sha256: 'f93d5f56e1d3b90d9e1d8c48de910c651ccee0afff62c73d90fe62f0c8d71571' },
  web: { url: 'https://ebible.org/Scriptures/eng-web_usfx.zip', sha256: 'd4166234bcdf74f32b41aa99a57fa14fccb6b415c0f28444faedd23eda5f64ae' },
  didache: { url: 'https://www.gutenberg.org/ebooks/42053.html.images', sha256: 'd8c7ebd67e8e78f3fcb0495e9a4a23e9c2e05db9bf4d8d5fb2f55bd269598c40' },
  enoch: { url: 'https://www.gutenberg.org/ebooks/77935.html.images', sha256: 'f01b4e78d3d05843fbc484ea76590c7349f4ca62fdc1432504f9a6424294fc37' },
};
export interface LibraryVerse extends FlatVerse { label?: string; chapterLabel?: string; position?: number }
const clean = (s: string) => s.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/\s+/g, ' ').trim();
const removePage = (s: string) => s.replace(/<span\b[^>]*class="(?:pageno|pgnum)"[^>]*>[\s\S]*?<\/span>/g, '').replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/g, '');

export function parseSwete(text: string, work: number): LibraryVerse[] {
  const passages = new Map<string, string[]>();
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const match = /^(\d+)\.([^.]+)\.([^\s]+)\s+(.+)$/.exec(line);
    if (!match) throw new Error(`Unrecognized Swete line: ${line}`);
    const key = `${match[2]}.${match[3]}`;
    const words = passages.get(key) ?? [];
    words.push(match[4]); passages.set(key, words);
  }
  const chapterPositions = new Map<number, number>();
  return [...passages].map(([ref, words]) => {
    const [ch, label] = ref.split('.');
    // Non-numeric source chapters stay visibly labelled; stable internal routes use 0 and 15.
    const chapter = ch === 'prologue' ? 0 : ch === 'iva' ? 15 : ch === 'ivb' ? 16 : Number(ch);
    if (!Number.isInteger(chapter)) throw new Error(`Unknown Swete chapter ${ch}`);
    const position = (chapterPositions.get(chapter) ?? 0) + 1;
    chapterPositions.set(chapter, position);
    // Source order is preserved separately. Suffixes get distinct stable internal anchors.
    const verse = /^\d+$/.test(label) ? Number(label) : 100000 + position;
    return { book: work === 19 && chapter === 151 ? 77 : work, chapter: work === 19 && chapter === 151 ? 1 : chapter, verse, text: words.join(' '), label, chapterLabel: work === 19 && chapter === 151 ? '1' : ch, position };
  });
}

/** Preserve combined verse labels such as Sirach 26:19–27, rather than labelling them verse 19. */
export interface SourceNote { book: number; chapter: number; label: string; text: string }
export function parseLibraryUsfx(xml: string, mapping: Record<string, number>, notes: SourceNote[] = []): LibraryVerse[] {
  const result: LibraryVerse[] = [];
  for (const [code, book] of Object.entries(mapping)) {
    const body = new RegExp(`<book id="${code}">([\\s\\S]*?)<\\/book>`).exec(xml)?.[1];
    if (!body) throw new Error(`Missing USFX book ${code}`);
    const labels = new Map<string, string>();
    for (const [, chapter, text] of body.matchAll(/<c id="(\d+)"[^>]*\/>([\s\S]*?)(?=<c id=|$)/g)) {
      for (const [, label] of text.matchAll(/<v id="([^" ]+)"/g)) labels.set(`${chapter}.${Number.parseInt(label)}`, label);
    }
    const cleanBody = body.replace(/<vp\b[^>]*>[\s\S]*?<\/vp>/g, '');
    const rows = parseUsfx(`<book id="GEN">${cleanBody}</book>`).map(v => ({ ...v, book, label: labels.get(`${v.chapter}.${v.verse}`) ?? String(v.verse) }));
    result.push(...rows);
    const present = new Set(rows.map(v => `${v.chapter}.${v.verse}`));
    for (const [, chapter, text] of body.matchAll(/<c id="(\d+)"[^>]*\/>([\s\S]*?)(?=<c id=|$)/g)) {
      for (const [, label, textWithNote] of text.matchAll(/<v id="([^" ]+)"[^>]*\/>([\s\S]*?)<ve\s*\/>/g)) {
        if (present.has(`${chapter}.${Number.parseInt(label)}`)) continue;
        const note = /<f\b[^>]*>([\s\S]*?)<\/f>/.exec(textWithNote)?.[1];
        if (note) notes.push({ book, chapter: Number(chapter), label, text: clean(note.replace(/<fr>[\s\S]*?<\/fr>/g, '')) });
      }
    }
  }
  return result;
}

export function parseDidache(html: string): LibraryVerse[] {
  const result: LibraryVerse[] = [];
  for (let chapter = 1; chapter <= 16; chapter++) {
    const start = html.indexOf(`<a id="chp${chapter}Eng"></a>`);
    const end = chapter < 16 ? html.indexOf(`<a id="chp${chapter + 1}Eng"></a>`, start) : html.indexOf('</td>', start);
    if (start < 0 || end < 0) throw new Error(`Missing Didache chapter ${chapter}`);
    const body = html.slice(start, end);
    // Only the paragraph introduced by the chapter link is the translated text, not the title.
    const paragraphs = [...body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(m => m[1]);
    const first = paragraphs.findIndex(p => p.includes(`href="#chp${chapter}Gr"`));
    if (first < 0) throw new Error(`Missing Didache text ${chapter}`);
    const text = clean(removePage(paragraphs.slice(first).join(' ')).replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, '').replace(/-\s*<br\s*\/?\s*>\s*/g, '').replace(/^\s*—/, ''));
    result.push({ book: 93, chapter, verse: 1, text, label: 'section' });
  }
  return result;
}

function roman(s: string): number {
  const values: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };
  return [...s].reduce((n, c, i) => n + (values[c] < (values[s[i + 1]] ?? 0) ? -values[c] : values[c]), 0);
}
export function parseEnoch(html: string): LibraryVerse[] {
  const start = html.indexOf('<abbr title="one">I.</abbr> 1. The words of the blessing');
  const end = html.indexOf('<span class="sc">Printed in Great Britain', start);
  if (start < 0 || end < 0) throw new Error('Unrecognized Enoch edition');
  // Keep the historical edition's inline numbering and alternate readings together.
  // Its tables and editorial transpositions cannot safely be treated as a simple verse list.
  const body = removePage(html.slice(start, end).replace(/<sup\b[^>]*>([a-z][a-z0-9]*)<\/sup>/g, '$1'))
    .replace(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/g, (_, heading: string) => {
      const marker = /^<abbr[^>]*>([IVXLC]+)\.<\/abbr>/.exec(heading.trim());
      return marker ? ` CHAPTER_${roman(marker[1])} ` : ' ';
    })
    .replace(/<abbr\b[^>]*>([IVXLC]+)\.<\/abbr>/g, (_, r: string) => ` CHAPTER_${roman(r)} `);
  const plain = clean(body.replace(/<\/p>/g, ' __PARA__ ')).replace(/ ?__PARA__ ?/g, '\n\n');
  const chapters = new Map<number, string[]>();
  for (const [, ch, text] of plain.matchAll(/CHAPTER_(\d+)\s*([\s\S]*?)(?=CHAPTER_|$)/g)) {
    if (!text.trim()) continue;
    const key = Number(ch);
    const chunks = chapters.get(key) ?? [];
    chunks.push(text.trim()); chapters.set(key, chunks);
  }
  return [...chapters].map(([chapter, chunks]) => ({ book: 94, chapter, verse: 1, label: 'section', text: chunks.join(' ') }));
}

export function validateLibrary(verses: LibraryVerse[], version: string) {
  const known = new Set([...BIBLE_BOOKS, ...LIBRARY_BOOKS].map(b => b.id));
  const seen = new Set<string>();
  for (const v of verses) {
    const key = `${v.book}.${v.chapter}.${v.verse}`;
    if (seen.has(key)) throw new Error(`${version}: duplicate passage ${key}`);
    seen.add(key);
    if (!known.has(v.book) || !Number.isInteger(v.chapter) || v.chapter < 0 || !Number.isInteger(v.verse) || v.verse < 0 || !v.text.trim()) throw new Error(`${version}: invalid passage ${key}`);
  }
  if (!verses.length) throw new Error(`Empty edition ${version}`);
}

export async function importLibrary(db: Database.Database) {
  const columns = db.prepare('PRAGMA table_info(verses)').all() as { name: string }[];
  for (const column of ['native_label TEXT', 'position INTEGER']) {
    if (!columns.some(c => c.name === column.split(' ')[0])) db.exec(`ALTER TABLE verses ADD COLUMN ${column}`);
  }
  db.exec(`CREATE TABLE IF NOT EXISTS edition_chapters (translation TEXT NOT NULL, book INTEGER NOT NULL, chapter INTEGER NOT NULL, label TEXT NOT NULL, position INTEGER NOT NULL, PRIMARY KEY (translation, book, chapter));
    CREATE TABLE IF NOT EXISTS library_imports (translation TEXT PRIMARY KEY, source TEXT NOT NULL, sha256 TEXT NOT NULL, imported_at TEXT NOT NULL, passages INTEGER NOT NULL);
    CREATE VIRTUAL TABLE IF NOT EXISTS library_fts USING fts5(text);
    CREATE TABLE IF NOT EXISTS edition_notes (translation TEXT NOT NULL, book INTEGER NOT NULL, chapter INTEGER NOT NULL, label TEXT NOT NULL, text TEXT NOT NULL, PRIMARY KEY (translation, book, chapter, label));`);
  const sourceNotes: SourceNote[] = [];
  const datasets: { id: string; verses: LibraryVerse[]; source: string; hash: string }[] = [];
  const greek = await fetchFileSet(LIBRARY_SOURCES.swete);
  datasets.push({ id: 'LXX-SWETE', verses: greek.flatMap((t, i) => parseSwete(t, swete.files[i].work)), source: `https://github.com/nathans/lxx-swete/tree/${swete.revision}`, hash: swete.sha256 });
  const hebrewXml = await fetchZippedSource(LIBRARY_SOURCES.hebrew, /usfx\.xml$/);
  const hebrew = parseLibraryUsfx(hebrewXml, Object.fromEntries(USFM_CODES.slice(39).map((code, i) => [code, i + 40])));
  if (new Set(hebrew.map(v => v.book)).size !== 27) throw new Error('Hebrew NT must contain 27 books');
  datasets.push({ id: 'HEB-SG', verses: hebrew, source: LIBRARY_SOURCES.hebrew.url, hash: LIBRARY_SOURCES.hebrew.sha256 });
  const webXml = await fetchZippedSource(LIBRARY_SOURCES.web, /usfx\.xml$/);
  const webMap: Record<string, number> = { TOB:67, JDT:68, BAR:69, ESG:70, WIS:71, SIR:72, '1MA':73, '2MA':74, '1ES':75, MAN:76, PS2:77, '3MA':78, '2ES':79, '4MA':80, DAG:88 };
  const extras = parseLibraryUsfx(webXml, webMap, sourceNotes);
  datasets.push({ id: 'WEB-DC', verses: extras, source: LIBRARY_SOURCES.web.url, hash: LIBRARY_SOURCES.web.sha256 });
  for (const [id, key, parser] of [['DID-HB', 'didache', parseDidache], ['ENO-CHARLES', 'enoch', parseEnoch]] as const) {
    const src = LIBRARY_SOURCES[key];
    const verses = parser(await fetchSource(src));
    const expected = id === 'DID-HB' ? 16 : 108;
    if (new Set(verses.map(v => v.chapter)).size !== expected) throw new Error(`${id}: expected ${expected} chapters`);
    datasets.push({ id, verses, source: src.url, hash: src.sha256 });
  }
  const expectedCounts: Record<string, [number, number, number]> = { 'LXX-SWETE': [29308, 56, 1138], 'HEB-SG': [7957, 27, 260], 'WEB-DC': [6931, 15, 213], 'DID-HB': [16, 1, 16], 'ENO-CHARLES': [108, 1, 108] };
  for (const { id, verses } of datasets) {
    validateLibrary(verses, id);
    const actual = [verses.length, new Set(verses.map(v => v.book)).size, new Set(verses.map(v => `${v.book}.${v.chapter}`)).size];
    if (actual.some((n, i) => n !== expectedCounts[id][i])) throw new Error(`${id}: source inventory mismatch (${actual.join('/')})`);
  }
  const chapterColumns = db.prepare('PRAGMA table_info(edition_chapters)').all() as { name: string }[];
  if (!chapterColumns.some(c => c.name === 'last_verse')) db.exec('ALTER TABLE edition_chapters ADD COLUMN last_verse INTEGER NOT NULL DEFAULT 0');
  if (!chapterColumns.some(c => c.name === 'missing_verses')) db.exec("ALTER TABLE edition_chapters ADD COLUMN missing_verses TEXT NOT NULL DEFAULT '[]'");
  const insert = db.prepare('INSERT INTO verses(book, chapter, verse, text, translation, native_label, position) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const chapterInsert = db.prepare('INSERT OR IGNORE INTO edition_chapters (translation, book, chapter, label, position) VALUES (?, ?, ?, ?, ?)');
  db.transaction(() => {
    for (const { id, verses, source, hash } of datasets) {
      validateLibrary(verses, id);
      db.prepare('DELETE FROM verses WHERE translation = ?').run(id);
      db.prepare('DELETE FROM edition_chapters WHERE translation = ?').run(id);
      const positions = new Map<number, number>();
      for (const v of verses) {
        const position = (positions.get(v.book) ?? 0) + 1;
        positions.set(v.book, position);
        insert.run(v.book, v.chapter, v.verse, v.text, id, v.label ?? String(v.verse), v.position ?? position);
        chapterInsert.run(id, v.book, v.chapter, v.chapterLabel ?? String(v.chapter), position);
      }
      db.prepare('INSERT OR REPLACE INTO library_imports VALUES (?, ?, ?, ?, ?)').run(id, source, hash, new Date().toISOString(), verses.length);
      console.log(`  ${id}: ${verses.length} passages, ${positions.size} works`);
    }
    db.prepare('DELETE FROM edition_notes WHERE translation = ?').run('WEB-DC');
    const insertNote = db.prepare('INSERT INTO edition_notes VALUES (?, ?, ?, ?, ?)');
    for (const n of sourceNotes) insertNote.run('WEB-DC', n.book, n.chapter, n.label, n.text);
    // Materialize all chapter coverage once during import, rather than grouping the entire
    // corpus and sending verbose coverage records on every visit to the book browser.
    db.exec(`INSERT OR IGNORE INTO edition_chapters (translation, book, chapter, label, position)
      SELECT translation, book, chapter, CAST(chapter AS TEXT), chapter FROM verses GROUP BY translation, book, chapter ORDER BY translation, book, chapter;
      UPDATE edition_chapters SET last_verse = (SELECT MAX(verse) FROM verses v WHERE v.translation = edition_chapters.translation AND v.book = edition_chapters.book AND v.chapter = edition_chapters.chapter);`);
    // Bounds alone are insufficient for editions that omit individual verse numbers.
    const gaps = db.prepare(`SELECT translation, book, chapter, GROUP_CONCAT(verse) AS numbers FROM verses WHERE translation NOT IN (${LIBRARY_VERSION_IDS.map(() => '?').join(',')}) GROUP BY translation, book, chapter`).all(...LIBRARY_VERSION_IDS) as { translation: string; book: number; chapter: number; numbers: string }[];
    const saveGaps = db.prepare('UPDATE edition_chapters SET missing_verses = ? WHERE translation = ? AND book = ? AND chapter = ?');
    for (const row of gaps) {
      const present = new Set(row.numbers.split(',').map(Number));
      const last = Math.max(...present);
      const missing = Array.from({ length: last }, (_, i) => i + 1).filter(n => !present.has(n));
      saveGaps.run(JSON.stringify(missing), row.translation, row.book, row.chapter);
    }
    // Search the imported editions with explicit Unicode normalization; display text is untouched.
    db.exec('DELETE FROM library_fts');
    const addSearch = db.prepare('INSERT INTO library_fts(rowid, text) VALUES (?, ?)');
    const rows = db.prepare(`SELECT id, text FROM verses WHERE translation IN (${LIBRARY_VERSION_IDS.map(() => '?').join(',')})`).all(...LIBRARY_VERSION_IDS) as { id: number; text: string }[];
    for (const r of rows) addSearch.run(r.id, normalizeSearchText(r.text));
  })();
}
