# Bible versions and optional writings: implementation plan

Status: initial implementation complete; see `text-library-sources.md` for delivered behavior and remaining alignment work.
Prepared 28 October 2026.

## Product direction

Add Greek Septuagint (Swete) and Hebrew New Testament (Salkinson–Ginsburg) as separately selectable versions in the existing reader. Add an optional “Explore writings” library for readers who want additional works. Enabling a collection changes browsing and search scope; it does not declare a book canonical or change the user's default Bible version.

Distinguish a **work** (Genesis, 1 Enoch), an **edition/version** (Swete, Salkinson–Ginsburg), a **collection** (early Christian writings), and a **tradition's canon**. A work can belong to several collections and have different standing in different traditions. Do not use one universal canonical/extrabiblical boolean. Describe the Septuagint as an ancient Greek translation and the Hebrew NT as a later Hebrew translation of the Greek NT.

## Current implementation and constraints

- `src/lib/translations.ts` registers versions, licence strings and brief comparison notes; language, script direction and edition coverage are absent.
- `src/lib/bible-books.ts` and the duplicate `BookInfo` in `src/lib/types.ts` model 66 books with one chapter count and an OT/NT category.
- `scripts/bibles.ts` explicitly filters imports to book IDs 1–66, discarding additional books.
- `scripts/seed.ts` stores verses by translation/book/chapter/verse and builds FTS5 search.
- `src/app/reader/[book]/[chapter]/page.tsx` already supports multiple selected versions, but assumes shared chapter numbering and navigates the fixed book list.
- `src/components/VerseDisplay.tsx` groups versions by matching verse number. This cannot establish textual correspondence across different versification systems.
- `src/components/BookPicker.tsx` offers OT/NT only. Bookmarks and reading history in `src/lib/reading.ts` do not record the edition.

## Phase 1 — Catalogue, sources and rights

1. Extend version metadata with language, direction, edition date, translator/editor, source URL, licence URL, required credit, text type, and versification identifier.
2. Introduce stable work identifiers and aliases. Preserve existing numeric IDs 1–66 and existing reader URLs; allocate new work IDs explicitly rather than trusting external source numbers.
3. Add edition-specific work availability, order and chapter/section coverage. Represent alternative texts and additions explicitly, including Greek Esther/Daniel and source-specific Esdras names; never overwrite the existing work's text or silently conflate recensions.
4. Represent collections and sourced tradition-specific reception notes separately from content availability. Consolidate the duplicate book interfaces during this change.
5. Record each import's exact source revision or download date, checksum, format, expected book inventory and licence notice. Keep third-party data licences distinct from application code and original study prose. Check the specific digitization and jurisdiction, not only the age of the ancient work.

Deliverable: reviewed manifests for `LXX-SWETE` and `HEB-SG`, a complete source inventory, and an additive schema/migration design that preserves existing references.

## Phase 2 — Imports and passage identity

1. Build source-specific import adapters for Swete's structured text and eBible's Hebrew NT USFM/USFX. Confirm the actual Swete inventory and alternate texts before promising complete Septuagint coverage.
2. Preserve source spelling, Hebrew vowel points, Greek diacritics, native numbering and editorial distinctions. Keep headings/notes separate from passage text. Store comparison/search normalization separately from display text.
3. Replace the global 66-book filter with each source manifest's explicit inventory. Reject unknown identifiers and produce an import report instead of silently dropping books.
4. Preserve the existing verse model where appropriate; support chapter/section references for later writings that lack Bible-style verses. Model edition-qualified passage identity before extending bookmarks, notes or cross-references.
5. Create explicit passage alignments supporting one-to-one, one-to-many, many-to-one, missing and reordered passages. Prioritize Psalms, Jeremiah, Esther and Daniel. Treat alternate textual forms separately. Unreviewed comparisons must show independent native references rather than claim alignment.
6. Build imports into a temporary database, validate, then replace the generated database. Make repeat imports deterministic and retain the prior working database if validation fails. Apply the same schema through fresh seeds and upgrades.

Deliverable: reproducible datasets with book/chapter/passage counts, duplicate and missing-text reports, sample comparisons against source editions, and retained licence notices.

## Phase 3 — Reader integration

1. Offer the two versions in the existing selector, with language, coverage, edition and credit details. Make book selection and previous/next navigation follow the chosen primary edition's actual coverage.
2. Keep selected versions through book/chapter navigation. For unavailable passages, explain the absence and offer available versions; do not silently replace a requested edition with KJV.
3. Render Hebrew with `lang="he"` and `dir="rtl"`, Greek with appropriate language metadata and left-to-right direction. Isolate mixed-direction references and controls. Verify fonts, vowel points, accents, selection, copy and mobile layout.
4. Reuse comparison controls, but align only through reviewed mappings. When no mapping exists, offer independently navigable passages with their native references.
5. Extend bookmarks, history and notes to preserve edition and passage identity. Continue resolving older saved items through an explicit legacy default.
6. Show word tools only for editions with genuine matching annotations. Do not apply KJV or transliteration tokens to these texts by matching verse numbers or words heuristically.

Deliverable: both editions usable alone and alongside existing English versions, with working deep links, navigation and clear unavailable-passage behavior.

## Phase 4 — Optional collections

Add an “Explore writings” page with introductions, sample passages and collection controls. Persist choices locally, consistent with current preferences. Keep the existing Bible experience as the default; additional collections are discoverable and opt-in. Direct links should open a work even when its collection is not enabled, explaining its collection and offering to enable it without a blocking gate.

Recommended order:

| Collection | Initial candidates | Source/readiness |
| --- | --- | --- |
| Deuterocanonical / Apocryphal books | Wisdom, Sirach, Tobit, Judith, Baruch, 1–2 Maccabees and Greek additions to Esther/Daniel | First release. World English Bible Classic supplies a public-domain English collection; pair with Swete where coverage and mappings are verified. |
| Second Temple Jewish writings | 1 Enoch, then Jubilees | Second release. Review R. H. Charles editions and digitization rights; explain older translation limitations and reception in Ethiopian tradition. |
| Early Christian writings | Didache, 1 Clement, then Shepherd of Hermas | Second release, starting with Didache. Select a named, verified public-domain or openly licensed translation for each work. |
| Jewish letter interpretation | Sefer Yetzirah, later selected interpretive texts | Later, particularly relevant to Living Letters. Choose a recension and translation explicitly; verify licensing and explain historical setting. |
| Further historical literature | Josephus, Philo, selected apocryphal gospels and Dead Sea Scrolls material | Later, after individual editorial and rights review. Modern translations and manuscript transcriptions require their own checks. |

Each work's introduction should identify the edition/translator, approximate date with uncertainty, genre, original and surviving languages, traditional attribution versus scholarly assessment, reception across relevant traditions, and source/licence. Support statements with named sources; avoid sensational descriptions or unsourced authorship claims.

Search should clearly distinguish “Bible”, “Enabled collections” and “All library”, with visible scope and result labels. An explicit search of all library may include disabled collections. Optional works should not enter daily verses, existing reading plans, or theme evidence automatically; provide separately labelled plans and deliberate, attributed theme links.

## Phase 5 — Living Letters and relationships

Link relevant studies to edition-qualified passages, preserving original-language versus translated-text distinctions. Hebrew OT letter studies need actual Hebrew source text: the existing HTL is transliteration, so a verified Hebrew-script OT would be a separate addition. Likewise, a Greek NT edition is a separate candidate for later comparison with the Hebrew NT, not implied by importing the LXX.

For gematria examples, record edition, exact spelling, letter values and normalization rules. Identify Hebrew NT examples as calculations on that translator's wording. Avoid implying recovery of an original Hebrew NT or an original author's numerical intention.

Distinguish relationships such as quotation, allusion, shared vocabulary, and later interpretation. Explain who proposes an uncertain relationship. Do not import existing canonical cross-reference votes or Strong's links onto optional works without matching data.

## Verification and release criteria

- Verify manifests, duplicate references, complete declared coverage, Unicode fidelity, reproducible imports and licence preservation.
- Test known differences in numbering, split/merged verses, reordered passages, unavailable chapters and alternate texts.
- Test version filtering, chapter navigation, parallel display, RTL/LTR rendering, keyboard accessibility, copying and mobile overflow.
- Test diacritic-insensitive search against representative Hebrew/Greek queries while retaining original display text; handle Hebrew vowel/cantillation marks explicitly rather than assuming SQLite FTS does this correctly.
- Confirm collection preferences affect browsing/search as described and direct links remain usable.
- Confirm old reader links, bookmarks, history, notes, existing search and default reading plans continue to work.
- Run relevant unit tests and reader/search/bookmark browser tests, lint, typecheck and a production build. Read the installed Next.js guides before implementing affected routes/components.

Release in increments: catalogue + imports → multilingual reader + verified alignment → optional English Deuterocanon → Didache and 1 Enoch pilot → further collections. Gate each release on verified edition coverage and source rights, rather than delaying the whole library for every candidate text.

## Source references

Checked 28 October 2026. Candidate status is not blanket permission for other editions or accompanying material.

- Swete digital text and annotations, CC BY-SA 4.0: https://github.com/nathans/lxx-swete
- Hebrew Salkinson–Ginsburg downloads and edition notice: https://ebible.org/find/details.php?id=hebsg and https://ebible.org/hebsg/copyright.htm
- CC BY-SA terms: https://creativecommons.org/licenses/by-sa/4.0/
- World English Bible Classic downloads, coverage and public-domain notice: https://ebible.org/details.php?id=eng-web
- WEB editions and differences in book collections: https://worldenglish.bible/
- Ethiopian Orthodox Church discussion of its biblical books and literary heritage: https://www.ethiopianorthodox.org/english/canonical/books.html
- Charles's 1 Enoch, candidate digitization (public domain in the USA; inspect applicable terms and other publication jurisdictions before importing): https://www.gutenberg.org/ebooks/77935
- Greek/English Didache, candidate digitization with the same rights review requirement: https://www.gutenberg.org/ebooks/42053
