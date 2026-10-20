// Runs before `npm run build`: pages built ahead of time read the database, so it must exist.
import fs from 'node:fs';
import path from 'node:path';

const db = path.join(process.cwd(), 'data', 'bible.db');
if (!fs.existsSync(db)) {
  console.error(`\n✖ ${path.relative(process.cwd(), db)} not found. Run "npm run seed" before building.\n`);
  process.exit(1);
}
