'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Menu, Search, X } from 'lucide-react';
import { REFERENCE_SECTION, SIDEBAR_SECTIONS, openSearch, type NavLink } from '@/lib/navigation';
import ThemeToggle from './ThemeToggle';
import SidebarToggle from './SidebarToggle';

const iconButton = 'p-2 rounded-lg text-parchment-400 hover:text-parchment-100 hover:bg-parchment-800/70 transition-colors';

// On wide screens the sidebar can shrink to icons only (the `collapsed` variant); labels then stay
// available to screen readers and as tooltips.
const label = 'lg:collapsed:sr-only';

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-parchment-50" title="Bible Logos">
      <BookOpen size={20} className="text-gold-400 shrink-0" />
      <span className={`font-serif text-lg font-semibold tracking-tight ${label}`}>Bible Logos</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close the mobile drawer after navigating
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsOpen(false);
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

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`) ||
    (href === '/reference' && REFERENCE_SECTION.links.some(l => pathname.startsWith(l.href)));

  const navLink = (link: NavLink) => {
    const active = isActive(link.href);
    const Icon = link.icon;
    return (
      <Link
        key={link.href}
        href={link.href}
        title={link.label}
        aria-current={active ? 'page' : undefined}
        className={`flex items-center gap-3 px-3 py-2 lg:collapsed:justify-center rounded-lg text-sm transition-colors ${
          active ? 'bg-parchment-800 text-parchment-50 font-medium' : 'text-parchment-300 hover:bg-parchment-800/60 hover:text-parchment-100'
        }`}
      >
        <Icon size={17} className={`shrink-0 ${active ? 'text-gold-400' : 'text-parchment-500'}`} />
        <span className={label}>{link.label}</span>
      </Link>
    );
  };

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
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-dvh w-72 max-w-[85vw] lg:w-60 lg:collapsed:w-16 shrink-0 flex flex-col
          bg-parchment-950 lg:bg-parchment-900/40 border-r border-parchment-800 transition-[transform,width] duration-200
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}
        aria-label="Main navigation"
      >
        <div className="h-14 flex items-center justify-between lg:collapsed:justify-center px-4 lg:collapsed:px-0 shrink-0">
          <Logo />
          <button onClick={() => setIsOpen(false)} className={`${iconButton} lg:hidden`} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <div className="px-3 lg:collapsed:px-2 shrink-0">
          <button
            onClick={() => { setIsOpen(false); openSearch(); }}
            title="Go to a verse or page (⌘K)"
            className="w-full flex items-center lg:collapsed:justify-center gap-2 px-3 py-2 rounded-lg bg-parchment-800/60 text-sm text-parchment-500 hover:text-parchment-300 transition-colors"
          >
            <Search size={15} className="shrink-0" />
            <span className={`flex-1 text-left ${label}`}>Go to…</span>
            <kbd className="hidden lg:inline lg:collapsed:hidden text-[10px] font-sans text-parchment-500">⌘K</kbd>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 lg:collapsed:px-2 pb-4">
          {SIDEBAR_SECTIONS.map(section => (
            <div key={section.label} className="pt-5 lg:collapsed:pt-3 lg:collapsed:mt-3 lg:collapsed:border-t lg:collapsed:first:border-t-0 border-parchment-800">
              <h2 className={`px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-parchment-500 ${label}`}>{section.label}</h2>
              {section.links.map(navLink)}
            </div>
          ))}
        </nav>

        <div className="hidden lg:flex lg:collapsed:flex-col shrink-0 items-center gap-1 px-3 py-3 lg:collapsed:px-2 border-t border-parchment-800">
          <ThemeToggle className={iconButton} />
          <SidebarToggle className={iconButton} />
        </div>
      </aside>
    </>
  );
}
