// Every translation in the database, in the order they are offered. All are in the public domain
// or under an open licence; `licence` is shown wherever the text is.

export interface Translation {
  id: string;
  name: string;
  licence: string;
  /** Anything a reader should know when comparing it verse by verse */
  note?: string;
}

export const TRANSLATIONS: Translation[] = [
  { id: 'KJV', name: 'King James Version', licence: 'Public domain (Crown patent in the UK)' },
  { id: 'BSB', name: 'Berean Standard Bible', licence: 'Public domain' },
  { id: 'WEB', name: 'World English Bible', licence: 'Public domain' },
  { id: 'LSV', name: 'Literal Standard Version', licence: 'CC BY-SA 4.0, Covenant Press' },
  { id: 'ASV', name: 'American Standard Version', licence: 'Public domain' },
  { id: 'YLT', name: "Young's Literal Translation", licence: 'Public domain' },
  { id: 'DBY', name: 'Darby Translation', licence: 'Public domain' },
  { id: 'WBT', name: "Webster's Bible", licence: 'Public domain' },
  { id: 'UKJV', name: 'Updated King James Version', licence: 'Public domain' },
  { id: 'BBE', name: 'Bible in Basic English', licence: 'Public domain' },
  { id: 'ULT', name: 'unfoldingWord Literal Text', licence: 'CC BY-SA 4.0, unfoldingWord', note: 'Still in progress: Numbers, 1–2 Chronicles, Ecclesiastes, Isaiah, Jeremiah and Ezekiel are not yet published.' },
  { id: 'UST', name: 'unfoldingWord Simplified Text', licence: 'CC BY-SA 4.0, unfoldingWord', note: 'Still in progress: Numbers, 1–2 Chronicles, Ecclesiastes, Isaiah, Jeremiah and Ezekiel are not yet published. Words in {braces} are implied by the original.' },
  { id: 'OEB', name: 'Open English Bible', licence: 'Public domain (CC0)', note: 'Still in progress: parts of the Old Testament are not yet translated.' },
  { id: 'WMB', name: 'World Messianic Bible', licence: 'Public domain (the name is a trademark)', note: 'The World English Bible with Hebrew forms of names.' },
  { id: 'HTL', name: 'Hebrew Old Testament (transliterated)', licence: 'CC BY 4.0, STEPBible.org (Tyndale House, Cambridge)', note: 'The Hebrew text word for word in Latin letters; a capital marks the stressed syllable. Hebrew Scriptures only.' },
  { id: 'JPS', name: 'Jewish Publication Society Tanakh', licence: 'Public domain', note: 'Hebrew Scriptures only; renumbered to match the English verse numbers.' },
  { id: 'CPDV', name: 'Catholic Public Domain Version', licence: 'Public domain', note: 'Psalms are numbered as in the Latin Vulgate.' },
  { id: 'WYC', name: 'Wycliffe Bible', licence: 'Public domain', note: 'Middle English. Psalms are numbered as in the Latin Vulgate.' },
  { id: 'VUL', name: 'Latin Vulgate', licence: 'Public domain' },
];

export const TRANSLATION_IDS = TRANSLATIONS.map(t => t.id);

export const getTranslation = (id: string) => TRANSLATIONS.find(t => t.id === id);

/** Sorts translation ids into the order above. */
export const byTranslationOrder = (a: string, b: string) => TRANSLATION_IDS.indexOf(a) - TRANSLATION_IDS.indexOf(b);
