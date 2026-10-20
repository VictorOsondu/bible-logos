import { describe, it, expect } from 'vitest';
import { normaliseStrongsId, parseLexicon, parseKjvOsis, tokeniseVerse, tokensToText } from '../../scripts/kjv-strongs';

// Excerpts copied from the CrossWire KJV OSIS module
const GEN_1_1 = '<w lemma="strong:H07225">In the beginning</w> <w lemma="strong:H0430">God</w> <w morph="strongMorph:TH8804" lemma="strong:H0853 strong:H01254">created</w> <w lemma="strong:H08064">the heaven</w> <w lemma="strong:H0853">and</w> <w lemma="strong:H0776">the earth</w>.';
const JOHN_3_16_START = '<milestone type="x-p" marker="¶"/><w src="17" lemma="strong:G3588 lemma.TR:ο" morph="robinson:T-NSM"/><w src="2" lemma="strong:G1063 lemma.TR:γαρ" morph="robinson:CONJ">For</w> <w src="4 5" lemma="strong:G3588 strong:G2316 lemma.TR:ο lemma.TR:θεος" morph="robinson:T-NSM robinson:N-NSM">God</w> <w src="1" lemma="strong:G3779 lemma.TR:ουτως" morph="robinson:ADV">so</w> <w src="3" lemma="strong:G25 lemma.TR:ηγαπησεν" morph="robinson:V-AAI-3S">loved</w>';
const GEN_1_2_PART = '<w lemma="strong:H02822">and darkness</w> <transChange type="added">was</transChange> <w lemma="strong:H06440">upon the face</w>';
const PS_3_1_PART = '<w lemma="strong:H03068"><divineName>Lord</divineName></w>, <w morph="strongMorph:TH8804" lemma="strong:H07231">how are they increased</w>';
const GEN_1_13_NOTE = '<w lemma="strong:H03117">day</w>.<note type="study"><catchWord>And the evening…</catchWord>: Heb. <rdg type="x-literal">And the evening was</rdg> etc.</note>';

describe('normaliseStrongsId', () => {
  it('strips zero padding', () => {
    expect(normaliseStrongsId('H07225')).toBe('H7225');
    expect(normaliseStrongsId('G3588')).toBe('G3588');
  });

  it('rejects anything that is not a Strong\'s number', () => {
    expect(normaliseStrongsId('lemma.TR:θεος')).toBeNull();
    expect(normaliseStrongsId('X12')).toBeNull();
  });
});

describe('tokeniseVerse', () => {
  it('reproduces the verse text exactly', () => {
    expect(tokensToText(tokeniseVerse(GEN_1_1))).toBe('In the beginning God created the heaven and the earth.');
  });

  it('keeps multi-word phrases and all their Strong\'s numbers together', () => {
    const tokens = tokeniseVerse(GEN_1_1);
    expect(tokens[0]).toEqual({ t: 'In the beginning', s: ['H7225'] });
    expect(tokens).toContainEqual({ t: 'created', s: ['H853', 'H1254'] });
  });

  it('skips untranslated Greek words and keeps Robinson morphology', () => {
    const tokens = tokeniseVerse(JOHN_3_16_START);
    expect(tokensToText(tokens)).toBe('For God so loved');
    expect(tokens).toContainEqual({ t: 'God', s: ['G3588', 'G2316'], m: 'T-NSM N-NSM' });
    expect(tokens).toContainEqual({ t: 'loved', s: ['G25'], m: 'V-AAI-3S' });
  });

  it('marks words added by the translators', () => {
    expect(tokeniseVerse(GEN_1_2_PART)).toContainEqual({ t: 'was', a: 1 });
  });

  it('prints divine names in capitals as the KJV does', () => {
    expect(tokensToText(tokeniseVerse(PS_3_1_PART))).toBe('LORD, how are they increased');
  });

  it('drops study notes', () => {
    expect(tokensToText(tokeniseVerse(GEN_1_13_NOTE))).toBe('day.');
  });
});

describe('parseKjvOsis', () => {
  it('maps OSIS book names to book numbers', () => {
    const xml = `<chapter osisID="John.3"><verse osisID="John.3.16" sID="John.3.16"/>${JOHN_3_16_START}<verse eID="John.3.16"/>`
      + `<verse osisID="Gen.1.1" sID="Gen.1.1"/>${GEN_1_1}<verse eID="Gen.1.1"/>`;
    const verses = parseKjvOsis(xml);
    expect(verses.map(v => [v.book, v.chapter, v.verse])).toEqual([[43, 3, 16], [1, 1, 1]]);
  });
});

describe('parseLexicon', () => {
  const js = `/** header */
var strongsGreekDictionary = {"G25":{"derivation":"perhaps from (much);","strongs_def":" to love (in a social or moral sense)","kjv_def":"(be-)love(-ed)","translit":"agapáō","lemma":"ἀγαπάω"},
"G26":{"strongs_def":"{love}","kjv_def":"charity","translit":"agápē","lemma":"ἀγάπη"}}; module.exports = strongsGreekDictionary;`;

  it('reads entries and cleans definitions', () => {
    const entries = parseLexicon(js, 'greek');
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      id: 'G25', original: 'ἀγαπάω', transliteration: 'agapáō',
      definition: 'to love (in a social or moral sense)', kjv_usage: '(be-)love(-ed)', language: 'greek',
    });
    expect(entries[1].definition).toBe('love');
  });

  it('fails loudly on an unrecognised file', () => {
    expect(() => parseLexicon('not a lexicon', 'hebrew')).toThrow();
  });
});
