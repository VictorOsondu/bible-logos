'use client';

import { useEffect } from 'react';
import { recordReading } from '@/lib/reading';

/** Adds the chapter on screen to the reader's history (for "Continue reading"). */
export default function ReadingTracker({ book, chapter }: { book: number; chapter: number }) {
  useEffect(() => recordReading(book, chapter), [book, chapter]);
  return null;
}
