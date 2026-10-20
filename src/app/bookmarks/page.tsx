'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, X } from 'lucide-react';
import { BIBLE_BOOKS } from '@/lib/bible-books';
import {
  BOOKMARKS_KEY, HISTORY_KEY, getBookmarks, getHistory, type Bookmark, type ReadingHistory,
} from '@/lib/reading';

function getBookName(id: number): string {
  return BIBLE_BOOKS.find(b => b.id === id)?.name || `Book ${id}`;
}
function getBookSlug(id: number): string {
  return (BIBLE_BOOKS.find(b => b.id === id)?.name || '').toLowerCase().replace(/ /g, '-');
}

const field = 'w-full bg-parchment-950 text-parchment-100 rounded-lg px-3 py-2 text-sm border border-parchment-800 focus:outline-none focus:border-gold-500/50';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history, setHistory] = useState<ReadingHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'history'>('bookmarks');
  const [showAdd, setShowAdd] = useState(false);
  const [addBook, setAddBook] = useState(1);
  const [addChapter, setAddChapter] = useState(1);
  const [addVerse, setAddVerse] = useState('');
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    setBookmarks(getBookmarks());
    setHistory(getHistory());
  }, []);

  const saveBookmarks = (bms: Bookmark[]) => {
    setBookmarks(bms);
    try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bms)); } catch { /* storage unavailable */ }
  };

  const addBookmark = () => {
    saveBookmarks([{
      id: Date.now().toString(36),
      book: addBook,
      chapter: addChapter,
      verse: addVerse ? parseInt(addVerse) : undefined,
      note: newNote,
      color: '',
      createdAt: new Date().toISOString(),
    }, ...bookmarks]);
    setNewNote('');
    setAddVerse('');
    setShowAdd(false);
  };

  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch { /* storage unavailable */ }
  };

  const chapters = BIBLE_BOOKS.find(b => b.id === addBook)?.chapters || 1;
  const tab = (id: typeof activeTab, label: string, count: number) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm transition-colors ${
        activeTab === id ? 'bg-parchment-950 text-parchment-100 shadow-sm' : 'text-parchment-500 hover:text-parchment-300'
      }`}
    >
      {label} <span className="text-parchment-500">{count}</span>
    </button>
  );

  return (
    <main className="flex-1 px-4 py-8 lg:px-8 lg:py-10 max-w-3xl">
      <h1 className="text-3xl font-semibold font-serif text-parchment-50 mb-1">Bookmarks</h1>
      <p className="text-sm text-parchment-500 mb-6">
        Saved in this browser. To bookmark a verse, tap it in the reader and choose Bookmark.
      </p>

      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex gap-1 p-1 rounded-lg bg-parchment-900 w-full sm:w-auto">
          {tab('bookmarks', 'Bookmarks', bookmarks.length)}
          {tab('history', 'History', history.length)}
        </div>
        {activeTab === 'bookmarks' && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-parchment-200 border border-parchment-800 hover:bg-parchment-900 transition-colors"
          >
            {showAdd ? <X size={15} /> : <Plus size={15} />} {showAdd ? 'Cancel' : 'Add'}
          </button>
        )}
        {activeTab === 'history' && history.length > 0 && (
          <button onClick={clearHistory} className="shrink-0 text-sm text-parchment-500 hover:text-parchment-200 transition-colors">
            Clear history
          </button>
        )}
      </div>

      {activeTab === 'bookmarks' && (
        <>
          {showAdd && (
            <div className="rounded-xl bg-parchment-900/70 p-4 mb-6 space-y-3 animate-fade-in">
              <div className="grid grid-cols-[2fr_1fr_1fr] gap-2">
                <select value={addBook} onChange={e => { setAddBook(parseInt(e.target.value)); setAddChapter(1); }} className={field} aria-label="Book">
                  {BIBLE_BOOKS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <select value={addChapter} onChange={e => setAddChapter(parseInt(e.target.value))} className={field} aria-label="Chapter">
                  {Array.from({ length: chapters }, (_, i) => i + 1).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="number" min={1} value={addVerse} onChange={e => setAddVerse(e.target.value)} placeholder="Verse" className={field} aria-label="Verse (optional)" />
              </div>
              <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Note (optional)" className={field} />
              <button onClick={addBookmark} className="px-4 py-2 rounded-lg bg-gold-600 text-parchment-950 text-sm font-medium hover:opacity-90 transition-opacity">
                Save bookmark
              </button>
            </div>
          )}

          {bookmarks.length === 0 ? (
            <p className="py-16 text-center text-sm text-parchment-500">No bookmarks yet.</p>
          ) : (
            <ul className="divide-y divide-parchment-800">
              {bookmarks.map(bm => (
                <li key={bm.id} className="flex items-center gap-3 py-3">
                  <Link href={`/reader/${getBookSlug(bm.book)}/${bm.chapter}${bm.verse ? `#v${bm.verse}` : ''}`} className="flex-1 min-w-0 group">
                    <p className="text-sm font-medium text-parchment-100 group-hover:text-gold-400">
                      {getBookName(bm.book)} {bm.chapter}{bm.verse ? `:${bm.verse}` : ''}
                    </p>
                    {bm.note && <p className="text-sm text-parchment-400 mt-0.5">{bm.note}</p>}
                    <p className="text-xs text-parchment-500 mt-0.5">{new Date(bm.createdAt).toLocaleDateString('en-GB')}</p>
                  </Link>
                  <button
                    onClick={() => saveBookmarks(bookmarks.filter(b => b.id !== bm.id))}
                    className="p-2 rounded-lg text-parchment-500 hover:text-red-500 hover:bg-parchment-900 transition-colors"
                    aria-label="Remove bookmark"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {activeTab === 'history' && (
        history.length === 0 ? (
          <p className="py-16 text-center text-sm text-parchment-500">Chapters you read will appear here.</p>
        ) : (
          <ul className="divide-y divide-parchment-800">
            {history.map(h => (
              <li key={`${h.book}-${h.chapter}`}>
                <Link href={`/reader/${getBookSlug(h.book)}/${h.chapter}`} className="flex items-center justify-between py-3 group">
                  <span className="text-sm text-parchment-100 group-hover:text-gold-400">{getBookName(h.book)} {h.chapter}</span>
                  <span className="text-xs text-parchment-500">
                    {new Date(h.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )
      )}
    </main>
  );
}
