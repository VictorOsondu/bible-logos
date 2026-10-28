// Application code: MIT. Study prose in the imported JSON: CC BY-NC 4.0.
import studies from '@/content/themes/studies.json';

export interface LivingLetter {
  letter: string;
  name: string;
  meaning: string;
  usage: string;
  reflection: string;
  shape?: string;
  sound?: string;
  soundExercise?: string;
  interpretation?: string;
  attribution?: string;
  audio?: { src: string; sourceUrl: string; credit: string };
}

export interface LivingLetterGroup {
  name: string;
  letters: string;
  names: string;
  connections: string;
  entries: LivingLetter[];
}

interface ThemeStudy {
  slug: string;
  title: string;
  parentSlug: string | null;
  overview: string;
  passages: { label: string; book: string; chapter: number; verse: number }[];
  editionPassages?: { label: string; book: string; chapter: number; verse: number; translation: string }[];
  sections: {
    title: string;
    text: string;
    letterGroups?: LivingLetterGroup[];
  }[];
  words: { id: string; label: string; note: string }[];
  questions: string[];
  related: string[];
  sources?: { citation: string; detail: string; url?: string }[];
}

export const THEME_STUDIES: ThemeStudy[] = studies;
export const MAIN_THEMES = THEME_STUDIES.filter(study => study.parentSlug === null);
export const getSubThemes = (slug: string) => THEME_STUDIES.filter(study => study.parentSlug === slug);
export const THEME_LICENCE_URL = 'https://creativecommons.org/licenses/by-nc/4.0/';
export const getThemeStudy = (slug: string) => THEME_STUDIES.find(study => study.slug === slug);
export const passageHref = (passage: { book: string; chapter: number; verse: number; translation?: string }) =>
  `/reader/${passage.book}/${passage.chapter}${passage.translation ? `?translations=${encodeURIComponent(passage.translation)}` : ''}#v${passage.verse}`;
