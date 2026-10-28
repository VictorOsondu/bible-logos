// Runs before `npm run build`: pages built ahead of time read the database, so it must exist.
import fs from 'node:fs';
import Database from 'better-sqlite3';
import path from 'node:path';

const db = path.join(process.cwd(), 'data', 'bible.db');
if (!fs.existsSync(db)) {
  console.error(`\n✖ ${path.relative(process.cwd(), db)} not found. Run "npm run seed" before building.\n`);
  process.exit(1);
}

const connection = new Database(db, { readonly: true, fileMustExist: true });
try {
  const columns = connection.prepare('PRAGMA table_info(edition_chapters)').all();
  if (!columns.some(c => c.name === 'last_verse') || !columns.some(c => c.name === 'missing_verses') || !connection.prepare("SELECT 1 FROM sqlite_master WHERE name = 'edition_notes'").get()) {
    console.error('Database needs the text-library migration. Stop the app and run "npm run import:library" before building.');
    process.exitCode = 1;
  }
} finally { connection.close(); }
