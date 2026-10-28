import Database from 'better-sqlite3';
import fs from 'fs';
/** Replace a database only after its copy has imported and passed validation. */
export async function updateLibraryDatabase(live: string, importer: (db: Database.Database) => Promise<void>) {
  const build = `${live}.library-building`;
  const lock = `${live}.import-lock`;
  const handle = fs.openSync(lock, 'wx');
  let db: Database.Database | undefined;
  try {
    const original = new Database(live, { readonly: true, fileMustExist: true });
    try {
      if (original.pragma('journal_mode', { simple: true }) === 'wal') throw new Error('Stop database writers and switch the database to DELETE journal mode before replacing it.');
      await original.backup(build);
    } finally { original.close(); }
    db = new Database(build);
    await importer(db);
    db.exec("INSERT INTO verses_fts(verses_fts) VALUES ('rebuild')");
    const check = db.pragma('integrity_check') as { integrity_check: string }[];
    if (check.some(r => r.integrity_check !== 'ok')) throw new Error('Database integrity check failed');
    db.pragma('journal_mode = DELETE');
    db.close();
    fs.renameSync(build, live);
  } finally {
    if (db?.open) db.close();
    for (const file of [build, `${build}-wal`, `${build}-shm`]) if (fs.existsSync(file)) fs.unlinkSync(file);
    fs.closeSync(handle);
    fs.unlinkSync(lock);
  }
}
