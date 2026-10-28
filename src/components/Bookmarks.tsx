'use client';
import { localId } from '@/lib/local-id';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, X } from 'lucide-react';
import { chaptersFor, type EditionCatalogue } from '@/lib/edition-catalogue';
import ReferencePicker from '@/components/ReferencePicker';
import { getTranslation } from '@/lib/translations';
import { LIBRARY_BOOKS } from '@/lib/text-library';
import { useCollections } from '@/components/CollectionToggle';
import { BIBLE_BOOKS, getBookById } from '@/lib/bible-books';
import { clearHistory, saveBookmarks, useBookmarks, useHistory } from '@/lib/reading';

function getBookName(id: number): string {
  return getBookById(id)?.name || `Book ${id}`;
}
function getBookSlug(id: number): string {
  return (getBookById(id)?.name || '').toLowerCase().replace(/ /g, '-');
}

const field = 'w-full bg-parchment-950 text-parchment-100 rounded-lg px-3 py-2 text-sm border border-parchment-800 focus:outline-hidden focus:border-gold-500/50';

export default function Bookmarks({ catalogue }: { catalogue: EditionCatalogue }) {
  const bookmarks = useBookmarks();
  const history = useHistory();
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'history'>('bookmarks');
  const [showAdd, setShowAdd] = useState(false);
  const [addBook, setAddBook] = useState(1);
  const [addVersion, setAddVersion] = useState('KJV');
  const enabled = useCollections();
  const books = [...BIBLE_BOOKS, ...LIBRARY_BOOKS.filter(b => enabled.includes(b.collection))];
  const [addChapter, setAddChapter] = useState(1);
  const [addVerse, setAddVerse] = useState('');
  const [newNote, setNewNote] = useState('');

  const selectedChapter = chaptersFor(catalogue, addVersion, addBook).find(c => c.chapter === addChapter);
  const native = getTranslation(addVersion)?.nativeReferences;
  const validVerse = native || !addVerse || /^\d+$/.test(addVerse) && Number(addVerse) >= 1 && Number(addVerse) <= (selectedChapter?.maxVerse ?? 0) && !selectedChapter?.missingVerses.includes(Number(addVerse));
  const addBookmark = () => {
    if (!selectedChapter || !validVerse) return;
    saveBookmarks([{
      id: localId(),
      book: addBook,
      translation: addVersion,
      reference: `${getBookName(addBook)} ${selectedChapter.label}${!native && addVerse ? `:${addVerse}` : ''}`,
      chapter: addChapter,
      verse: !native && addVerse ? Number(addVerse) : undefined,
      note: newNote,
      color: '',
      createdAt: new Date().toISOString(),
    }, ...bookmarks]);
    setNewNote('');
    setAddVerse('');
    setShowAdd(false);
  };

  const tab = (id: typeof activeTab, label: string, count: number) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm transition-colors ${
        activeTab === id ? 'bg-parchment-950 text-parchment-100 shadow-xs' : 'text-parchment-500 hover:text-parchment-300'
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
                <ReferencePicker prefix="Bookmark" catalogue={catalogue} books={books} value={{ book: addBook, version: addVersion, chapter: addChapter }} onChange={ref => { setAddBook(ref.book); setAddVersion(ref.version); setAddChapter(ref.chapter); setAddVerse(''); }} />
                <input type="number" min={1} max={selectedChapter?.maxVerse} disabled={native} value={addVerse} onChange={e => setAddVerse(e.target.value)} placeholder={native ? 'Whole chapter' : 'Verse'} className={field} aria-label="Verse (optional)" />
              </div>
              {!validVerse && <p role="status" className="text-sm text-parchment-300">Choose a verse present in this edition, from 1 to {selectedChapter?.maxVerse}.</p>}
              <input aria-label="Bookmark note" type="text" value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Note (optional)" className={field} />
              <button disabled={!selectedChapter || !validVerse} onClick={addBookmark} className="px-4 py-2 rounded-lg bg-gold-600 text-parchment-950 text-sm font-medium hover:opacity-90 transition-opacity">
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
                  <Link href={`/reader/${getBookSlug(bm.book)}/${bm.chapter}?translations=${bm.translation ?? 'KJV'}${bm.verse !== undefined ? `#v${bm.verse}` : ''}`} className="flex-1 min-w-0 group">
                    <p className="text-sm font-medium text-parchment-100 group-hover:text-gold-400">
                      {bm.reference ?? `${getBookName(bm.book)} ${bm.chapter}${bm.verse !== undefined ? `:${bm.verse}` : ''}`} <span className="text-xs text-parchment-400">{bm.translation ?? 'KJV'}</span>
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
              <li key={`${h.book}-${h.chapter}?translations=${h.translation ?? 'KJV'}`}>
                <Link href={`/reader/${getBookSlug(h.book)}/${h.chapter}?translations=${h.translation ?? 'KJV'}`} className="flex items-center justify-between py-3 group">
                  <span className="text-sm text-parchment-100 group-hover:text-gold-400">{getBookName(h.book)} {h.chapterLabel ?? h.chapter}</span>
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
