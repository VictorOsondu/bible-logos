import { getDb } from '@/lib/db';
import { notFound } from 'next/navigation';
import { getBookBySlug } from '@/lib/bible-books';

/**
 * Rejects unknown books and chapters before the page's loading screen starts streaming,
 * so they get a real 404 status rather than a "not found" page sent with 200.
 */
export default async function ChapterLayout(props: { children: React.ReactNode; params: Promise<{ book: string; chapter: string }> }) {
  const { children } = props;
  const params = await props.params;
  const book = getBookBySlug(params.book);
  const chapter = Number(params.chapter);
  if (!book || !/^\d+$/.test(params.chapter) || !Number.isSafeInteger(chapter) || chapter < 0 || !getDb().prepare('SELECT 1 FROM verses WHERE book = ? AND chapter = ? LIMIT 1').get(book.id, chapter)) notFound();
  return children;
}
