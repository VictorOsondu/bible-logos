'use client';
import { useState } from 'react';
import Link from 'next/link';
import { chaptersFor, type EditionCatalogue } from '@/lib/edition-catalogue';
import { byTranslationOrder } from '@/lib/translations';
import { BIBLE_BOOKS, type BookInfo } from '@/lib/bible-books';
import { LIBRARY_BOOKS, slugOf, type LibraryBook } from '@/lib/text-library';
import { getTranslation } from '@/lib/translations';
import { useCollections } from './CollectionToggle';
export default function BookPicker({ initialBook, initialVersion = 'KJV', catalogue }: { initialBook?: BookInfo | LibraryBook; initialVersion?: string; catalogue: EditionCatalogue }) {
  const enabled = useCollections();
  const versions = Object.keys(catalogue).sort(byTranslationOrder);
  const firstVersion = versions.includes(initialVersion.split(',')[0]) ? initialVersion.split(',')[0] : versions[0] ?? 'KJV';
  const firstBook = [...BIBLE_BOOKS, ...LIBRARY_BOOKS].find(b => catalogue[firstVersion]?.[b.id]);
  const [version, setVersion] = useState(firstVersion);
  const [testament, setTestament] = useState(initialBook?.testament ?? firstBook?.testament ?? 'OT');
  const [selected, setSelected] = useState(initialBook);
  const [filter, setFilter] = useState('');
  const explicit = version !== 'KJV';
  const inventory = [...BIBLE_BOOKS, ...LIBRARY_BOOKS].filter(b => {
    if (explicit) return Boolean(catalogue[version]?.[b.id]);
    return b.testament !== 'Library' || enabled.includes(b.collection);
  });
  const query = filter.trim().toLowerCase();
  const books = inventory.filter(b => query ? b.name.toLowerCase().includes(query) : b.testament === testament);
  const selectedVersion = selected?.testament === 'Library' && !explicit ? selected.defaultVersion : version;
  const chapters = selected ? chaptersFor(catalogue, selectedVersion, selected.id) : [];
  const chosenVersions = selected?.testament === 'Library' && !explicit ? selectedVersion : version === firstVersion ? [...new Set(initialVersion.split(','))].filter(v => versions.includes(v)).join(',') || version : version;
  const categories = ['OT', 'NT', 'Library'].filter(t => inventory.some(b => b.testament === t));
  return <div>
    <div className="mb-5 flex flex-wrap items-center gap-3"><label className="text-sm text-parchment-300 min-w-0 max-w-full">Version{' '}<select aria-label="Browse version" value={version} onChange={e => { setVersion(e.target.value); setSelected(undefined); setTestament([...BIBLE_BOOKS, ...LIBRARY_BOOKS].find(b => catalogue[e.target.value]?.[b.id])?.testament ?? 'OT'); }} className="bg-parchment-900 rounded p-2 w-full sm:w-auto max-w-full">{versions.map(id => <option key={id} value={id}>{getTranslation(id)?.name ?? id}</option>)}</select></label><Link href="/library" className="text-sm text-gold-400">Explore writings →</Link></div>
    {selected && <section className="mb-8 p-4 rounded-xl bg-parchment-900/70" aria-label={`Chapters of ${selected.name}`}><h2 className="font-serif text-xl text-parchment-50 mb-3">{selected.name}</h2><div className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5">
      {chapters.map(ch => <Link key={ch.chapter} href={`/reader/${slugOf(selected)}/${ch.chapter}${chosenVersions === 'KJV' ? '' : `?translations=${chosenVersions}`}`} className="text-center text-sm p-2 rounded-lg text-parchment-200 bg-parchment-950/60 hover:bg-gold-600 hover:text-parchment-950">{ch.label}</Link>)}
      {!chapters.length && <p className="col-span-full text-sm text-parchment-400">This work is unavailable in the selected edition.</p>}
    </div></section>}
    <div className="flex flex-wrap gap-2 mb-4"><div className="flex flex-wrap gap-1 p-1 rounded-lg bg-parchment-900 text-sm">{categories.map(t => <button key={t} aria-pressed={testament === t && !query} onClick={() => { setTestament(t as typeof testament); setFilter(''); }} className={`px-4 py-2 rounded-md ${testament === t ? 'bg-parchment-950 text-parchment-100' : 'text-parchment-400'}`}>{t === 'OT' ? 'Old Testament' : t === 'NT' ? 'New Testament' : 'Other writings'}</button>)}</div><input type="search" aria-label="Find a book" placeholder="Find a book" value={filter} onChange={e => setFilter(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-transparent border border-parchment-800 text-parchment-200" /></div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">{books.map(book => <button key={book.id} onClick={() => { setSelected(book); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-pressed={selected?.id === book.id} className="flex justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left text-parchment-300 hover:bg-parchment-900">{book.name}</button>)}{!books.length && <p className="col-span-full text-sm text-parchment-400">No books in this category. Choose another category or explore writings.</p>}</div>
  </div>;
}
