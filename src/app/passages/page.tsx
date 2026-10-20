import Link from 'next/link';
import { getDb, isDatabaseAvailable } from '@/lib/db';
import { getBookByName } from '@/lib/bible-books';

interface Passage {
  title: string;
  reference: string;
  book: string;
  chapter: number;
  verse: number;
  note: string;
}

const SECTIONS: { title: string; passages: Passage[] }[] = [
  {
    title: 'Teaching of Jesus',
    passages: [
      { title: 'The Beatitudes', reference: 'Matthew 5:3–12', book: 'Matthew', chapter: 5, verse: 3, note: 'The opening blessings of the Sermon on the Mount (compare Luke 6:20–23).' },
      { title: "The Lord's Prayer", reference: 'Matthew 6:9–13', book: 'Matthew', chapter: 6, verse: 9, note: 'The prayer Jesus taught his disciples (compare Luke 11:2–4).' },
    ],
  },
  {
    title: 'Law and Christian life',
    passages: [
      { title: 'The Ten Commandments', reference: 'Exodus 20:1–17', book: 'Exodus', chapter: 20, verse: 1, note: 'Given at Sinai (repeated in Deuteronomy 5:6–21).' },
      { title: 'The Fruit of the Spirit', reference: 'Galatians 5:22–23', book: 'Galatians', chapter: 5, verse: 22, note: 'Nine qualities produced by the Spirit, set against the works of the flesh.' },
      { title: 'The Armour of God', reference: 'Ephesians 6:10–18', book: 'Ephesians', chapter: 6, verse: 10, note: 'Paul’s picture of the believer equipped to stand firm.' },
    ],
  },
  {
    title: 'Songs and doxologies',
    passages: [
      { title: 'The Song of Moses', reference: 'Exodus 15:1–18', book: 'Exodus', chapter: 15, verse: 1, note: 'Sung after the crossing of the Red Sea.' },
      { title: 'The Song of Deborah', reference: 'Judges 5', book: 'Judges', chapter: 5, verse: 1, note: 'A victory song after the defeat of Sisera.' },
      { title: 'The Song of Hannah', reference: '1 Samuel 2:1–10', book: '1 Samuel', chapter: 2, verse: 1, note: 'Hannah’s prayer of thanksgiving at Samuel’s dedication.' },
      { title: 'The Song of David', reference: '2 Samuel 22', book: '2 Samuel', chapter: 22, verse: 1, note: 'David’s song of deliverance (also Psalm 18).' },
      { title: 'The Magnificat', reference: 'Luke 1:46–55', book: 'Luke', chapter: 1, verse: 46, note: 'Mary’s song of praise.' },
      { title: 'The Benedictus', reference: 'Luke 1:68–79', book: 'Luke', chapter: 1, verse: 68, note: 'Zacharias’s prophecy at the birth of John.' },
      { title: 'The Nunc Dimittis', reference: 'Luke 2:29–32', book: 'Luke', chapter: 2, verse: 29, note: 'Simeon’s song on seeing the child Jesus.' },
      { title: 'The Christ Hymn', reference: 'Philippians 2:5–11', book: 'Philippians', chapter: 2, verse: 5, note: 'Christ’s humility and exaltation.' },
      { title: 'The Colossian Hymn', reference: 'Colossians 1:15–20', book: 'Colossians', chapter: 1, verse: 15, note: 'Christ as image of God, creator and reconciler.' },
      { title: 'Doxology of Romans', reference: 'Romans 11:33–36', book: 'Romans', chapter: 11, verse: 33, note: '“O the depth of the riches…”' },
      { title: 'Doxology of Ephesians', reference: 'Ephesians 3:20–21', book: 'Ephesians', chapter: 3, verse: 20, note: '“Unto him that is able to do exceeding abundantly…”' },
      { title: 'Doxology of Jude', reference: 'Jude 24–25', book: 'Jude', chapter: 1, verse: 24, note: '“Unto him that is able to keep you from falling…”' },
      { title: 'The Heavenly Throne Room', reference: 'Revelation 4:8–11', book: 'Revelation', chapter: 4, verse: 8, note: '“Holy, holy, holy, Lord God Almighty.”' },
      { title: 'The Song of the Lamb', reference: 'Revelation 5:9–14', book: 'Revelation', chapter: 5, verse: 9, note: 'The new song: “Thou art worthy.”' },
      { title: 'The Hallelujah Chorus', reference: 'Revelation 19:1–8', book: 'Revelation', chapter: 19, verse: 1, note: 'Heaven’s praise at the marriage of the Lamb.' },
    ],
  },
];

export default function PassagesPage() {
  // Opening verse of each passage in the KJV, when the database is available
  const openingVerse = new Map<string, string>();
  if (isDatabaseAvailable()) {
    const stmt = getDb().prepare("SELECT text FROM verses WHERE book = ? AND chapter = ? AND verse = ? AND translation = 'KJV'");
    for (const p of SECTIONS.flatMap(s => s.passages)) {
      const book = getBookByName(p.book);
      const row = book && (stmt.get(book.id, p.chapter, p.verse) as { text: string } | undefined);
      if (row) openingVerse.set(p.reference, row.text);
    }
  }

  return (
    <>
      <main className="flex-1 p-4 lg:p-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold font-serif text-parchment-50 mb-2">Key Passages</h1>
          <p className="text-parchment-400 text-sm">
            Well-known passages, songs and prayers. Each opens in the reader, where every word links to its Hebrew or
            Greek original and every verse to its cross-references.
          </p>
        </div>

        {SECTIONS.map(section => (
          <section key={section.title} className="mb-8">
            <h2 className="text-xl font-semibold text-gold-400 mb-4 font-serif">{section.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {section.passages.map(p => {
                const slug = p.book.toLowerCase().replace(/ /g, '-');
                const text = openingVerse.get(p.reference);
                return (
                  <Link
                    key={p.reference}
                    href={`/reader/${slug}/${p.chapter}#v${p.verse}`}
                    className="block p-4 rounded-xl bg-parchment-900/70 hover:bg-parchment-900 transition-all"
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-parchment-100">{p.title}</h3>
                      <span className="text-xs text-gold-500 whitespace-nowrap">{p.reference}</span>
                    </div>
                    <p className="text-xs text-parchment-400">{p.note}</p>
                    {text && <p className="text-sm text-parchment-300 font-serif italic mt-2 line-clamp-2">&ldquo;{text}&rdquo;</p>}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
