import Database from 'better-sqlite3';

export function createTestDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');

  // Create schema
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
      translit_plain TEXT NOT NULL DEFAULT '',
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
      position INTEGER DEFAULT 0
    );
    CREATE INDEX idx_ws_verse ON word_strongs(book, chapter, verse);
    CREATE INDEX idx_ws_strongs ON word_strongs(strongs_id);

    CREATE TABLE IF NOT EXISTS verse_tokens (
      translation TEXT NOT NULL DEFAULT 'KJV',
      book INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      tokens TEXT NOT NULL,
      PRIMARY KEY (translation, book, chapter, verse)
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS verses_fts USING fts5(text, content='verses', content_rowid='id');
  `);

  return db;
}

export function seedTestDb(db: Database.Database): void {
  // Seed verses
  const insertVerse = db.prepare(
    'INSERT INTO verses (book, chapter, verse, text, translation) VALUES (?, ?, ?, ?, ?)'
  );

  const verses = [
    [1, 1, 1, 'In the beginning God created the heaven and the earth.', 'KJV'],
    [1, 1, 2, 'And the earth was without form, and void; and darkness was upon the face of the deep.', 'KJV'],
    [1, 1, 3, 'And God said, Let there be light: and there was light.', 'KJV'],
    [1, 1, 1, 'In the beginning God created the heavens and the earth.', 'ASV'],
    [1, 1, 1, 'in principio creavit Deus caelum et terram', 'VUL'],
    [43, 3, 16, 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', 'KJV'],
    [43, 3, 16, 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth on him should not perish, but have eternal life.', 'ASV'],
    [19, 23, 1, 'The LORD is my shepherd; I shall not want.', 'KJV'],
    [45, 8, 28, 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.', 'KJV'],
    [50, 4, 13, 'I can do all things through Christ which strengtheneth me.', 'KJV'],
  ];

  db.transaction(() => {
    for (const v of verses) {
      insertVerse.run(...v);
    }
  })();

  // Rebuild FTS index
  db.exec(`INSERT INTO verses_fts(verses_fts) VALUES('rebuild')`);

  // Seed cross-references
  const insertXref = db.prepare(
    'INSERT INTO cross_references (from_book, from_chapter, from_verse_start, from_verse_end, to_book, to_chapter, to_verse_start, to_verse_end, votes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  db.transaction(() => {
    insertXref.run(43, 3, 16, 16, 45, 5, 8, 8, 100);
    insertXref.run(1, 1, 1, 1, 43, 1, 1, 1, 50);
    insertXref.run(19, 23, 1, 1, 43, 10, 11, 11, 30);
  })();

  // Seed Strong's
  const insertStrong = db.prepare(
    'INSERT INTO strongs (id, original, transliteration, translit_plain, definition, kjv_usage, language) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  db.transaction(() => {
    insertStrong.run('G26', 'ἀγάπη', 'agapē', 'agape', 'Love, affection, good will', 'charity, love', 'greek');
    insertStrong.run('H430', 'אֱלֹהִים', 'elohim', 'elohim', 'God, gods, judges', 'God, gods', 'hebrew');
    insertStrong.run('H1254', 'בָּרָא', 'bara', 'bara', 'To create, shape, form', 'create', 'hebrew');
    insertStrong.run('G2316', 'θεός', 'theos', 'theos', 'God, the supreme Deity', 'God, god', 'greek');
    insertStrong.run('G3056', 'λόγος', 'logos', 'logos', 'Word, speech, reason', 'word, saying', 'greek');
  })();

  // Seed word-strongs mappings
  const insertWS = db.prepare(
    'INSERT INTO word_strongs (book, chapter, verse, word, strongs_id, position) VALUES (?, ?, ?, ?, ?, ?)'
  );
  db.transaction(() => {
    insertWS.run(1, 1, 1, 'God', 'H430', 4);
    insertWS.run(1, 1, 1, 'created', 'H1254', 5);
    insertWS.run(43, 3, 16, 'God', 'G2316', 2);
    insertWS.run(43, 3, 16, 'loved', 'G26', 4);
  })();

  db.prepare('INSERT INTO verse_tokens (book, chapter, verse, tokens) VALUES (?, ?, ?, ?)').run(
    1, 1, 1,
    JSON.stringify(['In the beginning ', { t: 'God', s: ['H430'] }, ' ', { t: 'created', s: ['H853', 'H1254'] }, ' the heaven.'])
  );
  db.prepare('INSERT INTO verse_tokens (translation, book, chapter, verse, tokens) VALUES (?, ?, ?, ?, ?)').run(
    'HTL', 1, 1, 1,
    JSON.stringify([{ t: 'bereShit', s: ['H7225'] }, ' ', { t: "baRa'", s: ['H1254'] }, ' ', { t: "'EloHim", s: ['H430'] }])
  );


}
