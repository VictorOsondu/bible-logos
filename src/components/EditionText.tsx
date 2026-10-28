'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { readerHref } from '@/lib/reader-links';
import { useRouter } from 'next/navigation';
import { getTranslation } from '@/lib/translations';
import { isBookmarked, toggleBookmark, useBookmarks } from '@/lib/reading';
import CopyButton from './CopyButton';
import type { EditionChapter } from '@/lib/edition-data';
interface Passage { verse: number; text: string; native_label: string | null }
export default function EditionText({ version, book, name, slug, chapter, chapters, passages, readerChapter, selections, notes }: { version: string; book: number; name: string; slug: string; chapter: number; chapters: EditionChapter[]; passages: Passage[]; readerChapter: number; selections: { version: string; chapter: number }[]; notes: { label: string; text: string }[] }) {
  const router = useRouter();
  const info = getTranslation(version);
  const bookmarks = useBookmarks();
  const chapterLabel = chapters.find(c => c.chapter === chapter)?.label ?? String(chapter);
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (/^v\d+(?:-[A-Z-]+)?$/.test(hash)) document.getElementById(hash)?.scrollIntoView({ block: 'start' });
  }, [chapter, version]);
  const index = chapters.findIndex(c => c.chapter === chapter);
  const link = (ch: number) => {
    const next = selections.map(s => s.version === version ? { ...s, chapter: ch } : s);
    return readerHref(slug, next.length ? next : [{ version, chapter: readerChapter }]);
  };
  return <section aria-label={info?.name} className="min-w-0 rounded-xl border border-parchment-800 p-4 lg:p-6 space-y-4">
    <header className="space-y-2"><h2 className="font-serif text-xl text-parchment-100">{info?.name} <span className="text-gold-400">{chapterLabel}</span></h2>
      <p className="text-xs text-parchment-400">{info?.note}</p>
      <label className="block text-sm text-parchment-300">Chapter in this edition{' '}<select aria-label={`Chapter in ${version}`} value={chapter} onChange={e => { router.push(link(Number(e.target.value))); }} className="bg-parchment-900 rounded p-2">
        {chapters.map(ch => <option key={ch.chapter} value={ch.chapter}>{ch.label}</option>)}
      </select></label>
    </header>
    {passages.length === 0 && <p className="text-parchment-300">This passage is unavailable in this edition. Choose one of its chapters above.</p>}
    <div lang={info?.language ?? 'en'} dir={info?.direction ?? 'ltr'} className="space-y-4 text-parchment-100">
      {passages.map(p => {
        const label = p.native_label ?? String(p.verse);
        const ref = `${name} ${chapterLabel}${label === 'section' ? '' : `:${label}`}`;
        const saved = isBookmarked(bookmarks, book, chapter, p.verse, version);
        return <div key={p.verse} id={selections[0]?.version === version ? `v${p.verse}` : `v${p.verse}-${version}`} className="scroll-mt-20">
          <p className="bible-text whitespace-pre-line"><bdi className="text-xs text-gold-400 me-2">{label === 'section' ? 'Section' : label}</bdi>{p.text}</p>
          <div dir="ltr" className="flex gap-3 mt-1 text-xs text-parchment-400"><button className="min-h-9 px-2" onClick={() => toggleBookmark(book, chapter, p.verse, version, ref)} aria-pressed={saved} aria-label={`${saved ? 'Remove bookmark for' : 'Bookmark'} ${ref}`}>{saved ? 'Saved' : 'Bookmark'}</button><CopyButton text={`${p.text} — ${ref} (${version})`} className="inline-flex min-h-9 items-center gap-1 px-2 text-xs" /></div>
        </div>;
      })}
    </div>
    {notes.length > 0 && <aside aria-label="Source notes" className="space-y-2 text-sm text-parchment-400">{notes.map(note => <p key={note.label}>Source note at {note.label}: {note.text}</p>)}</aside>}
    <nav className="flex justify-between text-sm text-gold-400" aria-label={`Navigate ${version}`}>
      {index > 0 ? <Link href={link(chapters[index - 1].chapter)}>← {chapters[index - 1].label}</Link> : <span />}
      {index >= 0 && index < chapters.length - 1 && <Link href={link(chapters[index + 1].chapter)}>{chapters[index + 1].label} →</Link>}
    </nav>
    <footer className="text-xs text-parchment-400 [overflow-wrap:anywhere]">{info?.licence}. {info?.sourceUrl && <a href={info.sourceUrl} target="_blank" rel="noreferrer" className="underline text-gold-400">Edition and source</a>} {info?.licenceUrl && <a href={info.licenceUrl} target="_blank" rel="noreferrer" className="underline text-gold-400">Licence</a>}</footer>
  </section>;
}
