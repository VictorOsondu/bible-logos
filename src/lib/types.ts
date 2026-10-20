/** Core verse from the database */
export interface Verse {
  id: number;
  book: number;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}

/** Cross-reference entry */
export interface CrossReference {
  id: number;
  from_book: number;
  from_chapter: number;
  from_verse_start: number;
  from_verse_end: number;
  to_book: number;
  to_chapter: number;
  to_verse_start: number;
  to_verse_end: number;
  votes: number;
  category: string;
}

/** Strong's concordance entry */
export interface StrongsEntry {
  id: string;
  original: string;
  transliteration: string;
  definition: string;
  language: 'hebrew' | 'greek';
}

/** Word-Strong's mapping */
export interface WordStrongs {
  id: number;
  book: number;
  chapter: number;
  verse: number;
  word: string;
  strongs_id: string;
  position: number;
}

/** Bible book info */
export interface BookInfo {
  id: number;
  name: string;
  abbrev: string;
  chapters: number;
  testament: 'OT' | 'NT';
}
