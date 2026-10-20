import { notFound } from 'next/navigation';
import Link from 'next/link';
import VerseDisplay from '@/components/VerseDisplay';
import KeyboardNav from '@/components/KeyboardNav';
import { getBookBySlug, getBookById, BIBLE_BOOKS } from '@/lib/bible-books';
import { getDb } from '@/lib/db';
import { getChapterTokens } from '@/lib/strongs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ReadingTracker from '@/components/ReadingTracker';

import type { Metadata } from 'next';

const TRANSLATION_ORDER = ['KJV', 'ASV', 'YLT', 'BBE', 'VUL'];
const TRANSLATION_NAMES: Record<string, string> = {
  KJV: 'King James Version',
  ASV: 'American Standard Version',
  YLT: "Young's Literal Translation",
  BBE: 'Bible in Basic English',
  VUL: 'Latin Vulgate',
};

interface Verse {
  book: number;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}

interface Props {
  params: { book: string; chapter: string };
  searchParams: { translations?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const bookInfo = getBookBySlug(params.book);
  const title = bookInfo ? `${bookInfo.name} ${params.chapter} — Bible Logos` : 'Bible Logos';
  return {
    title,
    description: bookInfo ? `Read ${bookInfo.name} ${params.chapter} with Strong's concordance and cross-references.` : undefined,
  };
}

export default function ReaderPage({ params, searchParams }: Props) {
  const bookInfo = getBookBySlug(params.book);
  if (!bookInfo) notFound();
  
  const chapter = parseInt(params.chapter);
  if (isNaN(chapter) || chapter < 1 || chapter > bookInfo.chapters) notFound();

  // KJV alone by default: it is the translation with every word linked to the original languages.
  const requested = (searchParams.translations || 'KJV').split(',').filter(Boolean);
  const db = getDb();
  const available = (db.prepare('SELECT DISTINCT translation FROM verses').all() as { translation: string }[])
    .map(t => t.translation)
    .sort((a, b) => TRANSLATION_ORDER.indexOf(a) - TRANSLATION_ORDER.indexOf(b));
  const selectedTranslations = requested.filter(t => available.includes(t));
  if (selectedTranslations.length === 0) selectedTranslations.push('KJV');

  const verses = db.prepare(`
    SELECT book, chapter, verse, text, translation
    FROM verses
    WHERE book = ? AND chapter = ? AND translation IN (${selectedTranslations.map(() => '?').join(',')})
    ORDER BY verse
  `).all(bookInfo.id, chapter, ...selectedTranslations) as Verse[];

  // Strong's-tagged KJV text for this chapter
  const { tokens: kjvTokens, lexicon } = getChapterTokens(db, bookInfo.id, chapter);

  const verseCount = new Set(verses.map(v => v.verse)).size;
  const words = verses.filter(v => v.translation === selectedTranslations[0]).reduce((n, v) => n + v.text.split(/\s+/).length, 0);
  const minutes = Math.max(1, Math.round(words / 200));

  // Previous/next chapter, crossing into neighbouring books
  const bookIdx = BIBLE_BOOKS.findIndex(b => b.id === bookInfo.id);
  const prevBook = bookIdx > 0 ? BIBLE_BOOKS[bookIdx - 1] : null;
  const nextBook = bookIdx < BIBLE_BOOKS.length - 1 ? BIBLE_BOOKS[bookIdx + 1] : null;
  const slugOf = (name: string) => name.toLowerCase().replace(/ /g, '-');
  const query = selectedTranslations.join(',') === 'KJV' ? '' : `?translations=${selectedTranslations.join(',')}`;
  const prev = chapter > 1
    ? { label: `${bookInfo.name} ${chapter - 1}`, href: `/reader/${params.book}/${chapter - 1}${query}` }
    : prevBook ? { label: `${prevBook.name} ${prevBook.chapters}`, href: `/reader/${slugOf(prevBook.name)}/${prevBook.chapters}${query}` } : null;
  const next = chapter < bookInfo.chapters
    ? { label: `${bookInfo.name} ${chapter + 1}`, href: `/reader/${params.book}/${chapter + 1}${query}` }
    : nextBook ? { label: `${nextBook.name} 1`, href: `/reader/${slugOf(nextBook.name)}/1${query}` } : null;

  const toggleHref = (t: string) => {
    const set = selectedTranslations.includes(t)
      ? selectedTranslations.filter(x => x !== t)
      : [...selectedTranslations, t].sort((a, b) => TRANSLATION_ORDER.indexOf(a) - TRANSLATION_ORDER.indexOf(b));
    const list = set.length ? set : selectedTranslations;
    return `/reader/${params.book}/${chapter}${list.join(',') === 'KJV' ? '' : `?translations=${list.join(',')}`}`;
  };

  const arrow = 'p-2 rounded-full text-parchment-500 hover:text-parchment-100 hover:bg-parchment-800/70 transition-colors';

  return (
    <main className="flex-1 px-4 py-6 lg:px-8 lg:py-10 max-w-6xl">
      <ReadingTracker book={bookInfo.id} chapter={chapter} />

      <header className="max-w-2xl mx-auto text-center mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-parchment-500">
          {bookInfo.testament === 'OT' ? 'Old Testament' : 'New Testament'}
        </p>
        <div className="flex items-center justify-center gap-2 mt-1">
          {prev ? <Link href={prev.href} className={arrow} aria-label={`Previous: ${prev.label}`}><ChevronLeft size={20} /></Link> : <span className="w-9" />}
          <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-parchment-50">
            {bookInfo.name} <span className="text-gold-400">{chapter}</span>
          </h1>
          {next ? <Link href={next.href} className={arrow} aria-label={`Next: ${next.label}`}><ChevronRight size={20} /></Link> : <span className="w-9" />}
        </div>
        <p className="mt-1 text-xs text-parchment-500">{verseCount} verses · {minutes} min read</p>

        <div className="mt-5 inline-flex flex-wrap justify-center gap-1 p-1 rounded-full bg-parchment-900">
          {available.map(t => {
            const active = selectedTranslations.includes(t);
            return (
              <Link
                key={t}
                href={toggleHref(t)}
                aria-pressed={active}
                title={TRANSLATION_NAMES[t] ?? t}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  active ? 'bg-parchment-700/70 text-parchment-50' : 'text-parchment-500 hover:text-parchment-200'
                }`}
              >
                {t}
              </Link>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-parchment-500">
          Tap a verse for cross-references{selectedTranslations.includes('KJV') ? ', or a KJV word for its Hebrew or Greek original' : ''}.
        </p>
      </header>

      <VerseDisplay
        verses={verses}
        translations={selectedTranslations}
        kjvTokens={kjvTokens}
        lexicon={lexicon}
      />

      <nav className="max-w-2xl mx-auto mt-12 grid grid-cols-2 gap-3" aria-label="Chapter navigation">
        {prev ? (
          <Link href={prev.href} className="group flex items-center gap-2 p-4 rounded-xl border border-parchment-800 hover:border-parchment-700 hover:bg-parchment-900/60 transition-colors">
            <ChevronLeft size={18} className="text-parchment-500 group-hover:text-gold-400" />
            <span><span className="block text-xs text-parchment-500">Previous</span><span className="text-sm text-parchment-200">{prev.label}</span></span>
          </Link>
        ) : <span />}
        {next ? (
          <Link href={next.href} className="group flex items-center justify-end gap-2 p-4 rounded-xl border border-parchment-800 hover:border-parchment-700 hover:bg-parchment-900/60 transition-colors text-right">
            <span><span className="block text-xs text-parchment-500">Next</span><span className="text-sm text-parchment-200">{next.label}</span></span>
            <ChevronRight size={18} className="text-parchment-500 group-hover:text-gold-400" />
          </Link>
        ) : <span />}
      </nav>

      <KeyboardNav prevHref={prev?.href} nextHref={next?.href} />
    </main>
  );
}
