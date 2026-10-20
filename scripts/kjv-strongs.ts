// Parsers for the full Strong's lexicon (Open Scriptures) and the
// Strong's-tagged KJV (CrossWire Bible Society OSIS module).

import type { VerseToken } from '../src/lib/strongs';

export type { VerseToken };

// OSIS book IDs in canonical order; index + 1 is the app's book number.
export const OSIS_BOOKS = [
  'Gen', 'Exod', 'Lev', 'Num', 'Deut', 'Josh', 'Judg', 'Ruth', '1Sam', '2Sam',
  '1Kgs', '2Kgs', '1Chr', '2Chr', 'Ezra', 'Neh', 'Esth', 'Job', 'Ps', 'Prov',
  'Eccl', 'Song', 'Isa', 'Jer', 'Lam', 'Ezek', 'Dan', 'Hos', 'Joel', 'Amos',
  'Obad', 'Jonah', 'Mic', 'Nah', 'Hab', 'Zeph', 'Hag', 'Zech', 'Mal',
  'Matt', 'Mark', 'Luke', 'John', 'Acts', 'Rom', '1Cor', '2Cor', 'Gal', 'Eph',
  'Phil', 'Col', '1Thess', '2Thess', '1Tim', '2Tim', 'Titus', 'Phlm', 'Heb', 'Jas',
  '1Pet', '2Pet', '1John', '2John', '3John', 'Jude', 'Rev',
];

export interface StrongsEntry {
  id: string;
  original: string;
  transliteration: string;
  pronunciation: string | null;
  definition: string;
  kjv_usage: string | null;
  derivation: string | null;
  language: 'hebrew' | 'greek';
}

export interface TaggedVerse {
  book: number;
  chapter: number;
  verse: number;
  tokens: VerseToken[];
}

/** "H07225" -> "H7225"; returns null for anything that is not a plain Strong's number. */
export function normaliseStrongsId(raw: string): string | null {
  const m = /^([HG])0*(\d+)$/.exec(raw.trim());
  return m ? `${m[1]}${m[2]}` : null;
}

function clean(text: string | undefined): string | null {
  if (!text) return null;
  const s = text.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
  return s || null;
}

/** Parses an Open Scriptures `strongs-*-dictionary.js` file. */
export function parseLexicon(js: string, language: 'hebrew' | 'greek'): StrongsEntry[] {
  const start = js.indexOf('{', js.indexOf('Dictionary ='));
  const end = js.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error(`Unrecognised ${language} lexicon format`);
  const data = JSON.parse(js.slice(start, end + 1)) as Record<string, Record<string, string>>;

  const entries: StrongsEntry[] = [];
  for (const [rawId, e] of Object.entries(data)) {
    const id = normaliseStrongsId(rawId);
    if (!id || !e.lemma) continue;
    entries.push({
      id,
      original: e.lemma,
      transliteration: e.xlit || e.translit || '',
      pronunciation: clean(e.pron),
      definition: clean(e.strongs_def) || clean(e.kjv_def) || '',
      kjv_usage: clean(e.kjv_def),
      derivation: clean(e.derivation),
      language,
    });
  }
  return entries;
}

const decodeEntities = (s: string) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

/** Strips markup from a fragment, printing divine names in capitals as the KJV does. */
function textOf(fragment: string): string {
  return decodeEntities(
    fragment
      .replace(/<divineName[^>]*>(.*?)<\/divineName>/g, (_, t: string) => t.toUpperCase())
      .replace(/<[^>]+>/g, '')
  );
}

function attr(attrs: string, name: string): string | undefined {
  return new RegExp(`\\b${name}="([^"]*)"`).exec(attrs)?.[1];
}

/** Turns the inner markup of one OSIS verse into display tokens. */
export function tokeniseVerse(body: string): VerseToken[] {
  const tokens: VerseToken[] = [];
  const pushText = (t: string) => {
    if (!t) return;
    const last = tokens[tokens.length - 1];
    if (typeof last === 'string') tokens[tokens.length - 1] = last + t;
    else tokens.push(t);
  };

  const content = body.replace(/<note\b[^>]*>.*?<\/note>/g, '');
  const re = /<w\b([^>]*?)\/>|<w\b([^>]*)>(.*?)<\/w>|<transChange\b[^>]*>(.*?)<\/transChange>/g;
  let pos = 0;
  for (let m; (m = re.exec(content)); ) {
    pushText(textOf(content.slice(pos, m.index)));
    pos = re.lastIndex;
    if (m[1] !== undefined) continue; // untranslated word (e.g. Greek article): no English text

    if (m[4] !== undefined) {
      const t = textOf(m[4]);
      if (t) tokens.push({ t, a: 1 });
      continue;
    }

    const t = textOf(m[3]);
    if (!t) continue;
    const lemma = attr(m[2], 'lemma') || '';
    const s = lemma
      .split(/\s+/)
      .filter(l => l.startsWith('strong:'))
      .map(l => normaliseStrongsId(l.slice(7)))
      .filter((id): id is string => !!id);
    const morph = attr(m[2], 'morph')
      ?.split(/\s+/)
      .filter(x => x.startsWith('robinson:'))
      .map(x => x.slice(9))
      .join(' ');
    const token: VerseToken = { t };
    if (s.length) token.s = s;
    if (morph) token.m = morph;
    tokens.push(token);
  }
  pushText(textOf(content.slice(pos)));

  // Trim leading/trailing whitespace of the verse as a whole.
  if (typeof tokens[0] === 'string') tokens[0] = tokens[0].trimStart();
  const lastIdx = tokens.length - 1;
  if (typeof tokens[lastIdx] === 'string') tokens[lastIdx] = (tokens[lastIdx] as string).trimEnd();
  return tokens.filter(t => t !== '');
}

/** Parses the CrossWire KJV OSIS file into tokenised verses. */
export function parseKjvOsis(xml: string): TaggedVerse[] {
  const bookNumber = new Map(OSIS_BOOKS.map((b, i) => [b, i + 1]));
  const verses: TaggedVerse[] = [];
  const re = /<verse osisID="[^"]+" sID="([^"]+)"\/>(.*?)<verse eID="\1"\/>/g;
  for (let m; (m = re.exec(xml)); ) {
    const [osisBook, chapter, verse] = m[1].split('.');
    const book = bookNumber.get(osisBook);
    if (!book) continue;
    verses.push({ book, chapter: Number(chapter), verse: Number(verse), tokens: tokeniseVerse(m[2]) });
  }
  return verses;
}

export const tokensToText = (tokens: VerseToken[]) =>
  tokens.map(t => (typeof t === 'string' ? t : t.t)).join('');
