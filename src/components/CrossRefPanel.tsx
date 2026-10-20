'use client';

import { useJson } from '@/lib/useJson';
import LoadError from './LoadError';
import Link from 'next/link';
import { getBookById } from '@/lib/bible-books';

interface CrossRef {
  book: number;
  chapter: number;
  verse_start: number;
  verse_end: number;
  votes: number;
  text: string;
}

export default function CrossRefPanel({ book, chapter, verse }: { book: number; chapter: number; verse: number }) {
  const { data, loading, error, retry } = useJson<{ from: CrossRef[]; to: CrossRef[] }>(
    `/api/crossrefs?book=${book}&chapter=${chapter}&verse=${verse}`
  );

  if (loading) return <div className="text-parchment-500 text-sm animate-pulse">Loading cross-references…</div>;
  if (error) return <LoadError what="cross-references" onRetry={retry} />;
  const fromRefs = data?.from ?? [];
  const toRefs = data?.to ?? [];

  const total = fromRefs.length + toRefs.length;
  if (total === 0) return <div className="text-parchment-500 text-sm">No cross-references found.</div>;

  const renderRef = (ref: CrossRef, direction: string) => {
    const bookInfo = getBookById(ref.book);
    const label = `${bookInfo?.name || `Book ${ref.book}`} ${ref.chapter}:${ref.verse_start}${ref.verse_end !== ref.verse_start ? `-${ref.verse_end}` : ''}`;
    
    return (
      <Link
        key={`${direction}-${ref.book}-${ref.chapter}-${ref.verse_start}`}
        href={`/reader/${bookInfo?.name.toLowerCase().replace(/ /g, '-') || ref.book}/${ref.chapter}#v${ref.verse_start}`}
        className="block p-2 rounded-sm hover:bg-parchment-800 transition-colors group"
      >
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-gold-400 group-hover:text-gold-300">{label}</span>
        </div>
        {ref.text && (
          <p className="text-xs text-parchment-400 line-clamp-2 font-serif">{ref.text}</p>
        )}
      </Link>
    );
  };

  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
      <p className="text-xs text-parchment-500">{total} cross-reference{total !== 1 ? 's' : ''} found</p>
      
      {fromRefs.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-parchment-400 uppercase tracking-wider mb-1">References from this verse →</h4>
          <div className="space-y-1">{fromRefs.map(r => renderRef(r, 'from'))}</div>
        </div>
      )}
      
      {toRefs.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-parchment-400 uppercase tracking-wider mb-1">← References to this verse</h4>
          <div className="space-y-1">{toRefs.map(r => renderRef(r, 'to'))}</div>
        </div>
      )}
    </div>
  );
}
