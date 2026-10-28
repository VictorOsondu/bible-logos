'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getBookById } from '@/lib/bible-books';
import { useHistory } from '@/lib/reading';
import { useIsClient } from '@/lib/storage';

/** The reader's last chapter, or a starting point on a first visit. */
export default function ContinueReading() {
  const isClient = useIsClient(); // history lives in the browser, so wait until it can be read
  const last = useHistory()[0];

  const book = last ? getBookById(last.book) : undefined;
  const href = book ? `/reader/${book.name.toLowerCase().replace(/ /g, '-')}/${last!.chapter}?translations=${last!.translation ?? 'KJV'}` : '/reader/genesis/1';

  return (
    <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2">
      <Link
        href={href}
        className={`group flex items-center justify-between gap-3 px-5 py-4 rounded-xl bg-gold-600 text-parchment-950 hover:opacity-90 transition-opacity ${isClient ? '' : 'invisible'}`}
      >
        <span>
          <span className="block text-xs font-medium opacity-80">{book ? 'Continue reading' : 'Start reading'}</span>
          <span className="block font-serif text-lg font-semibold">{book ? `${book.name} ${last!.chapterLabel ?? last!.chapter}` : 'Genesis 1'}</span>
        </span>
        <ArrowRight size={20} className="transition-transform group-hover:translate-x-0.5" />
      </Link>
      <Link href="/reader/genesis/1" className="flex items-center justify-center px-5 py-3 rounded-xl border border-parchment-800 text-sm text-parchment-200 hover:bg-parchment-900 transition-colors">
        Old Testament
      </Link>
      <Link href="/reader/matthew/1" className="flex items-center justify-center px-5 py-3 rounded-xl border border-parchment-800 text-sm text-parchment-200 hover:bg-parchment-900 transition-colors">
        New Testament
      </Link>
    </div>
  );
}
