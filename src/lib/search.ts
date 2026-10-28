/**
 * Turns what a reader types into a safe SQLite FTS5 query. Each word or "quoted phrase" is
 * matched literally (so quotes, AND, NEAR( and other operators cannot cause syntax errors),
 * all terms must appear, and a trailing * keeps prefix search: "shepherd*" finds "shepherds".
 * Returns null when there is nothing to search for.
 */
export function toFtsQuery(input: string): string | null {
  const terms = (input.match(/"[^"]*"|[^\s"]+/g) ?? [])
    .map(raw => {
      const prefix = raw.endsWith('*') && !raw.startsWith('"');
      const text = raw.replace(/"/g, '').replace(/\*+$/, '').trim();
      return text ? `"${text}"${prefix ? '*' : ''}` : '';
    })
    .filter(Boolean);
  return terms.length ? terms.join(' ') : null;
}

/** Strip vowel/cantillation and accent marks for searching, preserving the source text separately. */
export const normalizeSearchText = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/ς/g, 'σ').normalize('NFC');
