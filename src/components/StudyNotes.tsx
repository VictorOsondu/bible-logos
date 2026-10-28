'use client';
import { localId } from '@/lib/local-id';

import { chaptersFor, type EditionCatalogue } from '@/lib/edition-catalogue';
import ReferencePicker from '@/components/ReferencePicker';
import { useState } from 'react';
import { useStoredJson, writeStoredJson } from '@/lib/storage';
import Link from 'next/link';
import { LIBRARY_BOOKS } from '@/lib/text-library';
import { getTranslation } from '@/lib/translations';
import { useCollections } from '@/components/CollectionToggle';
import { BIBLE_BOOKS, getBookById } from '@/lib/bible-books';

interface StudyNote {
  id: string;
  book: number;
  translation?: string;
  chapterLabel?: string;
  chapter: number;
  verse: number | null;
  text: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

/** Called only when the reader saves a note; timestamps and IDs belong to that event. */
function createNote(fields: Omit<StudyNote, 'id' | 'createdAt' | 'updatedAt'>): StudyNote {
  const now = Date.now();
  return { ...fields, id: localId(), createdAt: now, updatedAt: now };
}

const STORAGE_KEY = 'biblelogos-study-notes';

const NO_NOTES: StudyNote[] = [];

function saveNotes(notes: StudyNote[]) {
  writeStoredJson(STORAGE_KEY, notes);
}

function getBookName(id: number): string {
  return getBookById(id)?.name || `Book ${id}`;
}

function getBookSlug(id: number): string {
  const book = getBookById(id);
  return book ? book.name.toLowerCase().replace(/ /g, '-') : '';
}

export default function StudyNotes({ catalogue }: { catalogue: EditionCatalogue }) {
  const notes = useStoredJson(STORAGE_KEY, NO_NOTES).filter(n => n && typeof n === 'object' && typeof n.id === 'string' && Number.isSafeInteger(n.book) && Number.isSafeInteger(n.chapter) && typeof n.text === 'string' && Array.isArray(n.tags) && n.tags.every(t => typeof t === 'string') && (n.chapterLabel === undefined || typeof n.chapterLabel === 'string') && (n.translation === undefined || typeof n.translation === 'string'));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string>('');
  const [filterBook, setFilterBook] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'book'>('newest');

  // New note form
  const [newBook, setNewBook] = useState(1);
  const [newVersion, setNewVersion] = useState('KJV');
  const collections = useCollections();
  const books = [...BIBLE_BOOKS, ...LIBRARY_BOOKS.filter(b => collections.includes(b.collection) || notes.some(n => n.book === b.id))];
  const [newChapter, setNewChapter] = useState(1);
  const [newVerse, setNewVerse] = useState('');
  const [newText, setNewText] = useState('');
  const [newTags, setNewTags] = useState('');
  const [showForm, setShowForm] = useState(false);


  const allTags = Array.from(new Set(notes.flatMap(n => n.tags))).sort();

  const filteredNotes = notes
    .filter(n => !filterTag || n.tags.includes(filterTag))
    .filter(n => !filterBook || n.book === filterBook)
    .filter(n => !searchQuery || n.text.toLowerCase().includes(searchQuery.toLowerCase()) || getBookName(n.book).toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'newest') return b.updatedAt - a.updatedAt;
      if (sortBy === 'oldest') return a.createdAt - b.createdAt;
      return a.book - b.book || a.chapter - b.chapter || (a.verse || 0) - (b.verse || 0);
    });

  const selectedChapter = chaptersFor(catalogue, newVersion, newBook).find(c => c.chapter === newChapter);
  const native = getTranslation(newVersion)?.nativeReferences;
  const validVerse = native || !newVerse || /^\d+$/.test(newVerse) && Number(newVerse) >= 1 && Number(newVerse) <= (selectedChapter?.maxVerse ?? 0) && !selectedChapter?.missingVerses.includes(Number(newVerse));

  function handleAddNote() {
    if (!newText.trim() || !selectedChapter || !validVerse) return;
    const note = createNote({
      book: newBook,
      translation: newVersion,
      chapter: newChapter,
      chapterLabel: selectedChapter.label,
      verse: !getTranslation(newVersion)?.nativeReferences && newVerse ? parseInt(newVerse) : null,
      text: newText.trim(),
      tags: [...new Set(newTags.split(',').map(t => t.trim()).filter(Boolean))],
    });
    const updated = [note, ...notes];
    saveNotes(updated);
    setNewText('');
    setNewTags('');
    setNewVerse('');
    setShowForm(false);
    }

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    saveNotes(updated);
  };

  const updateNote = (id: string, text: string, tags: string) => {
    if (!text.trim()) return;
    const updated = notes.map(n =>
      n.id === id
        ? { ...n, text, tags: [...new Set(tags.split(',').map(t => t.trim()).filter(Boolean))], updatedAt: Date.now() }
        : n
    );
    saveNotes(updated);
    setEditingId(null);
  };

  const exportNotes = () => {
    const md = filteredNotes.map(n => {
      const ref = `${getBookName(n.book)} ${n.chapterLabel ?? n.chapter}${n.verse != null ? ':' + n.verse : ''} (${n.translation ?? 'KJV'})`;
      const tags = n.tags.length ? ` [${n.tags.join(', ')}]` : '';
      return `## ${ref}${tags}\n\n${n.text}\n`;
    }).join('\n---\n\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biblelogos-study-notes-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <main className="flex-1 p-4 lg:p-8 max-w-5xl">

        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-semibold font-serif text-parchment-50">Study Notes</h1>
            <p className="text-sm text-parchment-500 mt-1">{notes.length} note{notes.length !== 1 ? 's' : ''} saved locally</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-lg bg-gold-600 text-parchment-950 font-semibold text-sm hover:bg-gold-500 transition-colors">
              {showForm ? 'Close' : '+ New Note'}
            </button>
            {notes.length > 0 && (
              <button onClick={exportNotes} className="px-4 py-2 rounded-lg bg-parchment-800 text-parchment-300 text-sm hover:bg-parchment-700 transition-colors border border-parchment-700">
                Export MD
              </button>
            )}
          </div>
        </div>

        {/* New note form */}
        {showForm && (
          <div className="bg-parchment-900 border border-gold-500/30 rounded-2xl p-5 mb-6 animate-fade-in">
            <h2 className="text-lg font-semibold text-parchment-200 mb-4">Add Study Note</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <ReferencePicker prefix="Note" catalogue={catalogue} books={books} value={{ book: newBook, version: newVersion, chapter: newChapter }} onChange={ref => { setNewBook(ref.book); setNewVersion(ref.version); setNewChapter(ref.chapter); setNewVerse(''); }} />
              <input aria-label="Note verse (optional)" type="text" disabled={getTranslation(newVersion)?.nativeReferences} value={newVerse} onChange={e => setNewVerse(e.target.value)} placeholder={getTranslation(newVersion)?.nativeReferences ? "Whole chapter note" : "Verse (optional)"} className="bg-parchment-800 text-parchment-200 rounded-lg px-3 py-2 text-sm border border-parchment-700" />
              <input aria-label="Note tags" type="text" value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="Tags (comma separated)" className="bg-parchment-800 text-parchment-200 rounded-lg px-3 py-2 text-sm border border-parchment-700" />
            </div>
            {!validVerse && <p role="status" className="text-sm text-parchment-300 mb-3">Choose a verse present in this edition, from 1 to {selectedChapter?.maxVerse}. Omitted verse numbers cannot be selected.</p>}
            <textarea
              aria-label="Note text" value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="Your study notes, observations, or reflections..."
              rows={4}
              className="w-full bg-parchment-800 text-parchment-200 rounded-lg px-3 py-2 text-sm border border-parchment-700 mb-3 resize-y"
            />
            <button onClick={handleAddNote} disabled={!newText.trim() || !selectedChapter || !validVerse} className="px-5 py-2 rounded-lg bg-gold-600 text-parchment-950 font-semibold text-sm hover:bg-gold-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Save Note
            </button>
          </div>
        )}

        {/* Filters */}
        {notes.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            <input
              type="text"
              aria-label="Search notes" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="bg-parchment-800 text-parchment-200 rounded-lg px-3 py-2 text-sm border border-parchment-700 flex-1 min-w-[200px]"
            />
            <select aria-label="Filter notes by book" value={filterBook} onChange={e => setFilterBook(Number(e.target.value))} className="bg-parchment-800 text-parchment-200 rounded-lg px-3 py-2 text-sm border border-parchment-700">
              <option value={0}>All Books</option>
              {books.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {allTags.length > 0 && (
              <select aria-label="Filter notes by tag" value={filterTag} onChange={e => setFilterTag(e.target.value)} className="bg-parchment-800 text-parchment-200 rounded-lg px-3 py-2 text-sm border border-parchment-700">
                <option value="">All Tags</option>
                {allTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
            <select aria-label="Sort notes" value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="bg-parchment-800 text-parchment-200 rounded-lg px-3 py-2 text-sm border border-parchment-700">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="book">By Book</option>
            </select>
          </div>
        )}

        {/* Notes list */}
        {filteredNotes.length === 0 && notes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4"></p>
            <p className="text-parchment-400 text-lg">No study notes yet.</p>
            <p className="text-parchment-500 text-sm mt-2">Click &quot;New Note&quot; to start annotating your Bible study.</p>
          </div>
        )}

        <div className="space-y-3">
          {filteredNotes.map(note => {
            const ref = `${getBookName(note.book)} ${note.chapterLabel ?? note.chapter}${note.verse != null ? ':' + note.verse : ''}`;
            const slug = getBookSlug(note.book);
            const isEditing = editingId === note.id;

            return (
              <div key={note.id} className="bg-parchment-900/70 rounded-xl p-4 hover:bg-parchment-900 transition-all">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <Link href={`/reader/${slug}/${note.chapter}?translations=${note.translation ?? 'KJV'}${note.verse != null ? '#v' + note.verse : ''}`} className="text-gold-400 font-semibold text-sm hover:text-gold-300 transition-colors">
                    {ref} <span className="text-xs text-parchment-400">{note.translation ?? 'KJV'}</span>
                  </Link>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => setEditingId(isEditing ? null : note.id)} className="text-xs px-2 py-1 rounded-sm bg-parchment-800 text-parchment-400 hover:text-parchment-200 transition-colors">
                      {isEditing ? 'Close' : 'Edit'}
                    </button>
                    <button aria-label={`Delete note for ${ref}`} onClick={() => deleteNote(note.id)} className="text-xs px-2 py-1 rounded-sm bg-parchment-800 text-red-400 hover:text-red-300 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <EditNoteForm note={note} onSave={updateNote} />
                ) : (
                  <p className="text-sm text-parchment-300 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                )}

                <div className="flex items-center justify-between mt-3">
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map(tag => (
                      <button key={tag} onClick={() => setFilterTag(tag)} className="text-xs px-2 py-0.5 rounded-full bg-gold-600/20 text-gold-400 hover:bg-gold-600/30 transition-colors">
                        {tag}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-parchment-600">{new Date(note.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}

function EditNoteForm({ note, onSave }: { note: StudyNote; onSave: (id: string, text: string, tags: string) => void }) {
  const [text, setText] = useState(note.text);
  const [tags, setTags] = useState(note.tags.join(', '));

  return (
    <div className="space-y-2">
      <textarea aria-label="Edit note text" value={text} onChange={e => setText(e.target.value)} rows={3} className="w-full bg-parchment-800 text-parchment-200 rounded-lg px-3 py-2 text-sm border border-parchment-700 resize-y" />
      <input aria-label="Edit note tags" type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (comma separated)" className="w-full bg-parchment-800 text-parchment-200 rounded-lg px-3 py-2 text-sm border border-parchment-700" />
      <button disabled={!text.trim()} onClick={() => onSave(note.id, text, tags)} className="px-4 py-1.5 rounded-lg bg-gold-600 text-parchment-950 font-semibold text-xs hover:bg-gold-500 transition-colors">
        Save Changes
      </button>
    </div>
  );
}
