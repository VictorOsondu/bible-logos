import Database from 'better-sqlite3';
import { hasLibrarySchema, DatabaseMigrationRequiredError } from './library-schema';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function getDbPath(): string {
  return path.join(process.cwd(), 'data', 'bible.db');
}

export function isDatabaseAvailable(): boolean {
  const dbPath = getDbPath();
  return fs.existsSync(dbPath);
}

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = getDbPath();
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(dbPath)) {
      throw new DatabaseNotAvailableError(
        'Database not found. Run "npm run seed" to populate the database.'
      );
    }
    const opened = new Database(dbPath, { readonly: true, fileMustExist: true });
    if (!hasLibrarySchema(opened)) { opened.close(); throw new DatabaseMigrationRequiredError(); }
    db = opened;
  }
  return db;
}

/** The translations present in the database (an optional one may have been skipped by the seed). */
export function getAvailableTranslations(): string[] {
  return (getDb().prepare('SELECT DISTINCT translation FROM verses').all() as { translation: string }[]).map(t => t.translation);
}

export class DatabaseNotAvailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseNotAvailableError';
  }
}
