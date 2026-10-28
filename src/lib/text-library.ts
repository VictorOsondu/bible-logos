import type { BookInfo } from './bible-books';

export const COLLECTIONS = [
  { id: 'deuterocanon', name: 'Deuterocanonical / Apocryphal books', description: 'Books received differently across Christian traditions. Many belong to Catholic and Orthodox Bibles; the precise collections vary.', source: 'https://worldenglish.bible/' },
  { id: 'second-temple', name: 'Second Temple Jewish writings', description: 'Jewish visions and interpretations from the world surrounding the New Testament. 1 Enoch is Scripture in the Ethiopian Orthodox tradition.', source: 'https://www.ethiopianorthodox.org/english/canonical/books.html' },
  { id: 'early-christian', name: 'Early Christian writings', description: 'Explore early Christian teaching and community life alongside the New Testament.', source: 'https://www.gutenberg.org/ebooks/42053' },
] as const;
export type CollectionId = typeof COLLECTIONS[number]['id'];
export interface LibraryBook extends Omit<BookInfo, 'testament'> {
  testament: 'Library';
  collection: CollectionId;
  introduction: string;
  defaultVersion: string;
  sectionLabel?: string;
}
const extra = (id: number, name: string, chapters: number, introduction = '', defaultVersion = 'WEB-DC', collection: CollectionId = 'deuterocanon'): LibraryBook =>
  ({ id, name, abbrev: name, chapters, testament: 'Library', collection, introduction: introduction || 'Explore this work in its named edition. Its reception and book arrangement vary across traditions.', defaultVersion });
export const LIBRARY_BOOKS: LibraryBook[] = [
  extra(67, 'Tobit', 14), extra(68, 'Judith', 16), extra(69, 'Baruch', 6),
  extra(70, 'Esther (Greek)', 16, 'The Greek form of Esther includes material absent from the Hebrew form. Chapter numbering follows the selected edition.'),
  extra(71, 'Wisdom', 20), extra(72, 'Sirach', 51, 'Also known as Ecclesiasticus. A wisdom book with a Greek prologue describing its transmission from Hebrew.'),
  extra(73, '1 Maccabees', 16), extra(74, '2 Maccabees', 15), extra(75, '1 Esdras', 9),
  extra(76, 'Prayer of Manasseh', 1), extra(77, 'Psalm 151', 1), extra(78, '3 Maccabees', 7),
  extra(79, '2 Esdras', 16), extra(80, '4 Maccabees', 18),
  extra(81, 'Letter of Jeremiah', 1, 'Printed separately in this Greek edition; often included as Baruch 6 in English collections.', 'LXX-SWETE'),
  extra(82, 'Susanna (Old Greek)', 1, 'Old Greek text, kept separate from the Theodotion form.', 'LXX-SWETE'),
  extra(83, 'Susanna (Theodotion)', 1, 'Theodotion form, kept separate from the Old Greek text.', 'LXX-SWETE'),
  extra(84, 'Daniel (Old Greek)', 12, 'Old Greek Daniel. Susanna and Bel and the Dragon are presented separately in Swete.', 'LXX-SWETE'),
  extra(85, 'Daniel (Theodotion)', 12, 'Theodotion Daniel. Susanna and Bel and the Dragon are presented separately in Swete.', 'LXX-SWETE'),
  extra(86, 'Bel and the Dragon (Old Greek)', 1, 'Old Greek form of Bel and the Dragon.', 'LXX-SWETE'),
  extra(87, 'Bel and the Dragon (Theodotion)', 1, 'Theodotion form of Bel and the Dragon.', 'LXX-SWETE'),
  extra(88, 'Daniel (Greek additions)', 14, 'The WEB Greek form of Daniel includes the additional narratives and prayer. Read it using this edition’s native numbering.'),
  extra(90, 'Esdras B (Greek)', 23, 'Swete’s combined Greek Ezra–Nehemiah, in its native 23-chapter arrangement.', 'LXX-SWETE'),
  extra(91, 'Odes', 16, 'A collection of biblical songs; the source’s extra odes “iva” and “ivb” remains separately labelled.', 'LXX-SWETE'),
  extra(92, 'Psalms of Solomon', 18, 'A separate collection of psalms, distinct from the biblical Psalter.', 'LXX-SWETE', 'second-temple'),
  { ...extra(93, 'Didache', 16, 'An anonymous early Christian teaching manual, usually dated to the late first or early second century, with debate about its layers. It discusses the two ways, baptism, prayer, meals and community leadership. “Teaching of the Twelve Apostles” is its traditional title, not a verified claim of authorship by the Twelve. Read Hitchcock and Brown’s 1884 English translation, preserving its older language. Chapters are presented as whole sections because this edition does not number individual verses.', 'DID-HB', 'early-christian'), sectionLabel: 'section' },
  extra(94, '1 Enoch', 108, 'A composite Jewish apocalyptic collection, traditionally attributed to Enoch, with sections composed at different dates in the Second Temple period. Aramaic fragments survive, while the complete work is preserved in Ethiopic (Geʽez). It is received as Scripture in the Ethiopian Orthodox tradition. This is R. H. Charles’s historical English translation (1917); it predates subsequent manuscript discoveries. Read in whole-chapter sections, preserving inline verse numbers and the edition’s alternate readings in printed order. Witness labels E (Ethiopic), Gg (Greek Akhmîm) and Gs (Greek Syncellus), editorial brackets and corruption marks are retained; commentary and typographic emphasis are omitted.', 'ENO-CHARLES', 'second-temple'),
];
export const slugOf = (book: { name: string }) => book.name.toLowerCase().replace(/ /g, '-');
export const libraryBook = (id: number) => LIBRARY_BOOKS.find(b => b.id === id);
