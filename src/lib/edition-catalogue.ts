/** Compact, serializable catalogue. Numeric chapter labels need not be repeated in page data. */
export type EditionCatalogue = Record<string, Record<string, [number, string | null, number, number[]?][]>>;
export interface EditionChapter { chapter: number; label: string; maxVerse: number; missingVerses: number[] }
export function chaptersFor(catalogue: EditionCatalogue, version: string, book: number): EditionChapter[] {
  return (catalogue[version]?.[book] ?? []).map(([chapter, label, maxVerse, missingVerses]) => ({ chapter, label: label ?? String(chapter), maxVerse, missingVerses: missingVerses ?? [] }));
}
