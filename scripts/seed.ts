import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { parseLexicon, parseKjvOsis, tokensToText, TaggedVerse } from './kjv-strongs';
import { SOURCES, type Source } from './sources';
import { plainText } from '../src/lib/strongs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'bible.db');
const BUILD_PATH = `${DB_PATH}.building`;
// Verified downloads are kept here so re-seeding (and CI) does not fetch them again
const CACHE_DIR = path.join(DATA_DIR, 'sources');

const BOOK_MAP: Record<string, number> = {
  'Genesis':1,'Exodus':2,'Leviticus':3,'Numbers':4,'Deuteronomy':5,
  'Joshua':6,'Judges':7,'Ruth':8,
  '1 Samuel':9,'I Samuel':9,'2 Samuel':10,'II Samuel':10,
  '1 Kings':11,'I Kings':11,'2 Kings':12,'II Kings':12,
  '1 Chronicles':13,'I Chronicles':13,'2 Chronicles':14,'II Chronicles':14,
  'Ezra':15,'Nehemiah':16,'Esther':17,'Job':18,'Psalms':19,'Psalm':19,
  'Proverbs':20,'Ecclesiastes':21,'Song of Solomon':22,'Song of Songs':22,
  'Isaiah':23,'Jeremiah':24,'Lamentations':25,'Ezekiel':26,'Daniel':27,
  'Hosea':28,'Joel':29,'Amos':30,'Obadiah':31,'Jonah':32,'Micah':33,
  'Nahum':34,'Habakkuk':35,'Zephaniah':36,'Haggai':37,'Zechariah':38,'Malachi':39,
  'Matthew':40,'Mark':41,'Luke':42,'John':43,'Acts':44,'Romans':45,
  '1 Corinthians':46,'I Corinthians':46,'2 Corinthians':47,'II Corinthians':47,
  'Galatians':48,'Ephesians':49,'Philippians':50,'Colossians':51,
  '1 Thessalonians':52,'I Thessalonians':52,'2 Thessalonians':53,'II Thessalonians':53,
  '1 Timothy':54,'I Timothy':54,'2 Timothy':55,'II Timothy':55,
  'Titus':56,'Philemon':57,'Hebrews':58,'James':59,
  '1 Peter':60,'I Peter':60,'2 Peter':61,'II Peter':61,
  '1 John':62,'I John':62,'2 John':63,'II John':63,'3 John':64,'III John':64,
  'Jude':65,'Revelation':66,'Revelation of John':66
};

interface ScrollmapperBible {
  translation: string;
  books: { name: string; chapters: { chapter: number; verses: { verse: number; text: string }[] }[] }[];
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const sha256 = (data: Buffer) => crypto.createHash('sha256').update(data).digest('hex');

/** Returns a pinned source's contents, from the local cache or downloaded, after checking its hash. */
async function fetchSource({ url, sha256: expected }: Source, maxRetries = 3): Promise<string> {
  const cached = path.join(CACHE_DIR, `${expected.slice(0, 16)}-${path.basename(new URL(url).pathname)}`);
  if (fs.existsSync(cached)) {
    const data = fs.readFileSync(cached);
    if (sha256(data) === expected) return data.toString('utf8').replace(/^\uFEFF/, '');
    console.warn(`  Cached ${path.basename(cached)} is corrupt; downloading again.`);
  }

  for (let attempt = 1; ; attempt++) {
    try {
      console.log(`  Downloading ${url}${attempt > 1 ? ` (attempt ${attempt}/${maxRetries})` : ''}...`);
      const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = Buffer.from(await res.arrayBuffer());
      const actual = sha256(data);
      if (actual !== expected) {
        throw new Error(`checksum mismatch for ${url}: expected ${expected}, got ${actual}`);
      }
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(cached, data);
      return data.toString('utf8').replace(/^\uFEFF/, '');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt >= maxRetries || message.startsWith('checksum mismatch')) throw error;
      const delay = attempt * 2000;
      console.warn(`  Attempt ${attempt} failed (${message}), retrying in ${delay / 1000}s...`);
      await sleep(delay);
    }
  }
}

function flattenBible(bible: ScrollmapperBible): { book: number; chapter: number; verse: number; text: string }[] {
  const result: { book: number; chapter: number; verse: number; text: string }[] = [];
  for (const bookData of bible.books) {
    const bookId = BOOK_MAP[bookData.name];
    if (!bookId) { console.log(`  Unknown book: ${bookData.name}, skipping`); continue; }
    for (const ch of bookData.chapters) {
      for (const v of ch.verses) {
        result.push({ book: bookId, chapter: ch.chapter, verse: v.verse, text: v.text });
      }
    }
  }
  return result;
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

  const insertBible = db.transaction((verses: { book: number; chapter: number; verse: number; text: string }[], translation: string, idOffset: number) => {
    for (const v of verses) {
      const id = idOffset + v.book * 1000000 + v.chapter * 1000 + v.verse;
      insertVerse.run(id, v.book, v.chapter, v.verse, v.text, translation);
    }
  });

  const translations: { source: Source; name: string; offset: number }[] = [
    { source: SOURCES.asv, name: 'ASV', offset: 100000000 },
    { source: SOURCES.bbe, name: 'BBE', offset: 200000000 },
    { source: SOURCES.ylt, name: 'YLT', offset: 300000000 },
    { source: SOURCES.vulgate, name: 'VUL', offset: 400000000 },
  ];

  // The KJV comes from CrossWire's Strong's-tagged edition so the reader's text and tags always agree.
  console.log("Loading Strong's-tagged KJV (CrossWire)...");
  const taggedKjv: TaggedVerse[] = parseKjvOsis(await fetchSource(SOURCES.kjvOsis));
  insertBible(taggedKjv.map(v => ({ book: v.book, chapter: v.chapter, verse: v.verse, text: tokensToText(v.tokens) })), 'KJV', 0);
  console.log(`  KJV: ${taggedKjv.length} verses`);

  for (const t of translations) {
    console.log(`Loading ${t.name}...`);
    const flat = flattenBible(JSON.parse(await fetchSource(t.source)) as ScrollmapperBible);
    insertBible(flat, t.name, t.offset);
    console.log(`  ${t.name}: ${flat.length} verses`);
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
