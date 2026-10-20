'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BIBLE_BOOKS } from '@/lib/bible-books';
import { BookMarked, BookOpen, Languages, LayoutGrid, Search, type LucideIcon } from 'lucide-react';
import { NAV_SECTIONS } from '@/lib/navigation';

const TYPE_ICONS: Record<string, LucideIcon> = { page: LayoutGrid, book: BookOpen, verse: BookMarked, strongs: Languages, search: Search };

interface SearchResult {
  type: string;
  label: string;
  href: string;
}

const PAGES = NAV_SECTIONS.flatMap(section => section.links).map(({ label, href }) => ({ label, href }));

/** Pages, books, verse references and Strong's numbers matching what was typed. */
function computeResults(q: string): SearchResult[] {
  if (!q.trim()) return [];
  const lower = q.toLowerCase();
  const matched: SearchResult[] = [];

  // Search pages
  for (const p of PAGES) {
    if (p.label.toLowerCase().includes(lower)) {
      matched.push({ type: 'page', ...p });
    }
  }

  // Search books
  for (const book of BIBLE_BOOKS) {
    if (book.name.toLowerCase().includes(lower) || book.abbrev.toLowerCase().includes(lower)) {
      matched.push({
        type: 'book',
        label: book.name,
        href: `/reader/${book.name.toLowerCase().replace(/ /g, '-')}/1`,
      });
    }
  }

  // Detect verse reference patterns like "John 3:16" or "Gen 1"
  const refMatch = q.match(/^(.+?)\s+(\d+)(?::(\d+))?$/);
  if (refMatch) {
    const bookName = refMatch[1].toLowerCase();
    const ch = refMatch[2];
    const vs = refMatch[3];
    const book = BIBLE_BOOKS.find(b =>
      b.name.toLowerCase().startsWith(bookName) || b.abbrev.toLowerCase().startsWith(bookName)
    );
    if (book) {
      const slug = book.name.toLowerCase().replace(/ /g, '-');
      const href = vs ? `/reader/${slug}/${ch}#v${vs}` : `/reader/${slug}/${ch}`;
      matched.unshift({
        type: 'verse',
        label: `${book.name} ${ch}${vs ? ':' + vs : ''}`,
        href,
      });
    }
  }

  // Search for Strong's
  if (lower.match(/^[hg]\d+$/i)) {
    matched.unshift({
      type: 'strongs',
      label: `Strong's ${q.toUpperCase()}`,
      href: `/word/${q.toUpperCase()}`,
    });
  }

  // Full-text search link
  matched.push({
    type: 'search',
    label: `Search for "${q}"`,
    href: `/search?q=${encodeURIComponent(q)}`,
  });

  return matched.slice(0, 12);
}


export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const results = useMemo(() => computeResults(query), [query]);

  // Each opening starts with an empty search
  function resetSearch() {
    setQuery('');
    setSelectedIndex(0);
  }

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => {
          if (!prev) resetSearch();
          return !prev;
        });
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    const open = () => { resetSearch(); setIsOpen(true); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-search', open);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-search', open);
    };
  }, []);



  const navigate = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      navigate(results[selectedIndex].href);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center px-4 pt-[12vh]" onClick={() => setIsOpen(false)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" />
      <div
        className="relative w-full max-w-lg bg-parchment-950 border border-parchment-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-parchment-800">
          <Search size={18} className="text-parchment-500" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Go to John 3:16, a book, a page or G26…"
            className="flex-1 bg-transparent text-parchment-100 placeholder-parchment-600 text-sm focus:outline-hidden"
          />
          <kbd className="text-[10px] text-parchment-600 border border-parchment-700 rounded-sm px-1.5 py-0.5">ESC</kbd>
        </div>

        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto p-2">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => navigate(r.href)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  i === selectedIndex
                    ? 'bg-parchment-800 text-parchment-50'
                    : 'text-parchment-300 hover:bg-parchment-800'
                }`}
              >
                {(() => { const Icon = TYPE_ICONS[r.type] ?? LayoutGrid; return <Icon size={16} className="shrink-0 opacity-70" />; })()}
                <span className="flex-1">{r.label}</span>
                <span className="text-[10px] text-parchment-600 uppercase">{r.type}</span>
              </button>
            ))}
          </div>
        )}

        {!query && (
          <div className="p-4 text-center text-xs text-parchment-600">
            Type to search books, pages, verses (e.g. &quot;John 3:16&quot;), or Strong&apos;s numbers (e.g. &quot;G26&quot;)
          </div>
        )}
      </div>
    </div>
  );
}
