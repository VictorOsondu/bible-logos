'use client';

import { useEffect } from 'react';
import { recordReading } from '@/lib/reading';

/** Adds the chapter on screen to the reader's history (for "Continue reading"). */
export default function ReadingTracker({ book, chapter, translation = 'KJV', chapterLabel }: { book: number; chapter: number; translation?: string; chapterLabel?: string }) {
  useEffect(() => recordReading(book, chapter, translation, chapterLabel), [book, chapter, translation, chapterLabel]);
  return null;
}
