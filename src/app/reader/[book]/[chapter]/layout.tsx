import { notFound } from 'next/navigation';
import { getBookBySlug } from '@/lib/bible-books';

/**
 * Rejects unknown books and chapters before the page's loading screen starts streaming,
 * so they get a real 404 status rather than a "not found" page sent with 200.
 */
export default function ChapterLayout({ children, params }: { children: React.ReactNode; params: { book: string; chapter: string } }) {
  const book = getBookBySlug(params.book);
  const chapter = Number(params.chapter);
  if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) notFound();
  return children;
}
