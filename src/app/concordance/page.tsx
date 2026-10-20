import Link from 'next/link';
import { getDb, isDatabaseAvailable } from '@/lib/db';
import { searchStrongs } from '@/lib/strongs';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 60;

interface Props {
  searchParams: { q?: string; language?: string; page?: string };
}

export default function ConcordancePage({ searchParams }: Props) {
  if (!isDatabaseAvailable()) {
    return (
      <>
        <main className="flex-1 p-4 lg:p-8 max-w-5xl">
          <p className="text-parchment-400">Database not available. Run <code>npm run seed</code>.</p>
        </main>
      </>
    );
  }

  const q = searchParams.q || '';
  const language = searchParams.language === 'hebrew' || searchParams.language === 'greek' ? searchParams.language : '';
  const page = Math.max(parseInt(searchParams.page || '1') || 1, 1);
  const { total, entries } = searchStrongs(getDb(), {
    q,
    language: language || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const pages = Math.ceil(total / PAGE_SIZE);

  const href = (overrides: Partial<{ q: string; language: string; page: number }>) => {
    const params = new URLSearchParams();
    const next = { q, language, page, ...overrides };
    if (next.q) params.set('q', next.q);
    if (next.language) params.set('language', next.language);
    if (next.page > 1) params.set('page', String(next.page));
    const s = params.toString();
    return `/concordance${s ? `?${s}` : ''}`;
  };

  const tabs = [
    { value: '', label: 'All' },
    { value: 'hebrew', label: 'Hebrew' },
    { value: 'greek', label: 'Greek' },
  ];

  return (
    <>
      <main className="flex-1 p-4 lg:p-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold font-serif text-parchment-50 mb-2">
            Strong&apos;s Concordance
          </h1>
          <p className="text-parchment-400 text-sm">
            Search every Hebrew and Greek word in Strong&apos;s lexicon by number (e.g. G26), transliteration
            (e.g. agape, chesed), original script or English meaning.
          </p>
        </div>

        <form action="/concordance" className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search Strong's: love, H2617, logos…"
            className="flex-1 px-4 py-2 rounded-lg bg-parchment-900/70 text-parchment-100 placeholder-parchment-600 focus:outline-none focus:border-gold-500/50"
          />
          {language && <input type="hidden" name="language" value={language} />}
          <button type="submit" className="px-4 py-2 rounded-lg bg-gold-600/20 border border-gold-500/40 text-gold-400 hover:bg-gold-600/30">
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
          {tabs.map(t => (
            <Link
              key={t.value}
              href={href({ language: t.value, page: 1 })}
              className={`px-3 py-1 rounded-full border transition-colors ${
                language === t.value
                  ? 'bg-gold-600/20 border-gold-500/50 text-gold-400'
                  : 'border-parchment-800 text-parchment-400 hover:text-gold-400'
              }`}
            >
              {t.label}
            </Link>
          ))}
          <span className="text-parchment-500 ml-auto">{total.toLocaleString('en-GB')} entries</span>
        </div>

        {entries.length === 0 ? (
          <p className="text-parchment-400">No entries match &ldquo;{q}&rdquo;.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {entries.map(entry => (
              <Link
                key={entry.id}
                href={`/word/${entry.id}`}
                className="block p-3 rounded-lg bg-parchment-900/70 hover:bg-parchment-900 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gold-500">{entry.id}</span>
                      <span className="text-lg font-serif text-parchment-100">{entry.original}</span>
                    </div>
                    <p className="text-sm text-parchment-300 italic">{entry.transliteration}</p>
                    <p className="text-xs text-parchment-400 mt-1 line-clamp-2">{entry.definition}</p>
                  </div>
                  {entry.uses > 0 && (
                    <span className="text-xs text-parchment-500 bg-parchment-800 px-2 py-0.5 rounded-full flex-shrink-0">
                      {entry.uses} ×
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="flex justify-between items-center mt-6 text-sm">
            {page > 1 ? <Link href={href({ page: page - 1 })} className="text-gold-400 hover:text-gold-300">← Previous</Link> : <span />}
            <span className="text-parchment-500">Page {page} of {pages}</span>
            {page < pages ? <Link href={href({ page: page + 1 })} className="text-gold-400 hover:text-gold-300">Next →</Link> : <span />}
          </div>
        )}
      </main>
    </>
  );
}
