'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Bookmark, Columns2, Dna, GraduationCap, Link as LinkIcon, X } from 'lucide-react';
import { getBookById } from '@/lib/bible-books';
import { isBookmarked, toggleBookmark, useBookmarks } from '@/lib/reading';
import CrossRefPanel from './CrossRefPanel';
import StrongsPanel from './StrongsPanel';
import ResearchPanel from './ResearchPanel';
import IntertextualPanel from './IntertextualPanel';
import CopyButton from './CopyButton';
import { primaryStrongs, tokensToText, type VerseToken } from '@/lib/strongs';

interface Verse {
  book: number;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}

interface Props {
  verses: Verse[];
  translations: string[];
  /** Strong's-tagged words by translation (the KJV and HTL), then by verse */
  tokens?: Record<string, Record<number, VerseToken[]>>;
}

type Panel = 'crossref' | 'strongs' | 'research' | 'intertextual';

const PANELS: { id: Exclude<Panel, 'strongs'>; label: string; icon: typeof LinkIcon }[] = [
  { id: 'crossref', label: 'Cross-references', icon: LinkIcon },
  { id: 'intertextual', label: 'Shared words', icon: Dna },
  { id: 'research', label: 'Research', icon: GraduationCap },
];

const chip = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-parchment-800 text-xs text-parchment-400 hover:text-parchment-100 hover:border-parchment-700 transition-colors';

// Below this width the study panel is a bottom sheet over the text rather than a side column.
const SHEET_BREAKPOINT = 1280;

// The URL fragment, e.g. "#v16" when linked to a verse
const subscribeToHash = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};
const useHash = () => useSyncExternalStore(subscribeToHash, () => window.location.hash, () => '');

export default function VerseDisplay({ verses, translations, tokens: taggedTokens }: Props) {
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [selectedStrongs, setSelectedStrongs] = useState<string | null>(null);

  const book = verses[0]?.book;
  const chapter = verses[0]?.chapter;
  const bookName = book ? getBookById(book)?.name ?? '' : '';

  const hashMatch = /^#v(\d+)$/.exec(useHash());
  const targetVerse = hashMatch ? Number(hashMatch[1]) : null;
  const bookmarks = useBookmarks();
  const bookmarked = selectedVerse !== null && isBookmarked(bookmarks, book, chapter, selectedVerse, translations[0]);

  // Scroll to a linked verse (#v16). Browsers do this on a full page load, but not after
  // client-side navigation, where the verses render after the router has tried to scroll.
  useEffect(() => {
    if (targetVerse !== null) document.getElementById(`v${targetVerse}`)?.scrollIntoView();
  }, [verses, targetVerse]);

  const closePanel = () => { setPanel(null); setSelectedVerse(null); setSelectedStrongs(null); };

  // Escape closes the study panel
  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setPanel(null);
      setSelectedVerse(null);
      setSelectedStrongs(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel]);

  // One row per verse, translations in the order the reader chose them
  const grouped = new Map<number, Verse[]>();
  for (const v of verses) grouped.set(v.verse, [...(grouped.get(v.verse) ?? []), v]);
  for (const list of grouped.values()) list.sort((a, b) => translations.indexOf(a.translation) - translations.indexOf(b.translation));

  const selectVerse = (verse: number) => {
    if (selectedVerse === verse) return closePanel();
    setSelectedVerse(verse);
    setPanel(p => (p && p !== 'strongs' ? p : 'crossref'));
    // Keep the verse visible above the bottom sheet on smaller screens
    if (window.innerWidth < SHEET_BREAKPOINT) {
      requestAnimationFrame(() => document.getElementById(`v${verse}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
    }
  };

  const openWord = (id: string) => {
    setSelectedStrongs(id);
    setPanel('strongs');
  };

  const tokensFor = (v: Verse) => taggedTokens?.[v.translation]?.[v.verse];
  const plainText = (v: Verse) => {
    const tokens = tokensFor(v);
    return tokens ? tokensToText(tokens) : v.text;
  };

  const renderText = (v: Verse) => {
    const tokens = tokensFor(v);
    if (!tokens) return v.text;
    return tokens.map((token, i) => {
      if (typeof token === 'string') return token;
      if (token.a) return <em key={i} className="text-parchment-300">{token.t}</em>;
      const id = token.s && primaryStrongs(token.s);
      if (!id) return token.t;
      return (
        // A span rather than a <button> so multi-word phrases can wrap across lines like the rest of the text
        <span
          key={i}
          role="button"
          tabIndex={0}
          className="strongs-word"
          onClick={e => { e.stopPropagation(); openWord(id); }}
          onKeyDown={e => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            e.stopPropagation();
            openWord(id);
          }}
        >
          {token.t}
        </span>
      );
    });
  };

  // Verse numbers are buttons, so keyboard and screen-reader users can open a verse's study tools
  const verseButton = (verseNum: number, selected: boolean) => (
    <button
      type="button"
      className="verse-number"
      aria-pressed={selected}
      aria-label={`Verse ${verseNum}: ${selected ? 'hide' : 'show'} study tools`}
      onClick={e => { e.stopPropagation(); selectVerse(verseNum); }}
    >
      {verseNum}
    </button>
  );

  const panelTitle = panel === 'strongs'
    ? `Strong's ${selectedStrongs}`
    : selectedVerse !== null ? `${bookName} ${chapter}:${selectedVerse}` : '';

  return (
    <div className="xl:flex xl:gap-8 xl:justify-center">
      {/* While the bottom sheet is open, room below the verses lets even the last one scroll clear of it */}
      <div className={`max-w-2xl mx-auto xl:mx-0 w-full ${panel ? 'pb-[60dvh] xl:pb-0' : ''}`}>
        {[...grouped.entries()].map(([verseNum, list]) => {
          const selected = selectedVerse === verseNum;
          return (
            <div
              key={verseNum}
              id={`v${verseNum}`}
              onClick={() => selectVerse(verseNum)}
              className={`-mx-3 px-3 py-1.5 rounded-lg cursor-pointer scroll-mt-20 transition-colors ${
                selected ? 'bg-parchment-900' : targetVerse === verseNum ? 'bg-gold-400/10' : 'hover:bg-parchment-900/50'
              }`}
            >
              {list.length === 1 ? (
                <p className="bible-text text-parchment-100">
                  {verseButton(verseNum, selected)}
                  {renderText(list[0])}
                </p>
              ) : (
                <div className="space-y-1.5 py-1">
                  {list.map((v, i) => (
                    <p key={v.translation} className={`bible-text ${i === 0 ? 'text-parchment-100' : 'text-parchment-300'}`}>
                      {i === 0 && verseButton(verseNum, selected)}
                      <span className="mr-2 align-middle text-[10px] font-sans font-semibold tracking-wider text-parchment-500">{v.translation}</span>
                      {renderText(v)}
                    </p>
                  ))}
                </div>
              )}

              {selected && (
                <div className="flex flex-wrap gap-1.5 mt-2 mb-1" onClick={e => e.stopPropagation()}>
                  {PANELS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPanel(p.id)}
                      className={`${chip} ${panel === p.id ? 'bg-parchment-800 text-parchment-100 border-parchment-700' : ''}`}
                    >
                      <p.icon size={13} /> {p.label}
                    </button>
                  ))}
                  <Link href={`/compare?book=${book}&chapter=${chapter}&verse=${verseNum}`} className={chip}>
                    <Columns2 size={13} /> Compare
                  </Link>
                  <button
                    onClick={() => toggleBookmark(book, chapter, verseNum, translations[0])}
                    className={`${chip} ${bookmarked ? 'text-gold-400 border-gold-400/40' : ''}`}
                    aria-pressed={bookmarked}
                  >
                    <Bookmark size={13} fill={bookmarked ? 'currentColor' : 'none'} /> {bookmarked ? 'Saved' : 'Bookmark'}
                  </button>
                  <CopyButton
                    className={chip}
                    text={`"${plainText(list[0])}" — ${bookName} ${chapter}:${verseNum} (${list[0].translation})`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {panel && (panel === 'strongs' ? selectedStrongs : selectedVerse !== null) && (
        <aside
          aria-label={panelTitle}
          className="fixed inset-x-0 bottom-0 z-40 max-h-[60dvh] overflow-y-auto rounded-t-2xl border-t border-parchment-800 bg-parchment-950 p-4 shadow-2xl
            xl:static xl:z-auto xl:w-96 xl:shrink-0 xl:max-h-[calc(100vh-4rem)] xl:sticky xl:top-8 xl:self-start xl:rounded-2xl xl:border xl:shadow-none"
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-parchment-800 xl:hidden" />
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-semibold text-parchment-100">{panelTitle}</h3>
            <button onClick={closePanel} className="p-1.5 rounded-full text-parchment-500 hover:text-parchment-100 hover:bg-parchment-800" aria-label="Close panel">
              <X size={16} />
            </button>
          </div>
          {panel === 'strongs' && selectedStrongs && <StrongsPanel strongsId={selectedStrongs} />}
          {panel === 'crossref' && selectedVerse !== null && <CrossRefPanel book={book} chapter={chapter} verse={selectedVerse} />}
          {panel === 'intertextual' && selectedVerse !== null && <IntertextualPanel book={book} chapter={chapter} verse={selectedVerse} />}
          {panel === 'research' && selectedVerse !== null && (
            <ResearchPanel key={`${book}-${chapter}-${selectedVerse}`} book={book} chapter={chapter} verse={selectedVerse} />
          )}
        </aside>
      )}
    </div>
  );
}
