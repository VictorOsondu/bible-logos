export interface EditionSelection { version: string; chapter: number }
/** The path always belongs to the first edition; the query retains other editions' chapters. */
export function readerHref(slug: string, selections: EditionSelection[], includeChapters = true): string {
  const first = selections[0];
  if (!first) return `/reader/${slug}/1`;
  const query = new URLSearchParams();
  if (selections.length !== 1 || first.version !== 'KJV') query.set('translations', selections.map(s => s.version).join(','));
  if (includeChapters && selections.some(s => s.chapter !== first.chapter)) query.set('chapters', selections.map(s => `${s.version}:${s.chapter}`).join(','));
  return `/reader/${slug}/${first.chapter}${query.size ? `?${query.toString().replace(/%2C/g, ',').replace(/%3A/g, ':')}` : ''}`;
}
