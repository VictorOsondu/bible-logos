'use client';
import { chaptersFor, type EditionCatalogue } from '@/lib/edition-catalogue';
import { getTranslation, byTranslationOrder } from '@/lib/translations';
import { libraryBook } from '@/lib/text-library';
export interface ReferenceChoice { book: number; version: string; chapter: number }
export default function ReferencePicker({ prefix, catalogue, books, value, onChange }: { prefix: string; catalogue: EditionCatalogue; books: { id: number; name: string }[]; value: ReferenceChoice; onChange: (value: ReferenceChoice) => void }) {
  const versions = Object.keys(catalogue).filter(v => catalogue[v][value.book]).sort(byTranslationOrder);
  const chapters = chaptersFor(catalogue, value.version, value.book);
  const field = 'min-w-0 max-w-full bg-parchment-800 text-parchment-200 rounded-lg px-3 py-2 text-sm border border-parchment-700';
  return <>
    <select aria-label={`${prefix} book`} value={value.book} onChange={e => {
      const book = Number(e.target.value);
      const version = catalogue[value.version]?.[book] ? value.version : libraryBook(book)?.defaultVersion ?? 'KJV';
      const available = catalogue[version]?.[book] ? version : Object.keys(catalogue).find(v => catalogue[v][book])!;
      onChange({ book, version: available, chapter: chaptersFor(catalogue, available, book)[0].chapter });
    }} className={field}>{books.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
    <select aria-label={`${prefix} edition`} value={value.version} onChange={e => {
      const version = e.target.value;
      const chapters = chaptersFor(catalogue, version, value.book);
      onChange({ ...value, version, chapter: chapters.some(c => c.chapter === value.chapter) ? value.chapter : chapters[0].chapter });
    }} className={field}>{versions.map(v => <option key={v} value={v}>{getTranslation(v)?.name ?? v}</option>)}</select>
    <select aria-label={`${prefix} chapter`} value={value.chapter} onChange={e => onChange({ ...value, chapter: Number(e.target.value) })} className={field}>{chapters.map(c => <option key={c.chapter} value={c.chapter}>{c.label}</option>)}</select>
  </>;
}
