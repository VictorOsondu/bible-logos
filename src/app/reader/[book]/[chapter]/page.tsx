import { queryValue, type QueryParams } from '@/lib/query-params';
import { readerHref } from '@/lib/reader-links';
import EditionText from '@/components/EditionText';
import CollectionToggle from '@/components/CollectionToggle';
import { editionBooks, editionChapters } from '@/lib/edition-data';
import { libraryBook } from '@/lib/text-library';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import VerseDisplay from '@/components/VerseDisplay';
import KeyboardNav from '@/components/KeyboardNav';
import { getBookBySlug } from '@/lib/bible-books';
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
  searchParams: Promise<QueryParams>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const bookInfo = getBookBySlug(params.book);
  const title = bookInfo ? `${bookInfo.name} ${params.chapter} — Bible Logos` : 'Bible Logos';
  return {
    title,
    description: bookInfo ? `Read ${bookInfo.name} ${params.chapter} in the available editions.` : undefined,
  };
}

export default async function ReaderPage(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const bookInfo = getBookBySlug(params.book);
  if (!bookInfo) notFound();

  const chapter = Number(params.chapter);
  if (!/^\d+$/.test(params.chapter) || !Number.isSafeInteger(chapter) || chapter < 0) notFound();

  // KJV alone by default: it is the translation with every word linked to the original languages.
  const extra = libraryBook(bookInfo.id);
  const requested = [...new Set(queryValue(searchParams.translations, extra?.defaultVersion || 'KJV').split(',').filter(Boolean))];
  const db = getDb();
  const available = getAvailableTranslations().sort(byTranslationOrder);
  const selectedTranslations = requested.filter(t => available.includes(t));
  const primary = selectedTranslations[0];
  const primaryChapters = primary ? editionChapters(primary, bookInfo.id) : [];
  const chapterLabel = primaryChapters.find(c => c.chapter === chapter)?.label ?? String(chapter);
  const chapterExists = db.prepare('SELECT 1 FROM verses WHERE book = ? AND chapter = ? LIMIT 1').get(bookInfo.id, chapter);
  if (!chapterExists) notFound();
  const native = selectedTranslations.some(t => getTranslation(t)?.nativeReferences);
  const references = new Map(queryValue(searchParams.chapters).split(',').flatMap(pair => {
    const [id, value] = pair.split(':');
    const n = Number(value);
    return value !== undefined && Number.isSafeInteger(n) && n >= 0 ? [[id, n] as const] : [];
  }));
  const editions = selectedTranslations.map((version, index) => {
    const editionChapter = index === 0 ? chapter : references.get(version) ?? chapter;
    return {
      version, chapter: editionChapter, chapters: editionChapters(version, bookInfo.id),
      notes: db.prepare('SELECT label, text FROM edition_notes WHERE translation = ? AND book = ? AND chapter = ?').all(version, bookInfo.id, editionChapter) as { label: string; text: string }[],
      passages: db.prepare('SELECT verse, text, native_label FROM verses WHERE translation = ? AND book = ? AND chapter = ? ORDER BY COALESCE(position, verse), verse').all(version, bookInfo.id, editionChapter) as { verse: number; text: string; native_label: string | null }[],
    };
  });
  const navigationBooks = primary ? editionBooks(primary) : [];
  const offered = available.filter(t => db.prepare('SELECT 1 FROM verses WHERE translation = ? AND book = ? LIMIT 1').get(t, bookInfo.id));


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

  const verseCount = editions[0]?.passages.length ?? 0;
  const words = verses.filter(v => v.translation === selectedTranslations[0]).reduce((n, v) => n + v.text.split(/\s+/).length, 0);
  const minutes = Math.max(1, Math.round(words / 200));

  // Previous/next chapter, crossing into neighbouring books
  const bookIdx = navigationBooks.findIndex(b => b.id === bookInfo.id);
  const prevBook = bookIdx > 0 ? navigationBooks[bookIdx - 1] : null;
  const nextBook = bookIdx >= 0 && bookIdx < navigationBooks.length - 1 ? navigationBooks[bookIdx + 1] : null;
  const slugOf = (name: string) => name.toLowerCase().replace(/ /g, '-');
  const chapterHref = (slug: string, target: number) => readerHref(slug, editions.map((e, i) => ({ version: e.version, chapter: i === 0 || slug !== params.book ? target : e.chapter })));
  const chapterIndex = primaryChapters.findIndex(c => c.chapter === chapter);
  const previousChapter = chapterIndex > 0 ? primaryChapters[chapterIndex - 1] : null;
  const nextChapter = chapterIndex >= 0 ? primaryChapters[chapterIndex + 1] : null;
  const prevChapters = prevBook && primary ? editionChapters(primary, prevBook.id) : [];
  const nextChapters = nextBook && primary ? editionChapters(primary, nextBook.id) : [];
  const prev = previousChapter
    ? { label: `${bookInfo.name} ${previousChapter.label}`, href: chapterHref(params.book, previousChapter.chapter) }
    : prevBook && prevChapters.length ? { label: `${prevBook.name} ${prevChapters.at(-1)!.label}`, href: chapterHref(slugOf(prevBook.name), prevChapters.at(-1)!.chapter) } : null;
  const next = nextChapter
    ? { label: `${bookInfo.name} ${nextChapter.label}`, href: chapterHref(params.book, nextChapter.chapter) }
    : nextBook && nextChapters.length ? { label: `${nextBook.name} ${nextChapters[0].label}`, href: chapterHref(slugOf(nextBook.name), nextChapters[0].chapter) } : null;

  const toggleHref = (t: string) => {
    const active = editions.some(e => e.version === t);
    const next = active ? editions.filter(e => e.version !== t) : [...editions, { version: t, chapter }];
    return readerHref(params.book, next.length ? next : editions);
  };

  const arrow = 'p-2 rounded-full text-parchment-500 hover:text-parchment-100 hover:bg-parchment-800/70 transition-colors';

  return (
    <main className="flex-1 px-4 py-6 lg:px-8 lg:py-10 max-w-6xl">
      {!!editions[0]?.passages.length && <ReadingTracker book={bookInfo.id} chapter={chapter} translation={primary} chapterLabel={chapterLabel} />}

      <header className="max-w-2xl mx-auto text-center mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-parchment-500">
          {bookInfo.testament === 'Library' ? 'Explore writings' : bookInfo.testament === 'OT' ? 'Old Testament' : 'New Testament'}
        </p>
        <div className="flex items-center justify-center gap-2 mt-1">
          {prev ? <Link href={prev.href} className={arrow} aria-label={`Previous: ${prev.label}`}><ChevronLeft size={20} /></Link> : <span className="w-9" />}
          <h1 className="font-serif text-3xl lg:text-4xl font-semibold text-parchment-50">
            <Link href={`/reader?book=${params.book}&translations=${selectedTranslations.join(',')}`} className="hover:text-gold-400 transition-colors" title="Choose a book or chapter">
              {bookInfo.name} <span className="text-gold-400">{chapterLabel}</span>
            </Link>
          </h1>
          {next ? <Link href={next.href} className={arrow} aria-label={`Next: ${next.label}`}><ChevronRight size={20} /></Link> : <span className="w-9" />}
        </div>
        <p className="mt-1 text-xs text-parchment-500">{verseCount} {primary === 'DID-HB' || primary === 'ENO-CHARLES' ? 'section' : 'verses'} · {minutes} min read</p>

        {/* Stays open while choosing, so several can be ticked in turn */}
        <details className="group relative mt-5 inline-block text-left">
          <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-parchment-900 text-xs font-medium text-parchment-200 hover:bg-parchment-800 transition-colors">
            {selectedTranslations.join(' · ')}
            <ChevronDown size={14} className="text-parchment-500 transition-transform group-open:rotate-180" />
            <span className="sr-only">Choose translations</span>
          </summary>
          <div className="absolute left-1/2 -translate-x-1/2 z-20 mt-2 w-[min(24rem,calc(100vw-2rem))] max-h-[60vh] overflow-y-auto p-1.5 rounded-xl bg-parchment-950 border border-parchment-800 shadow-xl">
            <p className="px-3 pt-2 pb-1 text-xs text-parchment-500">Choose one or more to read side by side.</p>
            {[...new Set([...selectedTranslations, ...offered])].map(t => {
              const active = selectedTranslations.includes(t);
              const info = getTranslation(t);
              return (
                <Link
                  key={t}
                  href={toggleHref(t)}
                  aria-current={active ? 'true' : undefined}
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
          {native ? 'Read and bookmark passages using each edition’s own references.' : <>Tap a verse for cross-references{tagged.length ? `, or a word in the ${tagged.join(' or ')} for its ${tagged.includes('KJV') ? 'Hebrew or Greek original' : 'Hebrew original'}` : ''}.</>}
        </p>
      </header>

      {extra && <aside className="max-w-3xl mx-auto mb-6 rounded-xl bg-parchment-900 p-4 space-y-3"><p className="text-sm text-parchment-300">{extra.introduction}</p><CollectionToggle id={extra.collection} /><Link href="/library" className="block text-sm text-gold-400">Explore this collection →</Link></aside>}
      {requested.some(t => !available.includes(t)) && <p role="status" className="mb-4 text-parchment-300">Some requested versions are unknown or not installed: {requested.filter(t => !available.includes(t)).join(', ')}. Choose an available version.</p>}
      {!selectedTranslations.length && <p className="text-parchment-300">The requested version is unavailable. Choose an available version above.</p>}
      {editions.some(e => !e.passages.length) && <p className="mb-4 text-parchment-300">This passage is unavailable in one or more selected versions. Choose an available chapter or version; your selection has been retained.</p>}
      {native ? <>
        {selectedTranslations.length > 1 && <p className="mb-4 text-sm text-parchment-400">Native references are shown independently. Matching chapter and verse numbers do not establish correspondence; a verified alignment is not yet available.</p>}
        <div className={`grid gap-6 items-start ${editions.length > 1 ? 'lg:grid-cols-2' : ''}`}>{editions.map(e => <EditionText key={e.version} version={e.version} book={bookInfo.id} name={bookInfo.name} slug={params.book} chapter={e.chapter} chapters={e.chapters} passages={e.passages} notes={e.notes} readerChapter={chapter} selections={editions.map(({ version, chapter }) => ({ version, chapter }))} />)}</div>
      </> : <VerseDisplay
        // The tagged tokens already carry the text; don't send it twice
        verses={verses.map(v => (tokens[v.translation]?.[v.verse] ? { ...v, text: '' } : v))}
        translations={selectedTranslations}
        tokens={tokens}
      />}

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
