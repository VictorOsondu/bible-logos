// Reading history and bookmarks, kept in the browser (client components only).

import { readStoredJson, useStoredJson, writeStoredJson } from './storage';

export const HISTORY_KEY = 'biblelogos-history';
export const BOOKMARKS_KEY = 'biblelogos-bookmarks';
const HISTORY_LIMIT = 50;

export interface ReadingHistory {
  book: number;
  chapter: number;
  timestamp: string;
}

export interface Bookmark {
  id: string;
  book: number;
  chapter: number;
  verse?: number;
  note: string;
  color: string;
  createdAt: string;
}

const NO_HISTORY: ReadingHistory[] = [];
const NO_BOOKMARKS: Bookmark[] = [];

export const getHistory = () => readStoredJson(HISTORY_KEY, NO_HISTORY);
export const getBookmarks = () => readStoredJson(BOOKMARKS_KEY, NO_BOOKMARKS);
export const useHistory = () => useStoredJson(HISTORY_KEY, NO_HISTORY);
export const useBookmarks = () => useStoredJson(BOOKMARKS_KEY, NO_BOOKMARKS);

export const saveBookmarks = (bookmarks: Bookmark[]) => writeStoredJson(BOOKMARKS_KEY, bookmarks);
export const clearHistory = () => writeStoredJson(HISTORY_KEY, []);

/** Records a chapter as read, most recent first, without duplicates. */
export function recordReading(book: number, chapter: number) {
  const rest = getHistory().filter(h => !(h.book === book && h.chapter === chapter));
  writeStoredJson(HISTORY_KEY, [{ book, chapter, timestamp: new Date().toISOString() }, ...rest].slice(0, HISTORY_LIMIT));
}

export function isBookmarked(bookmarks: Bookmark[], book: number, chapter: number, verse?: number) {
  return bookmarks.some(b => b.book === book && b.chapter === chapter && b.verse === verse);
}

/** Adds the verse to bookmarks, or removes it if already there. */
export function toggleBookmark(book: number, chapter: number, verse?: number) {
  const bookmarks = getBookmarks();
  if (isBookmarked(bookmarks, book, chapter, verse)) {
    saveBookmarks(bookmarks.filter(b => !(b.book === book && b.chapter === chapter && b.verse === verse)));
    return;
  }
  saveBookmarks([{
    id: Date.now().toString(36),
    book, chapter, verse,
    note: '',
    color: '',
    createdAt: new Date().toISOString(),
  }, ...bookmarks]);
}
