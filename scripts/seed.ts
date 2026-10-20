import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { parseLexicon, parseKjvOsis, tokensToText, TaggedVerse } from './kjv-strongs';
import { SOURCES, TRANSLATION_SOURCES, type TranslationSource } from './sources';
import { fetchChapters, fetchFileSet, fetchSource, fetchZippedSource } from './download';
import {
  BOOK_MAP, parseChapterBundle, parseScrollmapper, parseTahot, parseUsfm, parseUsfx, parseVersificationMappings, parseZefania, toEnglishVersification,
  type FlatVerse,
} from './bibles';
import { plainText } from '../src/lib/strongs';
import { BIBLE_BOOKS } from '../src/lib/bible-books';
import { TRANSLATION_IDS } from '../src/lib/translations';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'bible.db');
const BUILD_PATH = `${DB_PATH}.building`;

let hebrewMappings: ReturnType<typeof parseVersificationMappings> | null = null;

async function loadTranslation(t: TranslationSource): Promise<FlatVerse[]> {
  if (t.format === 'tahot') return (await Promise.all(t.sources.map(fetchSource))).flatMap(parseTahot);
  if (t.format === 'chapters') return parseChapterBundle(await fetchChapters(t.source, BIBLE_BOOKS));
  if (t.format === 'usfm-books') return (await fetchFileSet(t.source)).flatMap(parseUsfm);
  if (t.format === 'zipped-usfx') return parseUsfx(await fetchZippedSource(t.source, /usfx\.xml$/));
  const text = await fetchSource(t.source);
  const verses = t.format === 'zefania' ? parseZefania(text) : t.format === 'usfx' ? parseUsfx(text) : parseScrollmapper(text);
  if (!t.hebrewVerses) return verses;
  hebrewMappings ??= parseVersificationMappings(await fetchSource(SOURCES.englishVersification));
  return toEnglishVersification(verses, hebrewMappings);
}

async function main() {
  console.log('🔧 Bible Logos Database Seeder');
  console.log('==============================\n');
  const startTime = Date.now();

  console.log(`📂 Data directory: ${DATA_DIR}`);
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  // Build into a temporary file; the live database is only replaced once the new one is complete.
  for (const f of [BUILD_PATH, `${BUILD_PATH}-wal`, `${BUILD_PATH}-shm`]) if (fs.existsSync(f)) fs.unlinkSync(f);
  const db = new Database(BUILD_PATH);
  db.pragma('journal_mode = WAL');

  // ── Schema ──────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS verses (
      id INTEGER PRIMARY KEY,
      book INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text TEXT NOT NULL,
      translation TEXT NOT NULL DEFAULT 'KJV'
    );
    CREATE INDEX idx_verses_ref ON verses(book, chapter, verse, translation);
    CREATE INDEX idx_verses_translation ON verses(translation);

    CREATE TABLE IF NOT EXISTS cross_references (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_book INTEGER NOT NULL,
      from_chapter INTEGER NOT NULL,
      from_verse_start INTEGER NOT NULL,
      from_verse_end INTEGER NOT NULL,
      to_book INTEGER NOT NULL,
      to_chapter INTEGER NOT NULL,
      to_verse_start INTEGER NOT NULL,
      to_verse_end INTEGER NOT NULL,
      votes INTEGER DEFAULT 0,
      category TEXT DEFAULT 'thematic'
    );
    CREATE INDEX idx_crossref_from ON cross_references(from_book, from_chapter, from_verse_start);
    CREATE INDEX idx_crossref_to ON cross_references(to_book, to_chapter, to_verse_start);

    CREATE TABLE IF NOT EXISTS strongs (
      id TEXT PRIMARY KEY,
      original TEXT NOT NULL,
      transliteration TEXT NOT NULL,
      translit_plain TEXT NOT NULL,
      pronunciation TEXT,
      definition TEXT NOT NULL,
      kjv_usage TEXT,
      derivation TEXT,
      language TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS word_strongs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      word TEXT NOT NULL,
      strongs_id TEXT NOT NULL,
      position INTEGER NOT NULL
    );
    CREATE INDEX idx_word_strongs_ref ON word_strongs(book, chapter, verse);
    CREATE INDEX idx_word_strongs_id ON word_strongs(strongs_id);

    -- KJV verses as Strong's-tagged segments (JSON array of VerseToken)
    CREATE TABLE IF NOT EXISTS verse_tokens (
      book INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      tokens TEXT NOT NULL,
      PRIMARY KEY (book, chapter, verse)
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS verses_fts USING fts5(text, content=verses, content_rowid=id);
  `);

  // ── Load Bible Translations ─────────────────────────────────
  const insertVerse = db.prepare('INSERT INTO verses (id, book, chapter, verse, text, translation) VALUES (?, ?, ?, ?, ?, ?)');

  // Ids keep each translation in its own block: translation index × 10^8 + book × 10^6 + chapter × 10^3 + verse
  const insertBible = db.transaction((verses: FlatVerse[], translation: string) => {
    const offset = TRANSLATION_IDS.indexOf(translation) * 100000000;
    for (const v of verses) {
      insertVerse.run(offset + v.book * 1000000 + v.chapter * 1000 + v.verse, v.book, v.chapter, v.verse, v.text, translation);
    }
  });

  // The KJV comes from CrossWire's Strong's-tagged edition so the reader's text and tags always agree.
  console.log("Loading Strong's-tagged KJV (CrossWire)...");
  const taggedKjv: TaggedVerse[] = parseKjvOsis(await fetchSource(SOURCES.kjvOsis));
  insertBible(taggedKjv.map(v => ({ book: v.book, chapter: v.chapter, verse: v.verse, text: tokensToText(v.tokens) })), 'KJV');
  console.log(`  KJV: ${taggedKjv.length} verses`);

  for (const id of TRANSLATION_IDS.filter(id => id !== 'KJV')) {
    console.log(`Loading ${id}...`);
    const source = TRANSLATION_SOURCES[id];
    let verses: FlatVerse[];
    try {
      verses = await loadTranslation(source);
    } catch (error) {
      if (!('optional' in source)) throw error;
      console.warn(`  ⚠️  Skipping ${id}: ${error instanceof Error ? error.message : error}`);
      continue;
    }
    insertBible(verses, id);
    console.log(`  ${id}: ${verses.length} verses`);
  }

  // Build FTS index
  console.log('Building full-text search index...');
  db.exec(`INSERT INTO verses_fts(rowid, text) SELECT id, text FROM verses`);

  // ── Cross-references ────────────────────────────────────────
  console.log('Loading cross-references...');
  const insertXref = db.prepare(`INSERT INTO cross_references
    (from_book, from_chapter, from_verse_start, from_verse_end, to_book, to_chapter, to_verse_start, to_verse_end, votes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  let xrefTotal = 0;
  const parseXrefSql = (sql: string): number => {
    let count = 0;
    const regex = /VALUES\s*\('([^']+)',\s*(\d+),\s*(\d+),\s*'([^']+)',\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)/gi;
    let match;
    while ((match = regex.exec(sql)) !== null) {
      const fb = BOOK_MAP[match[1]], tb = BOOK_MAP[match[4]];
      if (fb && tb) {
        insertXref.run(fb, parseInt(match[2]), parseInt(match[3]), parseInt(match[3]),
          tb, parseInt(match[5]), parseInt(match[6]), parseInt(match[7]) || parseInt(match[6]), parseInt(match[8]) || 0);
        count++;
      }
    }
    return count;
  };
  const batchInsert = db.transaction((sql: string) => parseXrefSql(sql));

  for (const [i, src] of SOURCES.crossReferences.entries()) {
    const c = batchInsert(await fetchSource(src));
    xrefTotal += c;
    console.log(`  Loaded ${c} cross-references from file ${i}. Total: ${xrefTotal}`);
  }

  // ── Strong's Concordance ────────────────────────────────────
  console.log("Seeding Strong's lexicon (Open Scriptures)...");
  const insertStrong = db.prepare(`INSERT OR REPLACE INTO strongs
    (id, original, transliteration, translit_plain, pronunciation, definition, kjv_usage, derivation, language)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const [src, language] of [[SOURCES.strongsHebrew, 'hebrew'], [SOURCES.strongsGreek, 'greek']] as const) {
    const entries = parseLexicon(await fetchSource(src), language);
    db.transaction(() => {
      for (const e of entries) {
        insertStrong.run(e.id, e.original, e.transliteration, plainText(e.transliteration), e.pronunciation, e.definition, e.kjv_usage, e.derivation, e.language);
      }
    })();
    console.log(`  ${language}: ${entries.length} entries`);
  }

  console.log("Linking KJV words to Strong's numbers...");
  const insertWordStrong = db.prepare('INSERT INTO word_strongs (book, chapter, verse, word, strongs_id, position) VALUES (?, ?, ?, ?, ?, ?)');
  const insertTokens = db.prepare('INSERT INTO verse_tokens (book, chapter, verse, tokens) VALUES (?, ?, ?, ?)');
  let wordLinks = 0;
  db.transaction(() => {
    for (const v of taggedKjv) {
      insertTokens.run(v.book, v.chapter, v.verse, JSON.stringify(v.tokens));
      v.tokens.forEach((token, position) => {
        if (typeof token === 'string' || !token.s) return;
        for (const id of token.s) {
          insertWordStrong.run(v.book, v.chapter, v.verse, token.t, id, position);
          wordLinks++;
        }
      });
    }
  })();
  console.log(`  ${wordLinks} word links across ${taggedKjv.length} verses.`);

  // A finished database is only read: a plain journal mode lets it work on read-only disks.
  db.pragma('journal_mode = DELETE');
  db.close();
  // Side files from an older database must not be paired with the new one
  for (const f of [`${DB_PATH}-wal`, `${DB_PATH}-shm`]) if (fs.existsSync(f)) fs.unlinkSync(f);
  fs.renameSync(BUILD_PATH, DB_PATH);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Database seeded successfully in ${elapsed}s!`);

  const statsDb = new Database(DB_PATH, { readonly: true });
  const verseCount = statsDb.prepare('SELECT COUNT(*) as c FROM verses').get() as { c: number };
  const xrefCount = statsDb.prepare('SELECT COUNT(*) as c FROM cross_references').get() as { c: number };
  const translationStats = statsDb.prepare('SELECT translation, COUNT(*) as c FROM verses GROUP BY translation').all();
  console.log(`Total verses: ${verseCount.c}`);
  console.log(`Cross-references: ${xrefCount.c}`);
  console.log('Translations:', translationStats);
  statsDb.close();
}

main().catch((error) => {
  console.error('\n❌ Seeding failed:', error?.message || error);
  console.error('   The existing database (if any) was left unchanged. Try again — downloads may have timed out.');
  for (const f of [BUILD_PATH, `${BUILD_PATH}-wal`, `${BUILD_PATH}-shm`]) {
    try { fs.unlinkSync(f); } catch { /* not created */ }
  }
  process.exit(1);
});
