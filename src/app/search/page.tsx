import Link from 'next/link';
import { queryValue, boundedInteger, type QueryParams } from '@/lib/query-params';
import { toFtsQuery, normalizeSearchText } from '@/lib/search';
import { getBookById } from '@/lib/bible-books';
import { COLLECTIONS, LIBRARY_BOOKS, slugOf } from '@/lib/text-library';
import { getAvailableTranslations, getDb } from '@/lib/db';
import { getTranslation } from '@/lib/translations';
import LibrarySearchForm from '@/components/LibrarySearchForm';
export const dynamic = 'force-dynamic';

interface VerseResult { book: number; chapter: number; verse: number; text: string; translation: string; native_label: string | null; chapter_label: string | null }
export default async function SearchPage({ searchParams }: { searchParams: Promise<QueryParams> }) {
  const rawParams = await searchParams;
  const params = Object.fromEntries(Object.entries(rawParams).map(([key, value]) => [key, queryValue(value)]));
  const scope = ['bible', 'enabled', 'all'].includes(params.scope ?? '') ? params.scope! : 'bible';
  const q = (params.q ?? '').slice(0, 1000);
  const translation = params.translation ?? (scope === 'bible' ? 'KJV' : 'ALL');
  const enabled = (params.collections ?? '').split(',').filter(c => COLLECTIONS.some(x => x.id === c));
  const extraIds = LIBRARY_BOOKS.filter(b => enabled.includes(b.collection)).map(b => b.id);
  const limit = 50;
  let offset = boundedInteger(params.offset, 0, 0, 1_000_000);
  const raw = toFtsQuery(q);
  const normalized = toFtsQuery(normalizeSearchText(q));
  const db = getDb();
  const conditions = ['v.id IN (SELECT rowid FROM verses_fts WHERE text MATCH ? UNION SELECT rowid FROM library_fts WHERE text MATCH ?)'];
  const values: (string | number)[] = [raw ?? '', normalized ?? ''];
  if (translation !== 'ALL') { conditions.push('v.translation = ?'); values.push(translation); }
  if (scope === 'bible') conditions.push('v.book BETWEEN 1 AND 66');
  if (scope === 'enabled') { conditions.push(`(v.book BETWEEN 1 AND 66${extraIds.length ? ` OR v.book IN (${extraIds.map(() => '?').join(',')})` : ''})`); values.push(...extraIds); }
  if (params.testament === 'OT') conditions.push('v.book BETWEEN 1 AND 39');
  if (params.testament === 'NT') conditions.push('v.book BETWEEN 40 AND 66');
  const book = Number(params.book);
  if (Number.isInteger(book) && book > 0) { conditions.push('v.book = ?'); values.push(book); }
  const where = conditions.join(' AND ');
  let results: VerseResult[] = [];
  let total = 0;
  if (raw && normalized) {
    total = (db.prepare(`SELECT COUNT(*) AS n FROM verses v WHERE ${where}`).get(...values) as { n: number }).n;
    offset = total > 0 ? Math.min(offset, Math.floor((total - 1) / limit) * limit) : 0;
    results = db.prepare(`SELECT v.*, (SELECT label FROM edition_chapters c WHERE c.translation = v.translation AND c.book = v.book AND c.chapter = v.chapter) AS chapter_label FROM verses v WHERE ${where} ORDER BY v.book, v.chapter, COALESCE(v.position, v.verse), v.translation LIMIT ? OFFSET ?`).all(...values, limit, offset) as VerseResult[];
  }
  const pageHref = (start: number) => `/search?${new URLSearchParams({ ...params, q, scope, translation, offset: String(start) } as Record<string, string>)}`;
  return <main className="flex-1 p-4 lg:p-8 max-w-5xl">
    <h1 className="text-3xl font-semibold font-serif text-parchment-50 mb-4">Search</h1>
    <LibrarySearchForm key={JSON.stringify(params)} collections={Object.hasOwn(params, 'collections') ? enabled : undefined} q={q} scope={scope} version={translation} testament={params.testament} available={getAvailableTranslations()} />
    {q && <p className="mt-4 text-sm text-parchment-400">{total} results for “{q}”.</p>}
    <p className="my-4 text-sm text-parchment-400">Scope: {scope === 'all' ? 'All library' : scope === 'enabled' ? 'Bible + enabled collections' : 'Bible (66-book collection)'}.</p>
    {scope === 'enabled' && !enabled.length && <p className="mb-4 text-sm text-parchment-400">No additional collections are included in this search. Enable collections in <Link className="text-gold-400" href="/library">Explore writings</Link>, then search again.</p>}
    <div className="space-y-2">{results.map(v => {
      const book = getBookById(v.book);
      const version = getTranslation(v.translation);
      if (!book) return null;
      return <Link key={`${v.translation}-${v.book}-${v.chapter}-${v.verse}`} href={`/reader/${slugOf(book)}/${v.chapter}?translations=${v.translation}#v${v.verse}`} className="block p-4 rounded-xl bg-parchment-900/70 hover:bg-parchment-900">
        <p className="text-sm text-gold-400 mb-1">{book.name} {v.chapter_label ?? v.chapter}{v.native_label === 'section' ? '' : `:${v.native_label ?? v.verse}`} <bdi className="text-xs text-parchment-400">{v.translation}{book.testament === 'Library' ? ' · Explore writings' : ''}</bdi></p>
        <p lang={version?.language ?? 'en'} dir={version?.direction ?? 'ltr'} className="text-sm text-parchment-300 font-serif">{v.text}</p>
      </Link>;
    })}</div>
    {total > limit && <nav className="flex gap-4 justify-center mt-6 text-sm text-gold-400" aria-label="Search pages">{offset > 0 && <Link href={pageHref(Math.max(0, offset - limit))}>← Previous</Link>}<span>{offset + 1}–{Math.min(offset + limit, total)} of {total}</span>{offset + limit < total && <Link href={pageHref(offset + limit)}>Next →</Link>}</nav>}
  </main>;
}
