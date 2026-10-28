import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { parseSwete, parseDidache, parseEnoch, validateLibrary } from '../../scripts/library';
import { normalizeSearchText } from '@/lib/search';
import { getBookBySlug, BIBLE_BOOKS } from '@/lib/bible-books';
import { LIBRARY_BOOKS } from '@/lib/text-library';

describe('text library', () => {
  it('retains the existing canon while resolving additional work links', () => {
    expect(BIBLE_BOOKS).toHaveLength(66);
    expect(getBookBySlug('didache')?.id).toBe(93);
    expect(getBookBySlug('1-enoch')?.id).toBe(94);
    expect(new Set([...BIBLE_BOOKS, ...LIBRARY_BOOKS].map(b => b.id)).size).toBe(BIBLE_BOOKS.length + LIBRARY_BOOKS.length);
  });
  it('preserves native lettered verses, source order and prologues', () => {
    const verses = parseSwete('19.prologue.1 Ἐν\n19.prologue.1 ἀρχῇ\n19.1.2 λόγος\n19.1.2a θεός\n19.1.3 τέλος\n', 70);
    expect(verses[0]).toMatchObject({ chapter: 0, chapterLabel: 'prologue', text: 'Ἐν ἀρχῇ' });
    expect(verses.slice(1).map(v => v.label)).toEqual(['2', '2a', '3']);
    expect(verses[2].verse).not.toBe(verses[1].verse);
    expect(verses.slice(1).map(v => v.position)).toEqual([1, 2, 3]);
    expect(() => validateLibrary(verses, 'test')).not.toThrow();
    expect(() => validateLibrary([...verses, verses[0]], 'test')).toThrow(/duplicate/);
    expect(() => parseSwete('unrecognized text', 1)).toThrow();
  });
  it('normalizes accents, Hebrew vowel points and final sigma only for search', () => {
    expect(normalizeSearchText('אֱלֹהִים')).toBe('אלהים');
    expect(normalizeSearchText('λόγος')).toBe('λογοσ');
  });
  it('reads historical Didache chapters without titles, notes or page numbers', () => {
    const source = Array.from({ length: 16 }, (_, i) => `<a id="chp${i + 1}Eng"></a><p>Title</p><p><a href="#chp${i + 1}Gr">Chap.</a><sup>note</sup>—Two ways<span class="pgnum">3</span> there are.</p>`).join('') + '</td>';
    const rows = parseDidache(source);
    expect(rows).toHaveLength(16);
    expect(rows[0].text).toBe('Two ways there are.');
    expect(rows[15]).toMatchObject({ chapter: 16, label: 'section' });
  });
  it('preserves unnumbered Enoch chapters and text below chapter headings', () => {
    const rows = parseEnoch('<abbr title="one">I.</abbr> 1. The words of the blessing of Enoch.<p><abbr title="two">II.</abbr> One.</p><p><abbr title="three">III.</abbr> Unnumbered text.</p><h4><abbr title="four">IV.</abbr> Heading</h4><p>1. Fourth.</p><span class="sc">Printed in Great Britain');
    expect(rows.map(r => r.chapter)).toEqual([1, 2, 3, 4]);
    expect(rows[2].text).toBe('Unnumbered text.');
    expect(rows[3].text).toBe('1. Fourth.');
    expect(rows.every(r => r.label === 'section')).toBe(true);
  });
  it('pins all source inventories explicitly', () => {
    const manifest = JSON.parse(fs.readFileSync('scripts/library-swete.json', 'utf8'));
    expect(manifest.revision).toMatch(/^[a-f0-9]{40}$/);
    expect(manifest.files.every((f: { work: number }) => getBookBySlug(LIBRARY_BOOKS.find(b => b.id === f.work)?.name.toLowerCase().replace(/ /g, '-') ?? BIBLE_BOOKS.find(b => b.id === f.work)!.name.toLowerCase().replace(/ /g, '-')))).toBe(true);
  });
});
