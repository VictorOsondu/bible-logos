import type Database from 'better-sqlite3';
export function hasLibrarySchema(db: Database.Database): boolean {
  const hasColumns = (table: string, required: string[]) => {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    return required.every(name => columns.some(c => c.name === name));
  };
  return hasColumns('verses', ['native_label', 'position']) && hasColumns('edition_chapters', ['label', 'position', 'last_verse', 'missing_verses']) && hasColumns('library_imports', ['sha256']) && hasColumns('library_fts', ['text']) && hasColumns('edition_notes', ['text']);
}
export class DatabaseMigrationRequiredError extends Error {
  constructor() { super('Database needs the text-library migration. Stop the app, run "npm run import:library", then restart it.'); this.name = 'DatabaseMigrationRequiredError'; }
}
