import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { handleApiError } from '@/lib/api-utils';
import { getKjvRenderings, getOccurrences, searchStrongs } from '@/lib/strongs';

const intParam = (value: string | null, fallback: number, max: number) =>
  Math.min(Math.max(parseInt(value || '') || fallback, 0), max);

export async function GET(request: NextRequest) {
  try {
  const { searchParams } = new URL(request.url);
  const strongs = searchParams.get('strongs');
  const book = searchParams.get('book');
  const chapter = searchParams.get('chapter');
  const verse = searchParams.get('verse');
  const limit = intParam(searchParams.get('limit'), 100, 1000);
  const offset = intParam(searchParams.get('offset'), 0, Number.MAX_SAFE_INTEGER);

  const db = getDb();

  if (strongs) {
    const entry = db.prepare('SELECT * FROM strongs WHERE id = ?').get(strongs);
    if (!entry) {
      return NextResponse.json({ error: 'Strong\'s number not found' }, { status: 404 });
    }

    const { totalWords, totalVerses, occurrences } = getOccurrences(db, strongs, { limit, offset });
    return NextResponse.json({ entry, renderings: getKjvRenderings(db, strongs), totalWords, totalVerses, occurrences });
  }

  if (book && chapter && verse) {
    // Get words with Strong's for a specific verse
    const words = db.prepare(`
      SELECT ws.word, ws.strongs_id, ws.position, s.original, s.transliteration, s.definition, s.language
      FROM word_strongs ws
      JOIN strongs s ON s.id = ws.strongs_id
      WHERE ws.book = ? AND ws.chapter = ? AND ws.verse = ?
      ORDER BY ws.position
    `).all(parseInt(book), parseInt(chapter), parseInt(verse));

    return NextResponse.json({ words });
  }

  // Search / browse Strong's entries
  const { total, entries } = searchStrongs(db, {
    q: searchParams.get('q') || '',
    language: searchParams.get('language') || undefined,
    limit,
    offset,
  });
  return NextResponse.json({ total, entries });
  } catch (error) {
    return handleApiError(error);
  }
}
