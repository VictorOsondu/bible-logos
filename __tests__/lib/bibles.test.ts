import { describe, it, expect } from 'vitest';
import {
  cleanText, parseChapterBundle, parseScrollmapper, parseTahot, parseUsfm, parseUsfx, readableTransliteration, parseVersificationMappings, parseZefania, toEnglishVersification,
} from '../../scripts/bibles';

describe('Bible text parsers', () => {
  it('reads scrollmapper JSON, skipping the Apocrypha and empty verses', () => {
    const json = JSON.stringify({
      books: [
        { name: 'I John', chapters: [{ chapter: 4, verses: [{ verse: 8, text: 'God is love.' }, { verse: 9, text: '  ' }] }] },
        { name: 'Tobit', chapters: [{ chapter: 1, verses: [{ verse: 1, text: 'Not included.' }] }] },
      ],
    });
    expect(parseScrollmapper(json)).toEqual([{ book: 62, chapter: 4, verse: 8, text: 'God is love.' }]);
  });

  it('reads Zefania XML and decodes entities', () => {
    const xml = '<BIBLEBOOK bnumber="43" bname="John"><CHAPTER cnumber="11"><VERS vnumber="35">Jesus &amp; wept.</VERS></CHAPTER></BIBLEBOOK>';
    expect(parseZefania(xml)).toEqual([{ book: 43, chapter: 11, verse: 35, text: 'Jesus & wept.' }]);
  });

  it('reads USFX and leaves out footnotes and cross-references', () => {
    const xml = '<book id="GEN"><c id="1"/><p><v id="1"/>In the beginning, God<f caller="+">The Hebrew word is “Elohim”.</f> created<x caller="-">Jn 1:1</x> the heavens.\n<ve/></p></book>' +
      '<book id="TOB"><c id="1"/><v id="1"/>Skipped.<ve/></book>';
    expect(parseUsfx(xml)).toEqual([{ book: 1, chapter: 1, verse: 1, text: 'In the beginning, God created the heavens.' }]);
    // eBible.org's own files add attributes and spaces before the closing slash
    expect(parseUsfx('<book id="JHN"><c id="11" /><p><v id="35" bcv="JHN.11.35" /><w s="G2424">Yeshua</w> wept.\n<ve /></p></book>'))
      .toEqual([{ book: 43, chapter: 11, verse: 35, text: 'Yeshua wept.' }]);
  });

  it('reads an assembled chapter bundle and joins poetry lines', () => {
    expect(parseChapterBundle(JSON.stringify([[19, 23, 1, 'YHWH [is] my shepherd, || I do not lack,']])))
      .toEqual([{ book: 19, chapter: 23, verse: 1, text: 'YHWH [is] my shepherd, I do not lack,' }]);
    expect(cleanText('  a\n  b || c ')).toBe('a b c');
  });
});

describe('USFM', () => {
  it('reads word-aligned USFM, leaving out titles, headings, footnotes and alignment', () => {
    const usfm = [
      '\\id PSA EN_ULT', '\\h Psalms', '\\c 23', '\\d A psalm of David.', '\\q1',
      '\\c 24', '\\v 1 \\d A psalm of David', '\\q1 \\w The|x-occurrence="1"\\w* \\w earth|x-occurrence="1"\\w*.',
      '\\c 23', '\\v 1 \\zaln-s |x-strong="H3068"\\*\\w Yahweh|x-occurrence="1"\\w*\\zaln-e\\* \\w is|x-occurrence="1"\\w*',
      '\\w my|x-occurrence="1"\\w* \\w shepherd|x-occurrence="1"\\w*\\f + \\ft A note.\\f*;',
      '\\s1 A heading', '\\v 2-3 \\w He|x-occurrence="1"\\w* \\add makes\\add* \\w me|x-occurrence="1"\\w* \\w lie|x-occurrence="1"\\w* \\w down|x-occurrence="1"\\w*.',
    ].join('\n');
    expect(parseUsfm(usfm)).toEqual([
      { book: 19, chapter: 24, verse: 1, text: 'A psalm of David. The earth.' },
      { book: 19, chapter: 23, verse: 1, text: 'Yahweh is my shepherd;' },
      { book: 19, chapter: 23, verse: 2, text: 'He makes me lie down.' },
    ]);
  });
});

describe('TAHOT transliteration', () => {
  it('drops syllable dots, prefix slashes and placeholders but keeps the stress', () => {
    expect(readableTransliteration('be./re.Shit')).toBe('bereShit');
    expect(readableTransliteration("Kedor-la.'\u05B9o.mer")).toBe("Kedor-la'omer");
    expect(readableTransliteration('[ ]')).toBe('');
  });

  it('joins words into verses, linking maqqef words and placing psalm titles before verse 1', () => {
    const rows = [
      'Eng (Heb) Ref & Type\tHebrew\tTransliteration\tTranslation',
      'Gen.1.1#01=L\tבְּ/רֵאשִׁ֖ית\tbe./re.Shit\tin/ beginning',
      'Gen.1.1#02=L\tבָּרָ֣א\tba.Ra\'\the created',
      'Gen.4.8#03=L\tאֶל\t\'el-\tto',
      'Gen.4.8#04=L\tהֶבֶל\tHe.vel\tAbel',
      'Gen.4.8#0501=X\tנֵלְכָה\tne.le.Khah\tlet us go',
      'Psa.23.0(23.1)#01=L\tמִזְמוֹר\tmiz.Mor\ta psalm',
      'Psa.23.1(23.1)#03=L\tיְהוָה\tYah.weh\tYahweh',
      'Mal.4.1(3.19)#01=L\tכִּי\tki-\tfor',
      'Mal.4.1(3.19)#02=L\tהִנֵּה\thi.Neh\tbehold',
      '1Sa.9.1#04=Q(K)\t\t[ ]\t',
    ].join('\n');
    expect(parseTahot(rows)).toEqual([
      { book: 1, chapter: 1, verse: 1, text: "bereShit baRa'" },
      { book: 1, chapter: 4, verse: 8, text: "'el-Hevel" },
      { book: 19, chapter: 23, verse: 1, text: 'mizMor Yahweh' },
      { book: 39, chapter: 4, verse: 1, text: 'ki-hiNeh' },
    ]);
  });
});

describe('versification', () => {
  const mappings = parseVersificationMappings([
    '# comment = ignored',
    'MAL 4:1-6 = MAL 3:19-24',
    'PSA 3:0-8 = PSA 3:1-9',
    'PSA 51:0 = PSA 51:1',
    'PSA 51:0 = PSA 51:2',
    'PSA 51:1-19 = PSA 51:3-21',
    'TOB 1:1 = TOB 1:2',
  ].join('\n'));

  it('maps Hebrew references to English ones', () => {
    expect(mappings.get('39:3:19')).toBe('39:4:1');
    expect(mappings.get('39:3:24')).toBe('39:4:6');
    expect(mappings.get('19:3:1')).toBe('19:3:0');
    expect(mappings.get('19:51:3')).toBe('19:51:1');
  });

  it('renumbers verses and joins psalm titles to verse 1', () => {
    const hebrew = [
      { book: 39, chapter: 3, verse: 18, text: 'Then shall ye discern.' },
      { book: 39, chapter: 3, verse: 19, text: 'For, behold, the day cometh.' },
      { book: 19, chapter: 51, verse: 1, text: 'For the Leader.' },
      { book: 19, chapter: 51, verse: 2, text: 'When Nathan came.' },
      { book: 19, chapter: 51, verse: 3, text: 'Be gracious unto me, O God.' },
    ];
    expect(toEnglishVersification(hebrew, mappings)).toEqual([
      { book: 39, chapter: 3, verse: 18, text: 'Then shall ye discern.' },
      { book: 39, chapter: 4, verse: 1, text: 'For, behold, the day cometh.' },
      { book: 19, chapter: 51, verse: 1, text: 'For the Leader. When Nathan came. Be gracious unto me, O God.' },
    ]);
  });
});
