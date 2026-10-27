'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSubThemes, MAIN_THEMES } from '@/lib/theme-studies';

export default function ThemeExplorer() {
  const [query, setQuery] = useState('');
  const matching = MAIN_THEMES.filter(theme =>
    [theme, ...getSubThemes(theme.slug)].some(study =>
      `${study.title} ${study.overview}`.toLowerCase().includes(query.trim().toLowerCase())));

  return (
    <div>
      <label className="block text-sm text-parchment-300 mb-6">
        Find a theme
        <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search themes and sub-themes…"
          className="mt-2 w-full rounded-lg border border-parchment-700 bg-parchment-900 p-3 text-parchment-100" />
      </label>
      <p role="status" className="text-xs text-parchment-500 mb-4">{matching.length} {matching.length === 1 ? 'theme' : 'themes'}</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {matching.map(theme => (
            <section key={theme.slug} className="rounded-xl border border-parchment-800 p-5">
              <h2 className="font-serif text-xl text-parchment-100">
                <Link href={`/themes/${theme.slug}`} className="hover:text-gold-400">{theme.title}</Link>
              </h2>
              {theme.overview ? <p className="text-sm text-parchment-400 leading-relaxed mt-2">{theme.overview}</p>
                : <p className="text-sm text-parchment-500 mt-2">Study content to follow.</p>}
              <Link href={`/themes/${theme.slug}`} className="inline-block text-xs text-gold-400 mt-5 hover:underline">Explore theme →</Link>
            </section>
        ))}
      </div>
      {matching.length === 0 && <p className="rounded-xl border border-parchment-800 p-6 text-parchment-400">No themes match. Try another theme or sub-theme.</p>}
    </div>
  );
}
