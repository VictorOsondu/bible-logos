// Every file the seed script downloads, pinned to an exact commit and checked against a SHA-256
// hash, so a change upstream can never silently alter (or break) the database.
//
// To update a source: change its commit, run `npm run seed`, and replace the hashes it reports.

const SCROLLMAPPER = 'https://raw.githubusercontent.com/scrollmapper/bible_databases/e1b254cef86d0e65b1a5d1a94b8b112d0f296a2c/formats';
const OPEN_SCRIPTURES = 'https://raw.githubusercontent.com/openscriptures/strongs/0acd2f251c2d35ff8db2dece4e0593979d3ac223';
const CROSSWIRE = 'https://gitlab.com/crosswire-bible-society/kjv/-/raw/d490be7e34762deb2c76cb2c1306d4808e27890d';

export interface Source {
  url: string;
  sha256: string;
}

const source = (url: string, sha256: string): Source => ({ url, sha256 });

export const SOURCES = {
  // Translations (scrollmapper/bible_databases)
  asv: source(`${SCROLLMAPPER}/json/ASV.json`, '602445e22c280a682ac4c489117ead179271f5ee50a78ee4531b249c71e7ce99'),
  bbe: source(`${SCROLLMAPPER}/json/BBE.json`, '2396c027cfd1c47c9bb325c5c1ed1b1c125b95ef4c5382ddba4f8e50651f8068'),
  ylt: source(`${SCROLLMAPPER}/json/YLT.json`, 'd55ef42dae715c4fc5d00049011b818a42a99e0ff419f5f08bc37cea0b4f12e3'),
  vulgate: source(`${SCROLLMAPPER}/json/Vulgate.json`, '9fb72853e4086b61370c8370a9223b09f853b7e44b588e444915f4a2b7c95345'),

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
};
