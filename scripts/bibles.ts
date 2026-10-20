// Parsers for the Bible text formats the seed script downloads, and the conversion of Hebrew
// verse numbering to the English (KJV) numbering every translation is stored in.

export interface FlatVerse {
  book: number;
  chapter: number;
  verse: number;
  text: string;
}

// Book names used by scrollmapper and the cross-reference files
export const BOOK_MAP: Record<string, number> = {
  'Genesis':1,'Exodus':2,'Leviticus':3,'Numbers':4,'Deuteronomy':5,
  'Joshua':6,'Judges':7,'Ruth':8,
  '1 Samuel':9,'I Samuel':9,'2 Samuel':10,'II Samuel':10,
  '1 Kings':11,'I Kings':11,'2 Kings':12,'II Kings':12,
  '1 Chronicles':13,'I Chronicles':13,'2 Chronicles':14,'II Chronicles':14,
  'Ezra':15,'Nehemiah':16,'Esther':17,'Job':18,'Psalms':19,'Psalm':19,
  'Proverbs':20,'Ecclesiastes':21,'Song of Solomon':22,'Song of Songs':22,
  'Isaiah':23,'Jeremiah':24,'Lamentations':25,'Ezekiel':26,'Daniel':27,
  'Hosea':28,'Joel':29,'Amos':30,'Obadiah':31,'Jonah':32,'Micah':33,
  'Nahum':34,'Habakkuk':35,'Zephaniah':36,'Haggai':37,'Zechariah':38,'Malachi':39,
  'Matthew':40,'Mark':41,'Luke':42,'John':43,'Acts':44,'Romans':45,
  '1 Corinthians':46,'I Corinthians':46,'2 Corinthians':47,'II Corinthians':47,
  'Galatians':48,'Ephesians':49,'Philippians':50,'Colossians':51,
  '1 Thessalonians':52,'I Thessalonians':52,'2 Thessalonians':53,'II Thessalonians':53,
  '1 Timothy':54,'I Timothy':54,'2 Timothy':55,'II Timothy':55,
  'Titus':56,'Philemon':57,'Hebrews':58,'James':59,
  '1 Peter':60,'I Peter':60,'2 Peter':61,'II Peter':61,
  '1 John':62,'I John':62,'2 John':63,'II John':63,'3 John':64,'III John':64,
  'Jude':65,'Revelation':66,'Revelation of John':66
};

// USFM book codes in canonical order: the code at index i is book i + 1
const USFM_CODES = [
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA', '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH',
  'EST', 'JOB', 'PSA', 'PRO', 'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO', 'OBA', 'JON',
  'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL', 'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL',
  'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN',
  'JUD', 'REV',
];

/** Joins poetry lines and collapses whitespace. */
export const cleanText = (text: string) => text.replace(/\s*\|\|\s*/g, ' ').replace(/\s+/g, ' ').trim();

/** Keeps the 66 books, drops empty verses (untranslated passages) and tidies the text. */
function finish(verses: FlatVerse[]): FlatVerse[] {
  return verses
    .map(v => ({ ...v, text: cleanText(v.text) }))
    .filter(v => v.book >= 1 && v.book <= 66 && v.verse >= 1 && v.text !== '');
}

interface ScrollmapperBible {
  books: { name: string; chapters: { chapter: number; verses: { verse: number; text: string }[] }[] }[];
}

/** scrollmapper/bible_databases JSON. Books outside the 66 (the Apocrypha) are skipped. */
export function parseScrollmapper(json: string): FlatVerse[] {
  const bible = JSON.parse(json) as ScrollmapperBible;
  const result: FlatVerse[] = [];
  for (const b of bible.books) {
    const book = BOOK_MAP[b.name];
    if (!book) continue;
    for (const ch of b.chapters) {
      for (const v of ch.verses) result.push({ book, chapter: ch.chapter, verse: v.verse, text: v.text });
    }
  }
  return finish(result);
}

const decodeXml = (s: string) => s
  .replace(/<[^>]+>/g, '')
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&amp;/g, '&');

/** Zefania XML (as in seven1m/open-bibles). */
export function parseZefania(xml: string): FlatVerse[] {
  const result: FlatVerse[] = [];
  for (const [, bnumber, bookXml] of xml.matchAll(/<BIBLEBOOK[^>]*\bbnumber="(\d+)"[^>]*>([\s\S]*?)<\/BIBLEBOOK>/g)) {
    for (const [, cnumber, chapterXml] of bookXml.matchAll(/<CHAPTER[^>]*\bcnumber="(\d+)"[^>]*>([\s\S]*?)<\/CHAPTER>/g)) {
      for (const [, vnumber, text] of chapterXml.matchAll(/<VERS[^>]*\bvnumber="(\d+)"[^>]*>([\s\S]*?)<\/VERS>/g)) {
        result.push({ book: Number(bnumber), chapter: Number(cnumber), verse: Number(vnumber), text: decodeXml(text) });
      }
    }
  }
  return finish(result);
}

/** USFX XML (as in seven1m/open-bibles). Footnotes and cross-references are left out. */
export function parseUsfx(xml: string): FlatVerse[] {
  const result: FlatVerse[] = [];
  for (const [, code, bookXml] of xml.matchAll(/<book id="([1-3A-Z]{3})">([\s\S]*?)<\/book>/g)) {
    const book = USFM_CODES.indexOf(code) + 1;
    if (!book) continue;
    const body = bookXml.replace(/<(f|x|fe)\b[^>]*>[\s\S]*?<\/\1>/g, '');
    for (const [, chapter, chapterXml] of body.matchAll(/<c id="(\d+)"\/>([\s\S]*?)(?=<c id=|$)/g)) {
      for (const [, verse, text] of chapterXml.matchAll(/<v id="(\d+)[^"]*"\/>([\s\S]*?)<ve\/>/g)) {
        result.push({ book, chapter: Number(chapter), verse: Number(verse), text: decodeXml(text) });
      }
    }
  }
  return finish(result);
}

/** The assembled chapter files from wldeh/bible-api: [book, chapter, verse, text] rows. */
export function parseChapterBundle(json: string): FlatVerse[] {
  const rows = JSON.parse(json) as [number, number, number, string][];
  return finish(rows.map(([book, chapter, verse, text]) => ({ book, chapter, verse, text })));
}

type Ref = `${number}:${number}:${number}`;
const ref = (book: number, chapter: number, verse: number): Ref => `${book}:${chapter}:${verse}`;

/**
 * Reads the verse mappings of a Paratext versification file (English = original Hebrew), as a
 * map from the Hebrew reference to the English one. Verse 0 is a psalm title.
 */
export function parseVersificationMappings(vrs: string): Map<Ref, Ref> {
  const map = new Map<Ref, Ref>();
  const side = /^([1-3A-Z]{3}) (\d+):(\d+)(?:-(\d+))?$/;
  for (const line of vrs.split('\n')) {
    const content = line.replace(/#.*/, '').trim();
    if (!content.includes('=')) continue;
    const [english, hebrew] = content.split('=').map(s => side.exec(s.trim()));
    if (!english || !hebrew) continue;
    const engBook = USFM_CODES.indexOf(english[1]) + 1;
    const hebBook = USFM_CODES.indexOf(hebrew[1]) + 1;
    if (!engBook || !hebBook) continue; // books outside the 66
    const engStart = Number(english[3]), engEnd = Number(english[4] ?? english[3]);
    const hebStart = Number(hebrew[3]), hebEnd = Number(hebrew[4] ?? hebrew[3]);
    for (let i = 0; i <= hebEnd - hebStart; i++) {
      map.set(ref(hebBook, Number(hebrew[2]), hebStart + i), ref(engBook, Number(english[2]), Math.min(engStart + i, engEnd)));
    }
  }
  return map;
}

/**
 * Renumbers a translation that follows the Hebrew verse numbering (as the JPS does) to the English
 * numbering. A psalm title, which the Hebrew counts as a verse, is joined to the start of verse 1.
 */
export function toEnglishVersification(verses: FlatVerse[], mappings: Map<Ref, Ref>): FlatVerse[] {
  const byRef = new Map<Ref, FlatVerse>();
  const titles = new Map<Ref, string[]>();
  for (const v of verses) {
    const target = mappings.get(ref(v.book, v.chapter, v.verse));
    const [book, chapter, verse] = target ? target.split(':').map(Number) : [v.book, v.chapter, v.verse];
    if (verse === 0) {
      const key = ref(book, chapter, 1);
      titles.set(key, [...(titles.get(key) ?? []), v.text]);
      continue;
    }
    const key = ref(book, chapter, verse);
    const existing = byRef.get(key);
    byRef.set(key, existing ? { ...existing, text: `${existing.text} ${v.text}` } : { book, chapter, verse, text: v.text });
  }
  for (const [key, parts] of titles) {
    const verse = byRef.get(key);
    if (verse) verse.text = `${parts.join(' ')} ${verse.text}`;
  }
  return [...byRef.values()];
}
