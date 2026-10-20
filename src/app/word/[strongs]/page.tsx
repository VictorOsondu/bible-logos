import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { getDb } from '@/lib/db';
import { getBookById } from '@/lib/bible-books';
import WordRelationships from '@/components/WordRelationships';
import { getKjvRenderings, getOccurrences } from '@/lib/strongs';

const PAGE_SIZE = 100;

interface Props {
  params: { strongs: string };
  searchParams: { page?: string };
}

export default function WordPage({ params, searchParams }: Props) {
  const db = getDb();
  
  const entry = db.prepare('SELECT * FROM strongs WHERE id = ?').get(params.strongs) as any;
  
  if (!entry) {
    return (
      <>
        <Sidebar />
        <main className="flex-1 p-8">
          <h1 className="text-2xl text-parchment-100 font-serif">Strong&apos;s {params.strongs} not found</h1>
          <p className="text-parchment-500 mt-2">Check the number, or search the <Link href="/concordance" className="text-gold-400 hover:text-gold-300">concordance</Link>.</p>
          <Link href="/" className="text-gold-400 mt-4 inline-block hover:text-gold-300">← Back to home</Link>
        </main>
      </>
    );
  }

  const page = Math.max(parseInt(searchParams.page || '1') || 1, 1);
  const { totalWords, totalVerses, occurrences } = getOccurrences(db, params.strongs, {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const pages = Math.ceil(totalVerses / PAGE_SIZE);
  const renderings = getKjvRenderings(db, params.strongs, 30);

  // Neighbouring entries for browsing
  const prefix = params.strongs[0];
  const num = parseInt(params.strongs.slice(1));
  const neighbour = (dir: 1 | -1) => db.prepare(`
    SELECT id, transliteration FROM strongs
    WHERE id LIKE ? AND CAST(SUBSTR(id, 2) AS INTEGER) ${dir === 1 ? '>' : '<'} ?
    ORDER BY CAST(SUBSTR(id, 2) AS INTEGER) ${dir === 1 ? 'ASC' : 'DESC'} LIMIT 1
  `).get(`${prefix}%`, num) as { id: string; transliteration: string } | undefined;
  const prev = neighbour(-1);
  const next = neighbour(1);

  return (
    <>
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 max-w-5xl">
        <div className="flex items-center gap-2 text-sm text-parchment-500 mb-6">
          <Link href="/" className="hover:text-gold-400">Home</Link>
          <span>/</span>
          <span className="text-gold-400">Strong&apos;s Concordance</span>
        </div>

        {/* Main Entry */}
        <div className="bg-parchment-900 border border-parchment-800 rounded-2xl p-8 mb-8 text-center">
          <div className="text-6xl mb-4 font-serif">{entry.original}</div>
          <h1 className="text-2xl font-bold text-gold-400 mb-1">{entry.transliteration}</h1>
          {entry.pronunciation && <p className="text-sm text-parchment-400 italic mb-1">{entry.pronunciation}</p>}
          <p className="text-sm text-parchment-500 mb-4">
            {entry.id} · {entry.language === 'hebrew' ? '🕎 Hebrew (Old Testament)' : '🏛️ Greek (New Testament)'}
          </p>
          <p className="text-lg text-parchment-200 max-w-2xl mx-auto leading-relaxed font-serif">
            {entry.definition}
          </p>
          {entry.derivation && <p className="text-sm text-parchment-500 mt-3">{entry.derivation}</p>}
          {entry.kjv_usage && (
            <p className="text-sm text-parchment-400 mt-2"><span className="text-parchment-500">KJV usage:</span> {entry.kjv_usage}</p>
          )}
        </div>

        {renderings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-parchment-200 mb-4">Translated in the KJV as</h2>
            <div className="flex flex-wrap gap-2">
              {renderings.map(r => (
                <span key={r.word} className="text-sm px-3 py-1 rounded-full bg-parchment-900 border border-parchment-800 text-parchment-300">
                  {r.word} <span className="text-parchment-500">{r.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Occurrences */}
        {occurrences.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-parchment-200 mb-4">
              {totalWords} occurrences in {totalVerses} verses
              {pages > 1 && <span className="text-sm text-parchment-500 font-normal"> · page {page} of {pages}</span>}
            </h2>
            <div className="space-y-2">
              {occurrences.map((o: any, i: number) => {
                const bookInfo = getBookById(o.book);
                const slug = bookInfo?.name.toLowerCase().replace(/ /g, '-');
                return (
                  <Link
                    key={i}
                    href={`/reader/${slug}/${o.chapter}#v${o.verse}`}
                    className="block p-4 rounded-xl bg-parchment-900 border border-parchment-800 hover:border-gold-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-semibold text-gold-400">
                        {bookInfo?.name} {o.chapter}:{o.verse}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-parchment-800 text-parchment-400">
                        &ldquo;{o.word}&rdquo;
                      </span>
                    </div>
                    <p className="text-sm text-parchment-300 font-serif line-clamp-2">{o.text}</p>
                  </Link>
                );
              })}
            </div>
            {pages > 1 && (
              <div className="flex justify-between mt-4 text-sm">
                {page > 1 ? <Link href={`/word/${entry.id}?page=${page - 1}`} className="text-gold-400 hover:text-gold-300">← Previous {PAGE_SIZE}</Link> : <span />}
                {page < pages && <Link href={`/word/${entry.id}?page=${page + 1}`} className="text-gold-400 hover:text-gold-300">Next {PAGE_SIZE} →</Link>}
              </div>
            )}
          </div>
        )}

        {/* Word Relationships */}
        <div className="mb-8">
          <WordRelationships strongsId={params.strongs} />
        </div>

        {/* Browse neighbouring entries */}
        <div className="flex justify-between text-sm">
          {prev ? <Link href={`/word/${prev.id}`} className="text-gold-400 hover:text-gold-300">← {prev.id} {prev.transliteration}</Link> : <span />}
          <Link href="/concordance" className="text-parchment-400 hover:text-gold-400">Browse concordance</Link>
          {next ? <Link href={`/word/${next.id}`} className="text-gold-400 hover:text-gold-300">{next.id} {next.transliteration} →</Link> : <span />}
        </div>
      </main>
    </>
  );
}
