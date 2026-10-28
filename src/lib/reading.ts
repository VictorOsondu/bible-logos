import { localId } from './local-id';
// Reading history and bookmarks, kept in the browser (client components only).

import { readStoredJson, useStoredJson, writeStoredJson } from './storage';

export const HISTORY_KEY = 'biblelogos-history';
export const BOOKMARKS_KEY = 'biblelogos-bookmarks';
const HISTORY_LIMIT = 50;

export interface ReadingHistory {
  chapterLabel?: string;
  book: number;
  translation?: string;
  chapter: number;
  timestamp: string;
}

export interface Bookmark {
  reference?: string;
  id: string;
  book: number;
  translation?: string;
  chapter: number;
  verse?: number;
  note: string;
  color: string;
  createdAt: string;
}

const NO_HISTORY: ReadingHistory[] = [];
const NO_BOOKMARKS: Bookmark[] = [];

type SavedReference = Pick<ReadingHistory, 'book' | 'chapter' | 'translation' | 'chapterLabel'>;
function isRef(value: unknown): value is SavedReference {
  if (!value || typeof value !== 'object') return false;
  const r = value as SavedReference;
  return Number.isSafeInteger(r.book) && r.book > 0 && Number.isSafeInteger(r.chapter) && r.chapter >= 0 &&
    (r.translation === undefined || typeof r.translation === 'string') &&
    (r.chapterLabel === undefined || typeof r.chapterLabel === 'string');
}
function isHistory(value: unknown): value is ReadingHistory {
  const r = value as Partial<ReadingHistory> | null;
  return isRef(value) && typeof r?.timestamp === 'string';
}
function isBookmark(value: unknown): value is Bookmark {
  const r = value as Partial<Bookmark> | null;
  return isRef(value) && !!r && typeof r.id === 'string' && typeof r.note === 'string' && typeof r.createdAt === 'string' &&
    (r.verse === undefined || Number.isSafeInteger(r.verse) && r.verse >= 0) &&
    (r.reference === undefined || typeof r.reference === 'string');
}

export const getHistory = () => readStoredJson(HISTORY_KEY, NO_HISTORY).filter(isHistory);
export const getBookmarks = () => readStoredJson(BOOKMARKS_KEY, NO_BOOKMARKS).filter(isBookmark);
export const useHistory = () => useStoredJson(HISTORY_KEY, NO_HISTORY).filter(isHistory);
export const useBookmarks = () => useStoredJson(BOOKMARKS_KEY, NO_BOOKMARKS).filter(isBookmark);

export const saveBookmarks = (bookmarks: Bookmark[]) => writeStoredJson(BOOKMARKS_KEY, bookmarks);
export const clearHistory = () => writeStoredJson(HISTORY_KEY, []);

/** Records a chapter as read, most recent first, without duplicates. */
export function recordReading(book: number, chapter: number, translation = 'KJV', chapterLabel?: string) {
  const rest = getHistory().filter(h => !(h.book === book && h.chapter === chapter && (h.translation ?? 'KJV') === translation));
  writeStoredJson(HISTORY_KEY, [{ book, chapter, translation, chapterLabel, timestamp: new Date().toISOString() }, ...rest].slice(0, HISTORY_LIMIT));
}

export function isBookmarked(bookmarks: Bookmark[], book: number, chapter: number, verse?: number, translation = 'KJV') {
  return bookmarks.some(b => b.book === book && b.chapter === chapter && b.verse === verse && (b.translation ?? 'KJV') === translation);
}

/** Adds the verse to bookmarks, or removes it if already there. */
export function toggleBookmark(book: number, chapter: number, verse?: number, translation = 'KJV', reference?: string) {
  const bookmarks = getBookmarks();
  if (isBookmarked(bookmarks, book, chapter, verse, translation)) {
    saveBookmarks(bookmarks.filter(b => !(b.book === book && b.chapter === chapter && b.verse === verse && (b.translation ?? 'KJV') === translation)));
    return;
  }
  saveBookmarks([{
    id: localId(),
    book, chapter, verse, translation, reference,
    note: '',
    color: '',
    createdAt: new Date().toISOString(),
  }, ...bookmarks]);
}
