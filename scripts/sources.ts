// Every file the seed script downloads, pinned to an exact commit and checked against a SHA-256
// hash, so a change upstream can never silently alter (or break) the database.
//
// To update a source: change its commit, run `npm run seed`, and replace the hash it reports.

const SCROLLMAPPER = 'https://raw.githubusercontent.com/scrollmapper/bible_databases/e1b254cef86d0e65b1a5d1a94b8b112d0f296a2c/formats';
const OPEN_SCRIPTURES = 'https://raw.githubusercontent.com/openscriptures/strongs/0acd2f251c2d35ff8db2dece4e0593979d3ac223';
const CROSSWIRE = 'https://gitlab.com/crosswire-bible-society/kjv/-/raw/d490be7e34762deb2c76cb2c1306d4808e27890d';
const OPEN_BIBLES = 'https://raw.githubusercontent.com/seven1m/open-bibles/f257a3559025c3f873b48a75019f53a9354ed7de';
const BIBLE_API = 'https://raw.githubusercontent.com/wldeh/bible-api/1d6987e268fcadb1e96ceb487e3d365a5e837f4a/bibles';
const EBIBLE_CORPUS = 'https://raw.githubusercontent.com/BibleNLP/ebible/32326194b9131b6881d902e1fec191719fe56e2d';

export interface Source {
  url: string;
  sha256: string;
}

/** A translation published as one JSON file per chapter; the hash covers the assembled text. */
export interface ChapterSource {
  base: string;
  name: string;
  sha256: string;
  /** Book folders that differ from the book's name in lower case without spaces */
  folders?: Record<string, string>;
}

const source = (url: string, sha256: string): Source => ({ url, sha256 });
const chapters = (name: string, sha256: string, folders?: Record<string, string>): ChapterSource =>
  ({ base: `${BIBLE_API}/${name}`, name, sha256, folders });

/** How each translation (other than the KJV) is downloaded and read. */
export type TranslationSource =
  | { format: 'scrollmapper' | 'zefania' | 'usfx'; source: Source; hebrewVerses?: boolean }
  | { format: 'chapters'; source: ChapterSource };

const scrollmapper = (file: string, sha256: string, hebrewVerses = false): TranslationSource =>
  ({ format: 'scrollmapper', source: source(`${SCROLLMAPPER}/json/${file}`, sha256), hebrewVerses });

export const SOURCES = {
  // OpenBible.info cross-references, via scrollmapper
  crossReferences: [
    'c20f36ccb5ffa49ed50cd02dcb944dedc608d16c12278d625700301dfdcbb431',
    '4b9e2eee746efe2774902d8ee0ded51dc68b965427f9ecebb289ba889a77d0a7',
    'e3d340b5e4652b1917950effe061ba5b4ae1e80d3354fc270ae00f741d9e332d',
    '1880beea1167873dd80589d5afe4abcce09118096ee035202393382cb2d75a2d',
    'e0ae8d9a75b8bb6f9aa9ade7fd364b6e2629d33fb23b884cde0e7adc70ed97c7',
    '469b98286305b1d98f83f2a9273ac6ff340a5abb2be12e2a50d0898d491e1439',
    'c7d1f9503603718a0d8a56da5d0527a39fa131b4aac04c3963520e01e1b5da77',
  ].map((sha256, i) => source(`${SCROLLMAPPER}/sql/extras/cross_references_${i}.sql`, sha256)),

  // Strong's lexicon (Open Scriptures, CC BY-SA)
  strongsHebrew: source(`${OPEN_SCRIPTURES}/hebrew/strongs-hebrew-dictionary.js`, '5ce6aeed551c709f49bcfa341cadf2f34bc7599b85d9de9e6ac2ecbf60fc3739'),
  strongsGreek: source(`${OPEN_SCRIPTURES}/greek/strongs-greek-dictionary.js`, '7624ee738ae47e80f1a352223e28a26d011c9cd4898822cee52f47a010c04efd'),

  // Strong's-tagged KJV (CrossWire Bible Society; text public domain, module GPL)
  kjvOsis: source(`${CROSSWIRE}/kjv.osis.xml`, '4bcbfe45722fca396adbeac9c81025bbb173cb1e30296da90864f0400cb0e3f5'),

  // English verse numbering and how it maps to the Hebrew (Paratext eng.vrs, via BibleNLP/ebible)
  englishVersification: source(`${EBIBLE_CORPUS}/metadata/eng.vrs`, '003981c7f43c69b73b60d40a3f35f72e7ee017a686a6fb206f19a1b721157541'),
};

/** Every translation except the KJV, keyed by its id in src/lib/translations.ts. */
export const TRANSLATION_SOURCES: Record<string, TranslationSource> = {
  BSB: scrollmapper('BSB.json', 'cec3c644088a8ef4a50cf1e2de035f79d8825f394625d116bb7ee7e1d57739c9'),
  WEB: { format: 'usfx', source: source(`${OPEN_BIBLES}/eng-web.usfx.xml`, '5ffa2626f170a109a4a96afc90775c06f0821cb4ba81ed34e63663e085708d68') },
  LSV: { format: 'chapters', source: chapters('en-lsv', '3f20223b137dfab4c90e00b11da40a127752e726460c5d549f530113ce83e4c8', { songofsolomon: 'songofsongs' }) },
  ASV: scrollmapper('ASV.json', '602445e22c280a682ac4c489117ead179271f5ee50a78ee4531b249c71e7ce99'),
  YLT: scrollmapper('YLT.json', 'd55ef42dae715c4fc5d00049011b818a42a99e0ff419f5f08bc37cea0b4f12e3'),
  // scrollmapper's Darby has lost spaces before capitals ("ofGod"), so it comes from open-bibles
  DBY: { format: 'zefania', source: source(`${OPEN_BIBLES}/eng-darby.zefania.xml`, '387887cec188342b0a4f9eb26aee8578fc88594d63c52204dfebe86c16b4514f') },
  WBT: scrollmapper('Webster.json', '21d32fca7a463385a5049aca0894318fd60396211be72fd8e8ee9ed76bd6355e'),
  UKJV: scrollmapper('UKJV.json', 'bdfd7bbc03786a1c077ff292595f8768d201582a87b236d2466c603fdc9cc01b'),
  BBE: scrollmapper('BBE.json', '2396c027cfd1c47c9bb325c5c1ed1b1c125b95ef4c5382ddba4f8e50651f8068'),
  OEB: scrollmapper('OEB.json', '7b1552b1d39027f909f23e5b0dc25116fb1dd6c785cac5aac4c2e56dd1082c89'),
  JPS: scrollmapper('JPS.json', 'cb698cfbf2e97843dd4357b725c96ac6e9b2f3f23c5e3e3f6a3cdb5912ca183a', true),
  CPDV: scrollmapper('CPDV.json', 'f91a5dc9556d77a441a18adff5a272f8f4b1fea1745e01d0c3c2a93aa7929a38'),
  WYC: scrollmapper('Wycliffe.json', '61a5d8486068d3b9d66fa2bb3664ecd9db3d3d81a3dbe5267300663336854edf'),
  VUL: scrollmapper('Vulgate.json', '9fb72853e4086b61370c8370a9223b09f853b7e44b588e444915f4a2b7c95345'),
};
