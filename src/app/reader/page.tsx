import { getEditionCatalogue } from '@/lib/edition-data';
import { queryValue, type QueryParams } from '@/lib/query-params';
import type { Metadata } from 'next';
import BookPicker from '@/components/BookPicker';
import { getBookBySlug } from '@/lib/bible-books';

export const metadata: Metadata = { title: 'Books of the Bible — Bible Logos' };

export default async function BooksPage(props: { searchParams: Promise<QueryParams> }) {
  const { book, translations } = await props.searchParams;
  const initialBook = book ? getBookBySlug(queryValue(book)) : undefined;
  const catalogue = getEditionCatalogue();
  return (
    <main className="flex-1 px-4 py-6 lg:px-8 lg:py-10 max-w-4xl">
      <h1 className="font-serif text-3xl font-semibold text-parchment-50 mb-6">Books of the Bible</h1>
      {/* Keyed so that following a link to another book starts from that book */}
      <BookPicker key={`${initialBook?.id ?? 0}-${queryValue(translations)}`} initialBook={initialBook} initialVersion={queryValue(translations, 'KJV')} catalogue={catalogue} />
    </main>
  );
}
