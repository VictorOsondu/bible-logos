// Reading history and bookmarks, kept in the browser (client components only).

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

function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private browsing); nothing to save.
  }
}

export const getHistory = () => read<ReadingHistory>(HISTORY_KEY);
export const getBookmarks = () => read<Bookmark>(BOOKMARKS_KEY);

/** Records a chapter as read, most recent first, without duplicates. */
export function recordReading(book: number, chapter: number) {
  const rest = getHistory().filter(h => !(h.book === book && h.chapter === chapter));
  write(HISTORY_KEY, [{ book, chapter, timestamp: new Date().toISOString() }, ...rest].slice(0, HISTORY_LIMIT));
}

export function isBookmarked(book: number, chapter: number, verse?: number) {
  return getBookmarks().some(b => b.book === book && b.chapter === chapter && b.verse === verse);
}

/** Adds the verse to bookmarks, or removes it if already there. Returns whether it is now bookmarked. */
export function toggleBookmark(book: number, chapter: number, verse?: number): boolean {
  const bookmarks = getBookmarks();
  const existing = bookmarks.filter(b => b.book === book && b.chapter === chapter && b.verse === verse);
  if (existing.length) {
    write(BOOKMARKS_KEY, bookmarks.filter(b => !existing.includes(b)));
    return false;
  }
  const bookmark: Bookmark = {
    id: Date.now().toString(36),
    book, chapter, verse,
    note: '',
    color: 'gold',
    createdAt: new Date().toISOString(),
  };
  write(BOOKMARKS_KEY, [bookmark, ...bookmarks]);
  return true;
}
