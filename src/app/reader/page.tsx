import type { Metadata } from 'next';
import BookPicker from '@/components/BookPicker';
import { getBookBySlug } from '@/lib/bible-books';

export const metadata: Metadata = { title: 'Books of the Bible — Bible Logos' };

export default async function BooksPage(props: { searchParams: Promise<{ book?: string }> }) {
  const { book } = await props.searchParams;
  const initialBook = book ? getBookBySlug(book) : undefined;
  return (
    <main className="flex-1 px-4 py-6 lg:px-8 lg:py-10 max-w-4xl">
      <h1 className="font-serif text-3xl font-semibold text-parchment-50 mb-6">Books of the Bible</h1>
      {/* Keyed so that following a link to another book starts from that book */}
      <BookPicker key={initialBook?.id ?? 0} initialBook={initialBook} />
    </main>
  );
}
