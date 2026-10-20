import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { toFtsQuery } from '../../src/lib/search';

describe('toFtsQuery', () => {
  it('quotes each word so all must match', () => {
    expect(toFtsQuery('good shepherd')).toBe('"good" "shepherd"');
  });

  it('keeps quoted phrases together', () => {
    expect(toFtsQuery('"the good shepherd" sheep')).toBe('"the good shepherd" "sheep"');
  });

  it('keeps a trailing * as a prefix search', () => {
    expect(toFtsQuery('shepherd*')).toBe('"shepherd"*');
  });

  it('neutralises FTS operators and stray quotes', () => {
    expect(toFtsQuery('love AND')).toBe('"love" "AND"');
    expect(toFtsQuery('NEAR(a')).toBe('"NEAR(a"');
    expect(toFtsQuery('"')).toBeNull();
    expect(toFtsQuery('   ')).toBeNull();
  });

  it('produces queries SQLite accepts', () => {
    const db = new Database(':memory:');
    db.exec("CREATE VIRTUAL TABLE t USING fts5(text); INSERT INTO t VALUES ('The LORD is my shepherd'), ('good shepherds')");
    const count = (input: string) => (db.prepare('SELECT COUNT(*) AS c FROM t WHERE t MATCH ?').get(toFtsQuery(input)) as { c: number }).c;
    expect(count('shepherd')).toBe(1);
    expect(count('shepherd*')).toBe(2);
    expect(count('"my shepherd"')).toBe(1);
    expect(count('NEAR( "AND OR')).toBe(0);
  });
});
