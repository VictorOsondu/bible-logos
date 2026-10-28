"""Independently compare imported Greek and USFX text with verified cached sources.
Run after npm run seed or npm run import:library. Uses only Python's standard library.
"""
import gzip
import hashlib
import json
import re
import sqlite3
import zipfile
from collections import OrderedDict
from pathlib import Path
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parent.parent
cache = root / 'data/sources'
db = sqlite3.connect(f'file:{root / "data/bible.db"}?mode=ro', uri=True)
assert db.execute('pragma integrity_check').fetchone()[0] == 'ok'


def verified_zip(prefix):
    source = next(cache.glob(prefix + '-*.zip'))
    archive_bytes = source.read_bytes()
    metadata = db.execute('select sha256 from library_imports where sha256 like ?', (prefix + '%',)).fetchone()
    assert hashlib.sha256(archive_bytes).hexdigest() == metadata[0]
    archive = zipfile.ZipFile(source)
    return ET.fromstring(archive.read(next(n for n in archive.namelist() if n.endswith('usfx.xml'))))


def imported(version):
    return {(b, c, label): text for b, c, label, text in db.execute('select book, chapter, native_label, text from verses where translation=?', (version,))}


manifest = json.loads((root / 'scripts/library-swete.json').read_text())
texts = json.loads(gzip.decompress((cache / (manifest['sha256'][:16] + '-lxx-swete.json.gz')).read_bytes()))
assert hashlib.sha256(''.join(texts).encode()).hexdigest() == manifest['sha256']
expected = {}
for entry, text in zip(manifest['files'], texts, strict=True):
    groups = OrderedDict()
    for line in text.splitlines():
        if not line.strip():
            continue
        reference, word = line.split(' ', 1)
        _, chapter, label = reference.split('.')
        groups.setdefault((chapter, label), []).append(word)
    for (chapter, label), words in groups.items():
        ch = {'prologue': 0, 'iva': 15, 'ivb': 16}.get(chapter)
        ch = int(chapter) if ch is None else ch
        work = entry['work']
        if work == 19 and ch == 151:
            work, ch = 77, 1
        expected[(work, ch, label)] = ' '.join(words)
assert imported('LXX-SWETE') == expected, 'Swete text/reference mismatch'
print(f'Swete: {len(expected):,} native passages match the pinned source word for word')

codes = 'MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV'.split()
web = dict(zip('TOB JDT BAR ESG WIS SIR 1MA 2MA 1ES MAN PS2 3MA 2ES 4MA DAG'.split(), [67,68,69,70,71,72,73,74,75,76,77,78,79,80,88]))
for version, prefix, mapping in [('HEB-SG', 'f93d5f56e1d3b90d', dict(zip(codes, range(40,67)))), ('WEB-DC', 'd4166234bcdf74f3', web)]:
    expected = {}
    for book in verified_zip(prefix).findall('book'):
        work = mapping.get(book.attrib['id'])
        if work is None:
            continue
        state = {'chapter': None, 'label': None, 'parts': []}

        def visit(node):
            tag = node.tag
            if tag in ('f', 'x', 'fe', 'vp'):
                return
            if tag == 'c':
                state['chapter'] = int(node.attrib['id'])
            if tag == 'v':
                state['label'], state['parts'] = node.attrib['id'], []
            if tag == 've':
                text = re.sub(r'\s+', ' ', ''.join(state['parts'])).strip()
                if text:
                    expected[(work, state['chapter'], state['label'])] = text
                state['label'] = None
            if node.text and state['label'] is not None:
                state['parts'].append(node.text)
            for child in node:
                visit(child)
                if child.tail and state['label'] is not None:
                    state['parts'].append(child.tail)
        visit(book)
    assert imported(version) == expected, f'{version}: source text/reference mismatch'
    print(f'{version}: {len(expected):,} passages match independently parsed source XML')

assert db.execute('select count(*) from (select translation, book, chapter, verse from verses group by translation, book, chapter, verse having count(*) > 1)').fetchone()[0] == 0
assert db.execute('select count(*) from verses v left join edition_chapters c on c.translation=v.translation and c.book=v.book and c.chapter=v.chapter where c.book is null').fetchone()[0] == 0
for version, chapters in [('DID-HB',16), ('ENO-CHARLES',108)]:
    actual = db.execute('select chapter, text from verses where translation=? order by chapter', (version,)).fetchall()
    assert [c for c, _ in actual] == list(range(1, chapters + 1))
    assert all(text.strip() and 'CHAPTER_' not in text and 'Printed in Great Britain' not in text for _, text in actual)
    print(f'{version}: all {chapters} chapter sections present and nonempty')
print('No duplicate references, orphan chapter records or SQLite integrity errors')
