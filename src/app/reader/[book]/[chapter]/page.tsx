import { notFound } from 'next/navigation';
import Link from 'next/link';
import VerseDisplay from '@/components/VerseDisplay';
import KeyboardNav from '@/components/KeyboardNav';
import { getBookBySlug, BIBLE_BOOKS } from '@/lib/bible-books';
import { getAvailableTranslations, getDb } from '@/lib/db';
import { getChapterTokens } from '@/lib/strongs';
import { Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { byTranslationOrder, getTranslation } from '@/lib/translations';
import ReadingTracker from '@/components/ReadingTracker';

import type { Metadata } from 'next';

interface Verse {
  book: number;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}

interface Props {
  params: Promise<{ book: string; chapter: string }>;
  searchParams: Promise<{ translations?: string }>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const bookInfo = getBookBySlug(params.book);
  const title = bookInfo ? `${bookInfo.name} ${params.chapter} — Bible Logos` : 'Bible Logos';
  return {
    title,
    description: bookInfo ? `Read ${bookInfo.name} ${params.chapter} with Strong's concordance and cross-references.` : undefined,
  };
}

export default async function ReaderPage(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const bookInfo = getBookBySlug(params.book);
  if (!bookInfo) notFound();
  
  const chapter = parseInt(params.chapter);
  if (isNaN(chapter) || chapter < 1 || chapter > bookInfo.chapters) notFound();

  // KJV alone by default: it is the translation with every word linked to the original languages.
  const requested = (searchParams.translations || 'KJV').split(',').filter(Boolean);
  const db = getDb();
  const available = getAvailableTranslations().sort(byTranslationOrder);
  const selectedTranslations = requested.filter(t => available.includes(t));
  if (selectedTranslations.length === 0) selectedTranslations.push('KJV');

  const verses = db.prepare(`
    SELECT book, chapter, verse, text, translation
    FROM verses
    WHERE book = ? AND chapter = ? AND translation IN (${selectedTranslations.map(() => '?').join(',')})
    ORDER BY verse
  `).all(bookInfo.id, chapter, ...selectedTranslations) as Verse[];

  // Strong's-tagged words for the chosen translations that have them (the KJV and HTL)
  const tokens = Object.fromEntries(selectedTranslations
    .map(t => [t, getChapterTokens(db, bookInfo.id, chapter, t)] as const)
    .filter(([, byVerse]) => Object.keys(byVerse).length > 0));
  const tagged = Object.keys(tokens);

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
      : [...selectedTranslations, t].sort(byTranslationOrder);
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
            <Link href={`/reader?book=${params.book}`} className="hover:text-gold-400 transition-colors" title="Choose a book or chapter">
              {bookInfo.name} <span className="text-gold-400">{chapter}</span>
            </Link>
          </h1>
          {next ? <Link href={next.href} className={arrow} aria-label={`Next: ${next.label}`}><ChevronRight size={20} /></Link> : <span className="w-9" />}
        </div>
        <p className="mt-1 text-xs text-parchment-500">{verseCount} verses · {minutes} min read</p>

        {/* Stays open while choosing, so several can be ticked in turn */}
        <details className="group relative mt-5 inline-block text-left">
          <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-parchment-900 text-xs font-medium text-parchment-200 hover:bg-parchment-800 transition-colors">
            {selectedTranslations.join(' · ')}
            <ChevronDown size={14} className="text-parchment-500 transition-transform group-open:rotate-180" />
            <span className="sr-only">Choose translations</span>
          </summary>
          <div className="absolute left-1/2 -translate-x-1/2 z-20 mt-2 w-[min(24rem,calc(100vw-2rem))] max-h-[60vh] overflow-y-auto p-1.5 rounded-xl bg-parchment-950 border border-parchment-800 shadow-xl">
            <p className="px-3 pt-2 pb-1 text-xs text-parchment-500">Choose one or more to read side by side.</p>
            {available.map(t => {
              const active = selectedTranslations.includes(t);
              const info = getTranslation(t);
              return (
                <Link
                  key={t}
                  href={toggleHref(t)}
                  aria-pressed={active}
                  className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-parchment-900 transition-colors"
                >
                  <span className={`mt-0.5 w-4 h-4 shrink-0 rounded-sm border flex items-center justify-center ${
                    active ? 'bg-gold-600 border-gold-600 text-parchment-950' : 'border-parchment-700'
                  }`}>
                    {active && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-parchment-100">
                      <span className="font-semibold">{t}</span> <span className="text-parchment-400">{info?.name}</span>
                    </span>
                    {info?.note && <span className="block text-xs text-parchment-500">{info.note}</span>}
                  </span>
                </Link>
              );
            })}
          </div>
        </details>
        <p className="mt-3 text-xs text-parchment-500">
          Tap a verse for cross-references{tagged.length ? `, or a word in the ${tagged.join(' or ')} for its ${tagged.includes('KJV') ? 'Hebrew or Greek original' : 'Hebrew original'}` : ''}.
        </p>
      </header>

      <VerseDisplay
        // The tagged tokens already carry the text; don't send it twice
        verses={verses.map(v => (tokens[v.translation]?.[v.verse] ? { ...v, text: '' } : v))}
        translations={selectedTranslations}
        tokens={tokens}
      />

      <p className="max-w-2xl mx-auto mt-10 text-xs text-parchment-500">
        {selectedTranslations.map(t => `${getTranslation(t)?.name ?? t} (${t}): ${getTranslation(t)?.licence ?? 'see README'}.`).join(' ')}
      </p>

      <nav className="max-w-2xl mx-auto mt-6 grid grid-cols-2 gap-3" aria-label="Chapter navigation">
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
