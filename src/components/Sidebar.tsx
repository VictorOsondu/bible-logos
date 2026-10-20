'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, ChevronDown, Menu, Search, X } from 'lucide-react';
import { BIBLE_BOOKS, getBookBySlug } from '@/lib/bible-books';
import { NAV_SECTIONS, openSearch, type NavLink } from '@/lib/navigation';
import ThemeToggle from './ThemeToggle';

const iconButton = 'p-2 rounded-lg text-parchment-400 hover:text-parchment-100 hover:bg-parchment-800/70 transition-colors';

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-parchment-50">
      <BookOpen size={20} className="text-gold-400" />
      <span className="font-serif text-lg font-semibold tracking-tight">Bible Logos</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // The book being read, from /reader/<book>/<chapter>
  const readerMatch = /^\/reader\/([^/]+)\/(\d+)/.exec(pathname);
  const currentBook = readerMatch ? getBookBySlug(readerMatch[1]) : undefined;
  const currentChapter = readerMatch ? Number(readerMatch[2]) : undefined;

  const [testament, setTestament] = useState<'OT' | 'NT'>(currentBook?.testament ?? 'OT');
  const [expandedBook, setExpandedBook] = useState<number | null>(currentBook?.id ?? null);
  const [bookFilter, setBookFilter] = useState('');
  const isReferencePage = NAV_SECTIONS.find(s => s.label === 'Reference')!.links.some(l => pathname.startsWith(l.href));
  const [showReference, setShowReference] = useState(isReferencePage);

  // After navigating: close the mobile drawer and follow the book being read.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsOpen(false);
    if (currentBook) {
      setTestament(currentBook.testament);
      setExpandedBook(currentBook.id);
    }
  }

  // While the drawer is open: Escape closes it and the page behind does not scroll.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const filter = bookFilter.trim().toLowerCase();
  const books = BIBLE_BOOKS.filter(b =>
    filter ? b.name.toLowerCase().includes(filter) || b.abbrev.toLowerCase().includes(filter) : b.testament === testament
  );

  const navLink = (link: NavLink) => {
    const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
    const Icon = link.icon;
    return (
      <Link
        key={link.href}
        href={link.href}
        aria-current={active ? 'page' : undefined}
        className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm transition-colors ${
          active ? 'bg-parchment-800 text-parchment-50 font-medium' : 'text-parchment-300 hover:bg-parchment-800/60 hover:text-parchment-100'
        }`}
      >
        <Icon size={16} className={active ? 'text-gold-400' : 'text-parchment-500'} />
        {link.label}
      </Link>
    );
  };

  const sectionHeading = 'px-3 pt-5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-parchment-500';

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 h-14 flex items-center gap-1 px-2 bg-parchment-950/90 backdrop-blur-sm border-b border-parchment-800">
        <button onClick={() => setIsOpen(true)} className={iconButton} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div className="flex-1 ml-1"><Logo /></div>
        <button onClick={openSearch} className={iconButton} aria-label="Search">
          <Search size={18} />
        </button>
        <ThemeToggle className={iconButton} />
      </header>

      {isOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setIsOpen(false)} />}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-dvh w-80 max-w-[85vw] lg:w-72 shrink-0 flex flex-col
          bg-parchment-950 lg:bg-parchment-900/40 border-r border-parchment-800 transition-transform duration-200
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}
        aria-label="Main navigation"
      >
        <div className="h-14 flex items-center justify-between px-4 shrink-0">
          <Logo />
          <div className="flex items-center">
            <ThemeToggle className={`${iconButton} hidden lg:block`} />
            <button onClick={() => setIsOpen(false)} className={`${iconButton} lg:hidden`} aria-label="Close menu">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="px-3 shrink-0">
          <button
            onClick={() => { setIsOpen(false); openSearch(); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-parchment-800/60 text-sm text-parchment-500 hover:text-parchment-300 transition-colors"
          >
            <Search size={15} />
            <span className="flex-1 text-left">Go to a verse or page…</span>
            <kbd className="hidden lg:inline text-[10px] font-sans text-parchment-500">⌘K</kbd>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          {NAV_SECTIONS.filter(s => s.label !== 'Reference').map(section => (
            <div key={section.label}>
              <h2 className={sectionHeading}>{section.label}</h2>
              {section.links.map(navLink)}
            </div>
          ))}

          {NAV_SECTIONS.filter(s => s.label === 'Reference').map(section => (
            <div key={section.label}>
              <button
                onClick={() => setShowReference(v => !v)}
                aria-expanded={showReference}
                className={`${sectionHeading} w-full flex items-center justify-between hover:text-parchment-300`}
              >
                {section.label}
                <ChevronDown size={14} className={`transition-transform ${showReference ? '' : '-rotate-90'}`} />
              </button>
              {showReference && section.links.map(navLink)}
            </div>
          ))}

          {/* Books */}
          <h2 className={sectionHeading}>Bible</h2>
          <div className="flex gap-1 p-1 mb-2 rounded-lg bg-parchment-800/60 text-xs font-medium">
            {(['OT', 'NT'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTestament(t); setBookFilter(''); }}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  testament === t && !filter ? 'bg-parchment-950 text-parchment-100 shadow-xs' : 'text-parchment-500 hover:text-parchment-300'
                }`}
              >
                {t === 'OT' ? 'Old Testament' : 'New Testament'}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={bookFilter}
            onChange={e => setBookFilter(e.target.value)}
            placeholder="Find a book"
            className="w-full mb-2 px-3 py-1.5 rounded-lg bg-transparent border border-parchment-800 text-sm text-parchment-200 placeholder-parchment-600 focus:outline-hidden focus:border-gold-500/50"
          />
          {books.map(book => {
            const expanded = expandedBook === book.id;
            const slug = book.name.toLowerCase().replace(/ /g, '-');
            const isCurrent = currentBook?.id === book.id;
            return (
              <div key={book.id}>
                <button
                  onClick={() => setExpandedBook(expanded ? null : book.id)}
                  aria-expanded={expanded}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isCurrent ? 'text-parchment-50 font-medium' : 'text-parchment-300 hover:bg-parchment-800/60 hover:text-parchment-100'
                  }`}
                >
                  {book.name}
                  <span className="text-xs text-parchment-500 tabular-nums">{book.chapters}</span>
                </button>
                {expanded && (
                  <div className="grid grid-cols-6 gap-1 px-2 py-2">
                    {Array.from({ length: book.chapters }, (_, i) => i + 1).map(ch => {
                      const active = isCurrent && ch === currentChapter;
                      return (
                        <Link
                          key={ch}
                          href={`/reader/${slug}/${ch}`}
                          aria-current={active ? 'page' : undefined}
                          className={`text-center text-xs py-1.5 rounded-md tabular-nums transition-colors ${
                            active ? 'bg-gold-600 text-parchment-950 font-semibold' : 'text-parchment-300 hover:bg-parchment-800'
                          }`}
                        >
                          {ch}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
