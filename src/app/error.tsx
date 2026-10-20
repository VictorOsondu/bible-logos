'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => console.error(error), [error]);

  return (
    <main className="flex-1 px-4 py-16 lg:px-8 max-w-2xl text-center">
      <h1 className="font-serif text-3xl font-semibold text-parchment-50 mb-3">Something went wrong</h1>
      <p className="text-parchment-400 mb-2">This page could not be loaded. Please try again.</p>
      {error.digest && <p className="text-xs text-parchment-500 mb-8">Reference: {error.digest}</p>}
      <div className="flex gap-3 justify-center">
        <button onClick={reset} className="px-5 py-2.5 rounded-xl bg-gold-600 text-parchment-950 text-sm font-medium hover:opacity-90">
          Try again
        </button>
        <Link href="/" className="px-5 py-2.5 rounded-xl border border-parchment-800 text-parchment-200 text-sm hover:bg-parchment-900">
          Home
        </Link>
      </div>
    </main>
  );
}
