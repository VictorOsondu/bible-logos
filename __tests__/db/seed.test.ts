import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, seedTestDb } from '../helpers/test-db';
import Database from 'better-sqlite3';

describe('Seed Data Integrity', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDb();
    seedTestDb(db);
  });

  it('all tables exist', () => {
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).all() as { name: string }[];
    const names = tables.map(t => t.name);
    expect(names).toContain('verses');
    expect(names).toContain('cross_references');
    expect(names).toContain('strongs');
    expect(names).toContain('word_strongs');
    expect(names).toContain('verse_tokens');
  });

  it('all indexes exist', () => {
    const indexes = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
    ).all() as { name: string }[];
    const names = indexes.map(i => i.name);
    expect(names).toContain('idx_verses_ref');
    expect(names).toContain('idx_verses_translation');
    expect(names).toContain('idx_crossref_from');
    expect(names).toContain('idx_crossref_to');
  });

  it('FTS table exists and is populated', () => {
    const count = db.prepare("SELECT COUNT(*) as c FROM verses_fts").get() as { c: number };
    expect(count.c).toBeGreaterThan(0);
  });

  it('verse-strongs foreign keys are valid', () => {
    const orphans = db.prepare(`
      SELECT ws.id, ws.strongs_id FROM word_strongs ws
      LEFT JOIN strongs s ON s.id = ws.strongs_id
      WHERE s.id IS NULL
    `).all();
    expect(orphans).toHaveLength(0);
  });

  it('verse data is not empty', () => {
    const c = db.prepare("SELECT COUNT(*) as c FROM verses").get() as { c: number };
    expect(c.c).toBeGreaterThan(5);
  });
});
