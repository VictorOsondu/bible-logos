import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import Database from 'better-sqlite3';
import { readerHref } from '@/lib/reader-links';
import { queryValue, boundedInteger } from '@/lib/query-params';
import { chaptersFor } from '@/lib/edition-catalogue';
import { hasLibrarySchema } from '@/lib/library-schema';
import { parseLibraryUsfx } from '../../scripts/library';
import { updateLibraryDatabase } from '../../scripts/library-database';

describe('library audit regression checks', () => {
  it('normalizes repeated query parameters and limits unsafe offsets', () => {
    expect(queryValue(['word', 'light'])).toBe('word');
    expect(queryValue([], 'KJV')).toBe('KJV');
    for (const offset of ['999999999999999999999999', 'NaN', '-5', '1 OR 1=1']) expect(boundedInteger(offset, 0, 0, 1000000)).toBe(0);
    expect(boundedInteger('1000001', 0, 0, 1000000)).toBe(1000000);
  });
  it('retains native chapter choices when the first edition is removed or changed', () => {
    const selections = [{ version: 'KJV', chapter: 107 }, { version: 'LXX-SWETE', chapter: 106 }];
    expect(readerHref('psalms', selections.slice(1))).toBe('/reader/psalms/106?translations=LXX-SWETE');
    const next = readerHref('psalms', [{ ...selections[0], chapter: 108 }, selections[1]]);
    const url = new URL(next, 'http://localhost');
    expect(url.pathname).toBe('/reader/psalms/108');
    expect(url.searchParams.get('chapters')).toBe('KJV:108,LXX-SWETE:106');
  });
  it('reads compact catalogues including source chapter zero', () => {
    expect(chaptersFor({ 'LXX-SWETE': { 70: [[0, 'prologue', 17], [1, null, 22]] } }, 'LXX-SWETE', 70)).toEqual([{ chapter: 0, label: 'prologue', maxVerse: 17, missingVerses: [] }, { chapter: 1, label: '1', maxVerse: 22, missingVerses: [] }]);
    expect(chaptersFor({}, 'missing', 1)).toEqual([]);
  });
  it('retains combined verse labels and explains source omissions without inventing text', () => {
    const notes: { book: number; chapter: number; label: string; text: string }[] = [];
    const verses = parseLibraryUsfx('<book id="SIR"><c id="11"/><v id="15-16"/><f><fr>11:15-16</fr><ft>Omitted by the source.</ft></f><ve/><v id="17-18"/>Actual text.<ve/></book>', { SIR: 72 }, notes);
    expect(verses).toEqual([{ book: 72, chapter: 11, verse: 17, label: '17-18', text: 'Actual text.' }]);
    expect(notes).toEqual([{ book: 72, chapter: 11, label: '15-16', text: 'Omitted by the source.' }]);
  });
  it('detects a database that has not received the library migration', () => {
    const db = new Database(':memory:');
    expect(hasLibrarySchema(db)).toBe(false);
    db.close();
  });
  it('leaves the live database byte-for-byte intact when an import fails', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'logos-import-failure-'));
    const live = path.join(dir, 'bible.db');
    try {
      const original = new Database(live);
      original.exec('CREATE TABLE verses(id INTEGER PRIMARY KEY, text TEXT); INSERT INTO verses VALUES(1, \'Original\'); CREATE VIRTUAL TABLE verses_fts USING fts5(text, content=verses, content_rowid=id);');
      original.close();
      const before = fs.readFileSync(live);
      await expect(updateLibraryDatabase(live, async db => { db.exec("UPDATE verses SET text = 'Unfinished'"); throw new Error('Simulated source validation failure'); })).rejects.toThrow('Simulated source');
      expect(fs.readFileSync(live)).toEqual(before);
      expect(fs.readdirSync(dir)).toEqual(['bible.db']);
      await updateLibraryDatabase(live, async db => { db.exec("UPDATE verses SET text = 'Validated'"); });
      const after = new Database(live, { readonly: true });
      expect(after.prepare('SELECT text FROM verses').get()).toEqual({ text: 'Validated' });
      expect(after.prepare("SELECT COUNT(*) AS n FROM verses_fts WHERE text MATCH 'Validated'").get()).toEqual({ n: 1 });
      after.close();
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
  it('refuses overlapping imports without deleting another importer’s lock', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'logos-import-lock-'));
    const live = path.join(dir, 'bible.db');
    fs.writeFileSync(`${live}.import-lock`, 'owned');
    try {
      await expect(updateLibraryDatabase(live, async () => {})).rejects.toThrow();
      expect(fs.readFileSync(`${live}.import-lock`, 'utf8')).toBe('owned');
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});
