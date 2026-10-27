'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BIBLE_BOOKS, type BookInfo } from '@/lib/bible-books';

const slugOf = (book: BookInfo) => book.name.toLowerCase().replace(/ /g, '-');

/** Books of the Bible by testament; choosing one shows its chapters. */
export default function BookPicker({ initialBook }: { initialBook?: BookInfo }) {
  const [testament, setTestament] = useState<'OT' | 'NT'>(initialBook?.testament ?? 'OT');
  const [selected, setSelected] = useState<BookInfo | undefined>(initialBook);
  const [filter, setFilter] = useState('');

  const query = filter.trim().toLowerCase();
  const books = BIBLE_BOOKS.filter(b =>
    query ? b.name.toLowerCase().includes(query) || b.abbrev.toLowerCase().includes(query) : b.testament === testament
  );

  return (
    <div>
      {selected && (
        <section className="mb-8 p-4 rounded-xl bg-parchment-900/70" aria-label={`Chapters of ${selected.name}`}>
          <h2 className="font-serif text-xl font-semibold text-parchment-50 mb-3">{selected.name}</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5">
            {Array.from({ length: selected.chapters }, (_, i) => i + 1).map(ch => (
              <Link
                key={ch}
                href={`/reader/${slugOf(selected)}/${ch}`}
                className="text-center text-sm py-2 rounded-lg tabular-nums text-parchment-200 bg-parchment-950/60 hover:bg-gold-600 hover:text-parchment-950 transition-colors"
              >
                {ch}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex gap-1 p-1 rounded-lg bg-parchment-900 text-sm font-medium">
          {(['OT', 'NT'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTestament(t); setFilter(''); }}
              aria-pressed={testament === t && !query}
              className={`flex-1 px-4 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                testament === t && !query ? 'bg-parchment-950 text-parchment-100 shadow-xs' : 'text-parchment-500 hover:text-parchment-300'
              }`}
            >
              {t === 'OT' ? 'Old Testament' : 'New Testament'}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Find a book"
          aria-label="Find a book"
          className="flex-1 px-3 py-2 rounded-lg bg-transparent border border-parchment-800 text-sm text-parchment-200 placeholder-parchment-600 focus:outline-hidden focus:border-gold-500/50"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
        {books.map(book => (
          <button
            key={book.id}
            onClick={() => { setSelected(book); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            aria-pressed={selected?.id === book.id}
            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
              selected?.id === book.id ? 'bg-parchment-800 text-parchment-50 font-medium' : 'text-parchment-300 hover:bg-parchment-900'
            }`}
          >
            {book.name}
            <span className="text-xs text-parchment-500 tabular-nums">{book.chapters}</span>
          </button>
        ))}
        {books.length === 0 && <p className="col-span-full text-sm text-parchment-500">No book matches &ldquo;{filter}&rdquo;.</p>}
      </div>
    </div>
  );
}
