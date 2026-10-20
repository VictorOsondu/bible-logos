import Link from 'next/link';
import { toFtsQuery } from '@/lib/search';
import { getBookById } from '@/lib/bible-books';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<SearchQuery>;
}

interface SearchQuery {
  q?: string;
  book?: string;
  testament?: string;
  translation?: string;
  offset?: string;
}

interface VerseResult {
  book: number;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}

async function searchVerses(params: SearchQuery): Promise<{ results: VerseResult[]; total: number; limit?: number; offset?: number }> {
  const match = toFtsQuery(params.q || '');
  if (!match) return { results: [], total: 0 };
  
  // Use internal API — this runs server-side
  const { getDb } = await import('@/lib/db');
  const db = getDb();
  
  const translation = params.translation || 'KJV';
  const limit = 50;
  const offset = Math.max(parseInt(params.offset || '0') || 0, 0);
  const book = parseInt(params.book || '') || null;
  
  let query = `
    SELECT v.book, v.chapter, v.verse, v.text, v.translation
    FROM verses_fts fts
    JOIN verses v ON v.id = fts.rowid
    WHERE fts.text MATCH ? AND v.translation = ?
  `;
  const queryParams: (string | number)[] = [match, translation];

  if (book) {
    query += ' AND v.book = ?';
    queryParams.push(book);
  }
  if (params.testament === 'OT') query += ' AND v.book <= 39';
  if (params.testament === 'NT') query += ' AND v.book >= 40';
  
  query += ' ORDER BY v.book, v.chapter, v.verse LIMIT ? OFFSET ?';
  queryParams.push(limit, offset);
  
  try {
    const results = db.prepare(query).all(...queryParams) as VerseResult[];
    
    let countQuery = `SELECT COUNT(*) as total FROM verses_fts fts JOIN verses v ON v.id = fts.rowid WHERE fts.text MATCH ? AND v.translation = ?`;
    const countParams: (string | number)[] = [match, translation];
    if (book) { countQuery += ' AND v.book = ?'; countParams.push(book); }
    if (params.testament === 'OT') countQuery += ' AND v.book <= 39';
    if (params.testament === 'NT') countQuery += ' AND v.book >= 40';
    
    const total = (db.prepare(countQuery).get(...countParams) as { total: number }).total;
    return { results, total, limit, offset };
  } catch (error) {
    console.error('Search failed:', error);
    return { results: [], total: 0, limit, offset };
  }
}

export default async function SearchPage(props: Props) {
  const searchParams = await props.searchParams;
  const data = await searchVerses(searchParams);
  const q = searchParams.q || '';
  const currentOffset = Math.max(parseInt(searchParams.offset || '0') || 0, 0);
  const pageHref = (offset: number) => `/search?${new URLSearchParams({
    q,
    offset: String(offset),
    testament: searchParams.testament || '',
    translation: searchParams.translation || 'KJV',
    ...(searchParams.book ? { book: searchParams.book } : {}),
  })}`;

  return (
    <>
      <main className="flex-1 p-4 lg:p-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold font-serif text-parchment-50 mb-4">Search</h1>
          
          <form className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text" name="q" defaultValue={q}
                placeholder="Search the Bible…"
                className="w-full px-4 py-3 rounded-xl bg-parchment-900/70 text-parchment-100 placeholder-parchment-600 focus:outline-hidden focus:ring-2 focus:ring-gold-500/50 font-serif"
              />
            </div>
            <div>
              <select name="testament"
                className="bg-parchment-800 text-parchment-200 rounded-lg px-3 py-3 text-sm border border-parchment-700">
                <option value="" selected={(searchParams.testament || '') === ''}>All</option>
                <option value="OT" selected={searchParams.testament === 'OT'}>Old Testament</option>
                <option value="NT" selected={searchParams.testament === 'NT'}>New Testament</option>
              </select>
            </div>
            <div>
              <select name="translation"
                className="bg-parchment-800 text-parchment-200 rounded-lg px-3 py-3 text-sm border border-parchment-700">
                <option value="KJV" selected={!searchParams.translation || searchParams.translation === 'KJV'}>KJV</option>
                <option value="ASV" selected={searchParams.translation === 'ASV'}>ASV</option>
                <option value="BBE" selected={searchParams.translation === 'BBE'}>BBE</option>
                <option value="YLT" selected={searchParams.translation === 'YLT'}>YLT</option>
              </select>
            </div>
            <button type="submit" className="px-6 py-3 bg-gold-600 text-parchment-950 rounded-xl font-semibold hover:bg-gold-500 transition-colors">
              Search
            </button>
          </form>
        </div>

        {q && (
          <p className="text-sm text-parchment-500 mb-4">
            {data.total} result{data.total !== 1 ? 's' : ''} for &ldquo;<span className="text-gold-400">{q}</span>&rdquo;
          </p>
        )}

        <div className="space-y-2">
          {data.results.map((v, i) => {
            const bookInfo = getBookById(v.book);
            const slug = bookInfo?.name.toLowerCase().replace(/ /g, '-');
            return (
              <Link
                key={i}
                href={`/reader/${slug}/${v.chapter}#v${v.verse}`}
                className="block p-4 rounded-xl bg-parchment-900/70 hover:bg-parchment-900 transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gold-400">{bookInfo?.name} {v.chapter}:{v.verse}</span>
                  <span className="text-xs text-parchment-600 font-mono">{v.translation}</span>
                </div>
                <p className="text-sm text-parchment-300 font-serif">{v.text}</p>
              </Link>
            );
          })}
        </div>

        {/* Pagination */}
        {data.total > 50 && (
          <div className="flex gap-2 mt-6 justify-center">
            {currentOffset > 0 && (
              <Link href={pageHref(currentOffset - 50)}
                className="px-4 py-2 rounded-lg bg-parchment-800 text-gold-400 hover:bg-parchment-700 text-sm">
                ← Previous
              </Link>
            )}
            <span className="px-4 py-2 text-sm text-parchment-500">
              {currentOffset + 1}–{Math.min(currentOffset + 50, data.total)} of {data.total}
            </span>
            {currentOffset + 50 < data.total && (
              <Link href={pageHref(currentOffset + 50)}
                className="px-4 py-2 rounded-lg bg-parchment-800 text-gold-400 hover:bg-parchment-700 text-sm">
                Next →
              </Link>
            )}
          </div>
        )}
      </main>
    </>
  );
}
