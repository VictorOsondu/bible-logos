// Add/refresh the library without re-downloading the existing Bible/concordance datasets.
import path from 'path';
import { importLibrary } from './library';
import { updateLibraryDatabase } from './library-database';
updateLibraryDatabase(path.join(process.cwd(), 'data/bible.db'), importLibrary)
  .then(() => console.log('Library imported; existing Bible texts preserved.'))
  .catch(error => { console.error(error); process.exitCode = 1; });
