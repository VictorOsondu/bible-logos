import Link from 'next/link';
import { getDb, isDatabaseAvailable } from '@/lib/db';
import { getBookById } from '@/lib/bible-books';
import { NAV_SECTIONS } from '@/lib/navigation';
import ContinueReading from '@/components/ContinueReading';

// The verse of the day changes daily; rebuild the page at most once an hour.
export const revalidate = 3600;

// Curated notable verses (subset for VOTD)
const NOTABLE_VERSES: [number, number, number][] = [
  [1,1,1],[19,23,1],[19,23,4],[19,46,1],[19,119,105],[19,27,1],[19,37,4],
  [20,3,5],[20,3,6],[23,40,31],[23,41,10],[23,53,5],[24,29,11],
  [40,5,3],[40,6,33],[40,11,28],[40,28,19],
  [43,1,1],[43,3,16],[43,8,32],[43,14,6],[43,14,27],[43,15,13],
  [45,3,23],[45,5,8],[45,8,1],[45,8,28],[45,8,38],[45,12,2],
  [46,13,4],[46,13,13],
  [49,2,8],[49,3,20],
  [50,4,6],[50,4,8],[50,4,13],
  [58,4,12],[58,11,1],[58,12,1],
  [59,1,5],[60,5,7],[62,4,8],
  [66,3,20],[66,21,4],
];

export default function Home() {
  if (!isDatabaseAvailable()) {
    return (
      <main className="flex-1 px-4 py-16 max-w-2xl text-center">
        <h1 className="font-serif text-3xl font-semibold text-parchment-50 mb-3">Bible Logos</h1>
        <p className="text-parchment-400">
          The database has not been built yet. Run <code className="px-1.5 py-0.5 rounded-sm bg-parchment-900 text-parchment-200">npm run seed</code> and reload.
        </p>
      </main>
    );
  }

  const db = getDb();

  // Verse of the day: one of the notable verses, changing daily
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const [vBook, vChapter, vVerse] = NOTABLE_VERSES[dayOfYear % NOTABLE_VERSES.length];
  const votd = db.prepare(
    "SELECT text FROM verses WHERE book = ? AND chapter = ? AND verse = ? AND translation = 'KJV'"
  ).get(vBook, vChapter, vVerse) as { text: string } | undefined;
  const votdBook = getBookById(vBook);
  const votdSlug = votdBook?.name.toLowerCase().replace(/ /g, '-') || '';

  return (
    <main className="flex-1 px-4 py-8 lg:px-8 lg:py-14 max-w-4xl">
      <ContinueReading />

      {votd && (
        <section className="my-12 lg:my-16 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-parchment-500 mb-4">Verse of the day</p>
          <Link href={`/reader/${votdSlug}/${vChapter}#v${vVerse}`} className="group block max-w-2xl mx-auto">
            <blockquote className="font-serif text-2xl lg:text-3xl leading-snug text-parchment-50">
              {votd.text}
            </blockquote>
            <p className="mt-4 text-sm text-gold-400 group-hover:underline underline-offset-4">
              {votdBook?.name} {vChapter}:{vVerse}
            </p>
          </Link>
        </section>
      )}

      {NAV_SECTIONS.map(section => (
        <section key={section.label} className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-parchment-500 mb-3">{section.label}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {section.links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-start gap-3 p-3 rounded-xl hover:bg-parchment-900 transition-colors"
              >
                <span className="mt-0.5 p-2 rounded-lg bg-parchment-900 text-parchment-400 group-hover:bg-parchment-800 group-hover:text-gold-400 transition-colors">
                  <link.icon size={16} />
                </span>
                <span>
                  <span className="block text-sm font-medium text-parchment-100">{link.label}</span>
                  <span className="block text-xs text-parchment-500 mt-0.5">{link.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
