import { describe, it, expect } from 'vitest';
import {
  cleanText, parseChapterBundle, parseScrollmapper, parseUsfx, parseVersificationMappings, parseZefania, toEnglishVersification,
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
  });

  it('reads an assembled chapter bundle and joins poetry lines', () => {
    expect(parseChapterBundle(JSON.stringify([[19, 23, 1, 'YHWH [is] my shepherd, || I do not lack,']])))
      .toEqual([{ book: 19, chapter: 23, verse: 1, text: 'YHWH [is] my shepherd, I do not lack,' }]);
    expect(cleanText('  a\n  b || c ')).toBe('a b c');
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
