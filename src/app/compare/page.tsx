import { queryValue, type QueryParams } from '@/lib/query-params';
import { notFound } from 'next/navigation';
import { byTranslationOrder, getTranslation } from '@/lib/translations';
import { getDb } from '@/lib/db';
import { getBookById, BIBLE_BOOKS } from '@/lib/bible-books';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<QueryParams>;
}

function diffWords(texts: string[]): { text: string; isDiff: boolean }[][] {
  if (texts.length < 2) return texts.map(t => [{ text: t, isDiff: false }]);
  
  const wordArrays = texts.map(t => t.split(/\s+/));
  const baseWords = wordArrays[0].map(w => w.toLowerCase().replace(/[^a-z]/g, ''));
  
  return wordArrays.map((words, ti) => {
    if (ti === 0) return words.map(w => ({ text: w + ' ', isDiff: false }));
    return words.map(w => {
      const clean = w.toLowerCase().replace(/[^a-z]/g, '');
      const isDiff = !baseWords.includes(clean);
      return { text: w + ' ', isDiff };
    });
  });
}

export default async function ComparePage(props: Props) {
  const searchParams = await props.searchParams;
  const number = (key: string, fallback: number) => {
    const raw = queryValue(searchParams[key], String(fallback));
    const n = Number(raw);
    if (!/^\d+$/.test(raw) || !Number.isSafeInteger(n) || n < 0) notFound();
    return n;
  };
  const bookId = number('book', 43);
  const chapter = number('chapter', 3);
  const verse = number('verse', 16);

  const bookInfo = getBookById(bookId);
  if (!bookInfo) notFound();
  
  const db = getDb();
  const verses = db.prepare(`
    SELECT translation, text FROM verses
    WHERE book = ? AND chapter = ? AND verse = ?
  `).all(bookId, chapter, verse) as { translation: string; text: string }[];
  verses.sort((a, b) => byTranslationOrder(a.translation, b.translation));
  
  const nativeEditions = (db.prepare('SELECT translation, MIN(chapter) AS firstChapter FROM edition_chapters WHERE book = ? GROUP BY translation').all(bookId) as { translation: string; firstChapter: number }[]).filter(v => getTranslation(v.translation)?.nativeReferences);
  const alignedVerses = verses.filter(v => !getTranslation(v.translation)?.nativeReferences);
  const texts = alignedVerses.map(v => v.text);
  const diffs = diffWords(texts);
  
  // Navigation helpers
  const maxVerse = (db.prepare(
    'SELECT MAX(verse) as m FROM verses WHERE book = ? AND chapter = ? AND translation = ?'
  ).get(bookId, chapter, 'KJV') as { m: number | null } | undefined)?.m || 1;

  return (
    <>
      <main className="flex-1 p-4 lg:p-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold font-serif text-parchment-50 mb-4">
            Compare Translations
          </h1>
        </div>

        {/* Verse Selector */}
        <div className="bg-parchment-900/70 rounded-xl p-4 mb-6">
          <form className="flex flex-wrap gap-3 items-end">
            <div>
              <label htmlFor="compare-book" className="text-xs text-parchment-500 block mb-1">Book</label>
              <select
                id="compare-book" name="book"
                defaultValue={bookId}
                className="bg-parchment-800 text-parchment-200 rounded-lg px-3 py-2 text-sm border border-parchment-700 focus:border-gold-500 focus:outline-hidden"
              >
                {[...BIBLE_BOOKS, ...(bookInfo.testament === 'Library' ? [bookInfo] : [])].map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="compare-chapter" className="text-xs text-parchment-500 block mb-1">Chapter</label>
              <input id="compare-chapter" type="number" name="chapter" defaultValue={chapter} min={1} max={bookInfo?.chapters || 150}
                className="bg-parchment-800 text-parchment-200 rounded-lg px-3 py-2 text-sm border border-parchment-700 w-20 focus:border-gold-500 focus:outline-hidden" />
            </div>
            <div>
              <label htmlFor="compare-verse" className="text-xs text-parchment-500 block mb-1">Verse</label>
              <input id="compare-verse" type="number" name="verse" defaultValue={verse} min={1}
                className="bg-parchment-800 text-parchment-200 rounded-lg px-3 py-2 text-sm border border-parchment-700 w-20 focus:border-gold-500 focus:outline-hidden" />
            </div>
            <button type="submit" className="px-4 py-2 bg-gold-600 text-parchment-950 rounded-lg font-semibold hover:bg-gold-500 transition-colors text-sm">
              Compare
            </button>
          </form>
        </div>

        {/* Reference */}
        <h2 className="text-xl font-serif text-gold-400 mb-4">
          {bookInfo?.name} {chapter}:{verse}
        </h2>

        {!verses.length && <p role="status" className="mb-4 text-parchment-300">No text is available at this reference. Choose another book, chapter or verse.</p>}
        {/* Comparison Grid */}
        <div className="space-y-4">
          {alignedVerses.map((v, i) => (
            <div key={v.translation} className="bg-parchment-900/70 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-semibold tracking-wider text-parchment-500">
                  {v.translation}
                </span>
                <span className="text-xs text-parchment-500">{getTranslation(v.translation)?.name}</span>
              </div>
              <p className="bible-text text-parchment-100 text-lg leading-relaxed">
                {diffs[i]?.map((part, j) => (
                  <span key={j} className={part.isDiff ? 'diff-highlight' : ''}>
                    {part.text}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>

        {nativeEditions.length > 0 && <section className="mt-6 space-y-3"><h2 className="font-serif text-xl text-parchment-100">Read editions with native references</h2><p className="text-sm text-parchment-400">These editions use their own references. A verified passage alignment is not yet available, so identical reference numbers are not treated as corresponding verses.</p>{nativeEditions.map(v => <Link key={v.translation} href={`/reader/${bookInfo?.name.toLowerCase().replace(/ /g, '-')}/${db.prepare('SELECT 1 FROM edition_chapters WHERE book = ? AND translation = ? AND chapter = ?').get(bookId, v.translation, chapter) ? chapter : v.firstChapter}?translations=${v.translation}`} className="block text-gold-400">{getTranslation(v.translation)?.name} →</Link>)}</section>}
        {/* Nav */}
        <div className="flex justify-between mt-6">
          {verse > 1 && (
            <Link href={`/compare?book=${bookId}&chapter=${chapter}&verse=${verse - 1}`} className="text-sm text-gold-400 hover:text-gold-300">
              ← Verse {verse - 1}
            </Link>
          )}
          <div />
          {verse < maxVerse && (
            <Link href={`/compare?book=${bookId}&chapter=${chapter}&verse=${verse + 1}`} className="text-sm text-gold-400 hover:text-gold-300">
              Verse {verse + 1} →
            </Link>
          )}
        </div>
      </main>
    </>
  );
}
