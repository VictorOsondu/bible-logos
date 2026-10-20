# Contributing to Bible Logos

Bible Logos is a personal study and research tool, but suggestions and fixes are welcome.

## Setting up

1. Clone the repository: `git clone https://github.com/VictorOsondu/bible-logos.git`
2. Install dependencies: `npm install`
3. Build the database: `npm run seed`
4. Start the dev server: `npm run dev`

## Working on the code

- **Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, SQLite (better-sqlite3)
- **Tests**: Vitest (`npm test`). Please add tests for new behaviour, especially anything that parses or queries data.
- **Data**: reference data is downloaded by `scripts/seed.ts`, not committed. Prefer complete, openly licensed datasets over hand-typed lists, and credit the source in the README.
- **Spelling**: UK English in the interface and documentation.

## Pull requests

1. Create a branch from `main`.
2. Make sure `npm test` and `npm run build` pass.
3. Describe what changed and why.

By contributing, you agree that your contributions are licensed under the MIT licence.
