'use client';

import { useJson } from '@/lib/useJson';
import LoadError from './LoadError';
import Link from 'next/link';
import { getBookById } from '@/lib/bible-books';

interface StrongsEntry {
  id: string;
  original: string;
  transliteration: string;
  pronunciation: string | null;
  definition: string;
  kjv_usage: string | null;
  derivation: string | null;
  language: string;
}

interface Occurrence {
  book: number;
  chapter: number;
  verse: number;
  word: string;
  text: string;
}

interface WordData {
  entry: StrongsEntry;
  renderings: { word: string; count: number }[];
  totalWords: number;
  totalVerses: number;
  occurrences: Occurrence[];
}

export default function StrongsPanel({ strongsId }: { strongsId: string }) {
  const { data, loading, error, retry } = useJson<WordData>(`/api/word?strongs=${encodeURIComponent(strongsId)}&limit=50`);

  if (loading) return <div className="text-parchment-500 text-sm animate-pulse">Loading…</div>;
  if (error) return <LoadError what="this word" onRetry={retry} />;
  if (!data?.entry) return <div className="text-parchment-500 text-sm">Strong&apos;s entry not found.</div>;
  const { entry, renderings, totalWords, totalVerses, occurrences } = data;

  return (
    <div className="space-y-4">
      <Link href={`/word/${strongsId}`} className="block hover:opacity-80 transition-opacity">
        <div className="text-center p-4 bg-parchment-800 rounded-lg">
          <div className="text-3xl mb-2 font-serif">{entry.original}</div>
          <div className="text-gold-400 font-semibold">{entry.transliteration}</div>
          {entry.pronunciation && <div className="text-xs text-parchment-400 italic">{entry.pronunciation}</div>}
          <div className="text-xs text-parchment-500 mt-1">
            {strongsId} · {entry.language === 'hebrew' ? 'Hebrew (OT)' : 'Greek (NT)'}
          </div>
        </div>
      </Link>

      <div>
        <h4 className="text-xs font-semibold text-parchment-400 uppercase tracking-wider mb-2">Definition</h4>
        <p className="text-sm text-parchment-200 leading-relaxed">{entry.definition}</p>
        {entry.derivation && <p className="text-xs text-parchment-500 mt-2">{entry.derivation}</p>}
      </div>

      {renderings.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-parchment-400 uppercase tracking-wider mb-2">Translated in the KJV as</h4>
          <div className="flex flex-wrap gap-1">
            {renderings.map(r => (
              <span key={r.word} className="text-xs px-2 py-0.5 rounded-full bg-parchment-800 text-parchment-300">
                {r.word} <span className="text-parchment-500">{r.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {occurrences.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-parchment-400 uppercase tracking-wider mb-2">
            {totalWords} occurrences in {totalVerses} verses
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {occurrences.map((o, i) => {
              const bookInfo = getBookById(o.book);
              return (
                <Link
                  key={i}
                  href={`/reader/${bookInfo?.name.toLowerCase().replace(/ /g, '-')}/${o.chapter}#v${o.verse}`}
                  className="block p-2 rounded hover:bg-parchment-800 transition-colors text-xs"
                >
                  <span className="text-gold-400">{bookInfo?.name} {o.chapter}:{o.verse}</span>
                  <span className="text-parchment-500 ml-2">&quot;{o.word}&quot;</span>
                </Link>
              );
            })}
          </div>
          {totalVerses > occurrences.length && (
            <Link href={`/word/${strongsId}`} className="block text-xs text-gold-400 hover:text-gold-300 mt-2">
              See all {totalVerses} verses →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
