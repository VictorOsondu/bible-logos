# Text library: sources, imports and behavior

Implemented 28 October 2026. The exact sources, hashes and Swete work inventory are in `scripts/library.ts` and `scripts/library-swete.json`.

| Version | Edition and source | Rights and processing |
| --- | --- | --- |
| LXX-SWETE | Henry Barclay Swete, *The Old Testament in Greek According to the Septuagint*. Open Greek and Latin / First1KGreek; word-per-line conversion by Nathan Smith, https://github.com/nathans/lxx-swete at `26bad3eb42bba98471d154c954e36a6f30a0279d` | Digital text and annotations CC BY-SA 4.0, https://creativecommons.org/licenses/by-sa/4.0/. Words joined into passages; native labels retained. Source text, imported dataset and adaptations retain this licence, separate from the app's MIT code and original study prose. |
| HEB-SG | Isaac Salkinson and Christian D. Ginsburg, Hebrew New Testament (1886), https://ebible.org/find/details.php?id=hebsg | Specific distribution declared public domain at https://ebible.org/hebsg/copyright.htm. USFX notes, layout and duplicated printed verse-number elements omitted; Hebrew spelling and vowel points retained. |
| WEB-DC | World English Bible Classic, additional books only, https://ebible.org/details.php?id=eng-web | Public domain. World English Bible is a trademark identifying faithful copies. USFX layout and ordinary notes omitted; source notes explaining omitted passages are retained separately. Combined verse-range labels are preserved. No changes to the existing app's WEB dataset. |
| DID-HB | Roswell D. Hitchcock and Francis Brown, *Teaching of the Twelve Apostles* (1884), English translation, digitized by Stanley A. Bridgeford, https://www.gutenberg.org/ebooks/42053 | Historical translation is public domain. Greek text, introduction, commentary, page numbers and ebook boilerplate omitted; line-break hyphens removed; spelling otherwise retained. Whole chapters, without invented verse numbers. |
| ENO-CHARLES | R. H. Charles, *The Book of Enoch* (1917; digitization uses a 1962 reprint), https://www.gutenberg.org/ebooks/77935. Digitized by David King and the Online Distributed Proofreading Team from Internet Archive images. | Historical translation is public domain. Only the translated chapters are imported; W. O. E. Oesterley's introduction, commentary and ebook boilerplate omitted. Whole-chapter sections preserve inline source verse numbers, witness sigla, alternate readings and editorial brackets; typography is simplified. |

Project Gutenberg identifies both digitizations as public domain in the USA. The selected historical translation authors died in 1887/1916 (Hitchcock/Brown) and 1931 (Charles), respectively, so their ordinary UK life-plus-70 copyright terms have also expired. This does not declare every modern edition, translation or added annotation public domain. Gutenberg acknowledgement links are source credits; no Gutenberg branding or boilerplate is included in the imported text. See https://www.gutenberg.org/policy/license.html.

## Coverage and native references

The Swete inventory contains 55 source files and is not a complete modern critical edition: Ecclesiastes is absent. Native book/chapter divisions can differ substantially from modern English Bibles (including Proverbs). Alternative Daniel, Susanna and Bel texts are distinct works. Esdras B retains its combined 23-chapter arrangement. Greek Esther and Sirach prologues use internal chapter 0, with visible source labels. Odes “iva” and “ivb” have distinct internal chapter routes, retaining those visible labels. Psalm 151 is a separate optional work. Lettered verse labels retain distinct internal anchors and their original visible labels.

There are 29,308 Greek passages, 7,957 Hebrew NT passages, 6,931 English Deuterocanon passages, 16 Didache sections and 108 Enoch sections. Actual chapter availability comes from the database, not a presumed shared chapter count.

New editions are displayed independently when comparing them to existing versions. Matching reference numbers are not presented as verified alignments. No KJV Strong's tokens or cross-reference identities are attached to new editions. The existing Compare page links to native editions separately, without English word-difference highlighting. Reviewed general verse alignments remain future work. Living Letters includes direct edition-qualified links to Genesis 1, John 1, Hebrews 4:12, Jeremiah 23:29, and Greek Psalm 106:20 (English Psalm 107:20); these linked passages were checked against the imported text.

## Reproduce or update

Run `npm run seed` for a complete fresh database, or `npm run import:library` to add/refresh these editions in an existing database. Stop/restart a running app around a database replacement because its read-only connection may keep the old database open. Both commands build a temporary database before replacing the live file. Verified source caches are in ignored `data/sources`; the Bible database itself remains ignored.

The app checks for the required library schema before serving reader data; the production build also refuses an unmigrated database. The normal build command explicitly uses webpack, matching development and the verified production path.

Source downloads are checked against SHA-256 hashes. Swete files are pinned to the revision above; its combined hash covers source files in manifest order. The other providers do not expose immutable releases: a changed download deliberately fails verification, requiring source review and an explicit hash update. The `library_imports` table records exact source, checksum, timestamp and passage count; `edition_chapters` records native chapter labels and order.

On source updates, review inventories, compare representative passages and preserve stable native anchors before updating hashes. `npm run import:library` is repeatable: it replaces the five edition datasets and rebuilds search indexes. Import failure leaves the live text database untouched. The incremental importer refuses concurrent imports using a lock and rejects WAL-mode source databases before replacement; stop writers and checkpoint/switch such a database to DELETE journal mode first.

## Collections and saved reading

The 66-book catalogue remains the default. Additional works are discoverable at `/library`, with optional collection preferences saved locally. If browser storage actually fails, changes remain available in memory until reload and an explicit status message explains that persistence failed. Choosing a specific edition in the book browser explicitly exposes that edition's inventory. Direct work links remain available whether a collection is enabled or not. Collection choices describe browsing interests rather than a universal ruling about canon.

Search offers Bible, Bible plus enabled collections, and all library. Hebrew/Greek accent-insensitive lookup uses a separate normalized FTS index; original display text is preserved. Search links retain the edition and native passage anchor. A user's chosen edition is retained in new bookmarks, history and notes; old saved records continue to mean KJV. Optional works are not added to existing daily-verse lists or reading plans.

Reception background: https://worldenglish.bible/ and https://www.ethiopianorthodox.org/english/canonical/books.html. Work introductions identify traditional attribution and uncertainty; the library's own summaries are distinct from the historical translated text.
