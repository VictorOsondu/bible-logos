import { getDb } from './db';
import { getBookById } from './bible-books';
import type { EditionChapter, EditionCatalogue } from './edition-catalogue';
export type { EditionChapter } from './edition-catalogue';
export function editionChapters(translation: string, book: number): EditionChapter[] {
  const db = getDb();
  const rows = db.prepare('SELECT chapter, label, last_verse AS maxVerse, missing_verses FROM edition_chapters WHERE translation = ? AND book = ? ORDER BY position').all(translation, book) as { chapter: number; label: string; maxVerse: number; missing_verses: string }[];
  return rows.map(({ missing_verses, ...row }) => ({ ...row, missingVerses: JSON.parse(missing_verses) as number[] }));
}
export function editionBooks(translation: string) {
  return (getDb().prepare('SELECT book, MAX(chapter) AS chapters FROM edition_chapters WHERE translation = ? GROUP BY book ORDER BY MIN(rowid)').all(translation) as { book: number; chapters: number }[])
    .flatMap(r => { const book = getBookById(r.book); return book ? [{ ...book, chapters: r.chapters }] : []; });
}

export function getEditionCatalogue(): EditionCatalogue {
  const result: EditionCatalogue = {};
  const rows = getDb().prepare('SELECT translation, book, chapter, label, last_verse, missing_verses FROM edition_chapters ORDER BY rowid').all() as { translation: string; book: number; chapter: number; label: string; last_verse: number; missing_verses: string }[];
  for (const row of rows) {
    const chapters = (result[row.translation] ??= {})[row.book] ??= [];
    const missing = JSON.parse(row.missing_verses) as number[];
    chapters.push(missing.length ? [row.chapter, row.label === String(row.chapter) ? null : row.label, row.last_verse, missing] : [row.chapter, row.label === String(row.chapter) ? null : row.label, row.last_verse]);
  }
  return result;
}
