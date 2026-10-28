import Link from 'next/link';
import { editionChapters } from '@/lib/edition-data';
import { COLLECTIONS, LIBRARY_BOOKS, slugOf } from '@/lib/text-library';
import { getDb } from '@/lib/db';
import { getTranslation } from '@/lib/translations';
import CollectionToggle from '@/components/CollectionToggle';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Explore writings — Bible Logos' };
export default function LibraryPage() {
  const available = getDb().prepare('SELECT DISTINCT book, translation FROM verses WHERE book > 66').all() as { book: number; translation: string }[];
  return <main className="flex-1 px-4 py-8 lg:px-8 max-w-5xl space-y-8">
    <header><h1 className="font-serif text-3xl text-parchment-50">Explore writings</h1>
      <p className="mt-3 text-parchment-300 max-w-3xl">Choose collections to include in your book browser and searches. You can read any work here without enabling its collection. Each tradition receives these writings differently; enabling a collection expresses your reading interests.</p>
      <Link href="/reader" className="inline-block mt-3 text-gold-400">Return to Bible books →</Link></header>
    {COLLECTIONS.map(collection => <section key={collection.id} aria-label={collection.name} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-serif text-2xl text-parchment-100">{collection.name}</h2><CollectionToggle id={collection.id} /></div>
      <p className="text-parchment-300">{collection.description} <a className="text-gold-400 underline" href={collection.source} target="_blank" rel="noreferrer">Background and reception</a></p>
      <div className="grid sm:grid-cols-2 gap-3">{LIBRARY_BOOKS.filter(b => b.collection === collection.id && available.some(a => a.book === b.id)).map(book => {
        const versions = available.filter(a => a.book === book.id).map(a => a.translation);
        const primary = versions.includes(book.defaultVersion) ? book.defaultVersion : versions[0];
        const firstChapter = (id: string) => editionChapters(id, book.id)[0]?.chapter ?? 1;
        return <article key={book.id} className="rounded-xl border border-parchment-800 p-4 space-y-3">
          <h3 className="font-serif text-xl text-parchment-100"><Link href={`/reader/${slugOf(book)}/${firstChapter(primary)}?translations=${primary}`} className="hover:text-gold-400">{book.name}</Link></h3>
          <p className="text-sm text-parchment-300">{book.introduction}</p>
          {versions.map(id => <p key={id} className="text-xs text-parchment-400"><Link className="text-gold-400 underline" href={`/reader/${slugOf(book)}/${firstChapter(id)}?translations=${id}`}>{getTranslation(id)?.name}</Link> · {getTranslation(id)?.licence}</p>)}
        </article>;
      })}</div>
    </section>)}
  </main>;
}
