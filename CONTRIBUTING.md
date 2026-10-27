# Contributing to Bible Logos

Thank you for helping. Bible Logos is a personal study and research tool and a **work in progress**, so careful checking is as valuable as new code.

## Ways to help

- **Report mistakes.** If a verse, cross-reference, Strong's entry or reference page looks wrong, [open an issue](https://github.com/VictorOsondu/bible-logos/issues) with the passage, the translation and what you expected to see. Errors in the text matter more than anything else.
- **Check data.** Compare a book or a reference index (parables, prophecies, people and so on) against a printed Bible and report what you find.
- **Suggest improvements.** Open an issue first for anything larger than a small fix, so we can agree on the approach before you spend time on it.
- **Fix bugs and improve the code**, following the guidelines below.

## Ground rules for content

- **Open licences only.** Every Bible text and dataset must be in the public domain or under an open licence that allows redistribution (such as CC0, CC BY or CC BY-SA). Check the licence before proposing a new source, and never add copyrighted text.
- **Credit every source.** Add new data sources to the table in the README, and new translations to `src/lib/translations.ts` with their licence. Licences that require attribution (such as CC BY-SA) are shown beneath the text in the reader.
- **Do not change the wording of a translation.** Fix how text is read or displayed, not the translation itself.
- **Prefer complete, published datasets** downloaded by the seed script over hand-typed lists. Nothing from a source is committed to the repository.
- **Distinguish text from study commentary.** Reference pages present sources. Themes may offer original guided explanations and questions grounded in linked passages; acknowledge significant differences between Christian interpretations. New Themes prose belongs in `src/content/themes/studies.json` under CC BY-NC 4.0 (see `public/themes-licence.txt`). Do not apply this exception to imported Bible texts or datasets.

## Setting up

You need Node.js 20.9 or later.

```bash
git clone https://github.com/VictorOsondu/bible-logos.git
cd bible-logos
npm install
npm run seed   # downloads the texts and builds data/bible.db
npm run dev    # http://localhost:3000
```

## Working on the code

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 and SQLite (`better-sqlite3`, read-only at run time).
- **Data:** `scripts/seed.ts` builds the database. Each download in `scripts/sources.ts` is pinned to an exact commit and SHA-256 hash. To add or update one, set its URL, run `npm run seed` and copy the hash it reports. New text formats are read in `scripts/bibles.ts`, and all translations are stored with English (KJV) verse numbers.
- **Style:** match the code around you. Keep components small, avoid new dependencies unless they clearly earn their place, and keep the interface calm and uncluttered.
- **Accessibility:** everything must work by keyboard and with a screen reader, in light and dark themes, and on a phone.
- **Spelling:** UK English in the interface, code comments and documentation.

## Before opening a pull request

1. Create a branch from `main`.
2. Run the checks (CI runs the same ones):

   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run build
   npm run test:e2e   # needs `npx playwright install chromium` once
   ```

3. Add tests for new behaviour, especially anything that parses or queries data.
4. Keep each pull request to one change, and describe what changed and why. Add screenshots for visual changes.

## Licence

By contributing code or general documentation, you agree to the [MIT licence](LICENSE). By contributing original Themes study prose in `src/content/themes/studies.json`, you agree to [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/), with the scope and attribution in [the Themes content notice](public/themes-licence.txt). Bible texts and datasets keep their own licences, as listed in the README. Only contribute material you have permission to license on these terms; previous MIT permissions remain valid.
