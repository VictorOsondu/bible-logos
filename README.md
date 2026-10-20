<div align="center">

# 📖 Bible Logos

### A simple but powerful tool for personal Bible study and research.

[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)

Based on [BibleLens](https://github.com/quantumnic/biblelens) by Nicola Spieser.

</div>

---

Bible Logos runs on your own computer. It downloads public-domain Bible texts and reference data once, stores them in a local SQLite database, and gives you a fast, private study environment in the browser.

## ✨ What it does

### 📖 Reader with the original languages one click away

- Read any chapter in the **King James Version, American Standard Version, Bible in Basic English, Young's Literal Translation and the Latin Vulgate**, alone or side by side.
- **Every word of the KJV is linked to its Hebrew or Greek original.** Click a word to see the original script, transliteration, pronunciation, Strong's definition, derivation and every other place it occurs.
- Words the KJV translators added are shown in *italics*, as in printed editions.

### 🔤 Strong's concordance

- The **complete** Strong's lexicon: 8,674 Hebrew and 5,523 Greek entries.
- Search by number (`H2617`, `G26`), by transliteration as you would naturally spell it (`chesed`, `agape`, `shalom`), by original script, or by English meaning (`mercy`, `grace`).
- For each word, see how the KJV translates it (e.g. *chesed*: mercy 125×, kindness 35×, lovingkindness 21×) and browse every verse it appears in.

### 🔗 Cross-references and search

- **430,000+ cross-references** from the OpenBible.info dataset, ranked by relevance.
- Full-text search across all translations.
- Side-by-side translation comparison.

### 📝 Personal study

- Bookmarks, study notes and reading plans, saved in your browser.
- Key Passages: the Beatitudes, the Lord's Prayer, the Ten Commandments and the Bible's songs and doxologies, each opened in the reader.
- Reference indexes (parables, miracles, prophecies, covenants, people, places, names of God and more) that link straight to the verses.
- Research links for any verse, with live results from Semantic Scholar, PubMed and Open Library.

## 🚀 Getting started

You need [Node.js](https://nodejs.org) 18 or later.

```bash
git clone https://github.com/VictorOsondu/bible-logos.git
cd bible-logos
npm install
npm run seed   # downloads the texts and builds data/bible.db (about 120 MB, under a minute)
npm run dev    # then open http://localhost:3000
```

Run `npm run seed` again at any time to rebuild the database from scratch.

Other commands:

| Command | Purpose |
|---|---|
| `npm test` | Run the test suite (Vitest) |
| `npm run build && npm start` | Production build |

## 📊 Data sources

The seed script downloads everything below; none of it is stored in this repository.

| Source | Used for | Licence |
|---|---|---|
| [CrossWire Bible Society KJV module](https://gitlab.com/crosswire-bible-society/kjv) | KJV text with Strong's numbers and Greek morphology | Text public domain; module markup GPL |
| [Open Scriptures Strong's dictionaries](https://github.com/openscriptures/strongs) | Hebrew and Greek lexicon | CC BY-SA |
| [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases) | ASV, BBE, YLT and Vulgate texts | Public domain |
| [OpenBible.info](https://www.openbible.info/labs/cross-references/) (via scrollmapper) | Cross-references | CC BY |
| [Semantic Scholar](https://www.semanticscholar.org/), [PubMed](https://pubmed.ncbi.nlm.nih.gov/), [Open Library](https://openlibrary.org/) | Live research results | Queried on demand |

## 🏗️ How it is built

- **Next.js 14** (App Router) with **TypeScript** and **Tailwind CSS**
- **SQLite** via `better-sqlite3`, with an FTS5 full-text index
- `scripts/seed.ts` builds the database; `scripts/kjv-strongs.ts` parses the Strong's lexicon and the tagged KJV
- `src/lib/strongs.ts` holds the Strong's queries shared by the pages and API
- `src/lib/navigation.ts` lists the app's pages for the sidebar, footer, home page and search

## 🙏 Credits

Bible Logos began as a fork of **[BibleLens](https://github.com/quantumnic/biblelens)** by Nicola Spieser, released under the MIT licence. Thank you for the foundation.

Strong's data: James Strong (1890/1894); JSON edition by Open Scriptures. Tagged KJV: CrossWire Bible Society, with Old Testament Strong's numbers from The Bible Foundation and New Testament data from the KJV2003 Project.

## 📄 Licence

MIT. See [LICENSE](LICENSE).

*Bible Logos presents the text and its sources; the conclusions are yours.*
