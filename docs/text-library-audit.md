# Text library and Living Letters audit

Audit date: 28 October 2026. Scope: the newly added editions, optional collections, reader and comparison behavior, search, saved reading and notes, Living Letters links and letter pronunciation, data imports and production readiness.

## Assessment

Suitable for the intended use as an exploratory reading and study application after the fixes below. No unresolved blocking functional defects were found in the tested scope. This is a software and source-fidelity assessment, not a new scholarly evaluation of the historical translations or a claim that every edition has identical numbering.

## Findings corrected

| Area | Confirmed problem | Correction |
| --- | --- | --- |
| Query handling | Repeated query keys produced arrays and crashed reader/search pages; oversized search offsets caused SQLite datatype errors. | Normalize repeated values, deduplicate versions, bound offsets and clamp pagination to actual results. Invalid comparison references are handled explicitly. |
| Comparison references | Header navigation discarded independently selected chapter numbers; removing the primary edition could silently move the remaining edition to a different chapter. | A shared reader-link builder preserves edition-qualified chapter choices and moves the route to the remaining primary edition's actual chapter. |
| Book browsing | Directly selecting the Hebrew NT opened an empty OT category. Returning to chapter selection could discard comparison versions. | Derive available categories from coverage and retain selected versions when browsing chapters. |
| Performance | The book browser regrouped the entire corpus and sent about 1.60 MB of coverage records. | Materialize edition coverage on import and send compact chapter tuples. The same Hebrew-browser response measured 330,385 bytes, about 79% smaller; one final local measurement took 425 ms. These are observations, not a production latency guarantee. |
| Source ranges | A combined verse, 4 Maccabees 8:28–29, was labelled only verse 28. | Preserve native combined labels while keeping a stable internal anchor. |
| Source omissions | Notes explaining absent Sirach verses disappeared with ordinary footnotes. | Retain the source's omission notes separately from scripture text and show them in the reader. The source's critical judgments remain attributed to the source. |
| Unavailable readings | A requested version with no text could still add a misleading KJV/default entry to history; duplicate versions rendered duplicate sections. | Record history only when the primary edition actually contains displayed text; deduplicate requests and report unknown/uninstalled versions. |
| Reader statistics | Verse counts combined incompatible reference systems. | Count passages in the primary edition only. |
| Saved references | Manual notes/bookmarks allowed unavailable edition/book combinations and invalid chapter or verse references; prologue references had no proper chapter selector. | Share a reference picker using real edition coverage, including chapter zero. Validate references before saving, including genuinely omitted numbers inside otherwise valid verse bounds. Native-edition notes/bookmarks created manually are chapter-level; passage bookmarks made in the reader retain the exact anchor and label. |
| Verse zero | Valid native verse-zero bookmarks lost their fragment because zero was tested as false. | Preserve and display zero as an actual reference. |
| Browser storage | JSON with the wrong shape or malformed records could crash collection/personal views. Failed writes were silent. | Validate stored shapes and feature records. On an actual write failure, retain the current session in memory and visibly explain that changes will be lost on reload/close. |
| Saved-item IDs | Using randomUUID directly would fail on local HTTP origins where that API is absent. | Provide a tested fallback with a per-session sequence. |
| Notes usability | Edit/delete controls were blank, some inputs lacked accessible labels, and empty edits could be saved. | Name controls, expose visible actions and prevent empty note saves. |
| Native reading controls | Small text-only bookmark/copy targets and a vertically broken copy icon reduced mobile usability. | Give the native controls larger targets and align the copy icon with its label. |
| Database upgrades | A pre-library database could pass the build precheck and then fail at runtime. | Verify the required library schema in the application and prebuild checks, with an explicit migration instruction. |
| Import integrity | Parser regressions could still pass a simple nonempty-data check; backup-stage failures could leave temporary files. | Enforce source-specific passage/work/chapter inventories, verify source hashes and native references, clean temporary files on failure, and test byte-for-byte preservation of the live database on failed import. |
| Import concurrency | Incremental imports shared a temporary pathname without an ownership lock. Replacing a WAL database could pair the new file with old journal state. | Lock incremental imports and reject WAL-mode source databases before replacement. The application should be stopped around database replacement. |
| Comparison availability | Native-edition links depended on the presence of the same verse number even though alignment is unverified. | Offer native editions based on actual book/chapter coverage and label them as independent readings. |
| Build path | The verified production path used webpack, but the default build still selected Turbopack, which had failed in this environment. | Make the normal build command explicitly use webpack, matching development and the verified production build. |

## Verification

- `npm run lint`, `npm run typecheck`, `npm run test`, and the normal `npm run build`.
- Full desktop and mobile Playwright suite, including 320-pixel layouts, keyboard/dialog navigation, source audio success/failure, storage failures, malformed URLs and saved data, native references, notes, and existing Bible-reader features.
- A complete fresh `npm run seed` succeeded: 584,986 total passages across 24 registered editions and 431,590 cross-references. The incremental importer also succeeded; simulated failure left the live database byte-for-byte unchanged.
- `python3 scripts/audit-library-data.py` independently compared all 29,308 Greek passages against the pinned word-per-line source and all 7,957 Hebrew NT plus 6,931 English Deuterocanon passages against separately parsed source XML: 44,196 exact source-text/reference matches.
- All 16 Didache and 108 Enoch chapter sections exist and are nonempty. Representative opening/closing chapters and editorial boundaries are covered by parser/browser checks. There are no duplicate passage references, missing chapter-catalogue entries or SQLite integrity errors.
- All 39 distinct first-chapter reading links on the library page returned successful pages.
- Browser accessibility-tree inspection found no unnamed buttons, textboxes, comboboxes or links on the checked library, Hebrew reader, book browser, search, open note form and open bookmark form. This supplements keyboard tests; it is not a formal WCAG certification.
- A real remote Aleph recording loaded and played successfully, in addition to the isolated playback/error/cleanup tests.

The unit suite passed 128 tests. The final full browser suite passed 89 tests with three intentional device-specific skips. These checks can be reproduced with `npm run test` and `CHROMIUM_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e -- --workers=2` on this workstation. The browser path is optional when Playwright's own browser is installed.

## Boundaries retained deliberately

- Swete's selected digitization lacks Ecclesiastes and uses native divisions; the app identifies that coverage limitation. A database matching its source does not establish a critically perfect ancient text.
- General automatic verse alignment between editions is not implemented. Independent chapter controls and explicit edition labels prevent numerical identity from being presented as textual correspondence.
- Didache and Enoch are whole-chapter sections. Enoch preserves the historical edition's inline numbers and alternate readings, rather than inventing a modern verse-level mapping.
- The Hebrew NT is a later translation of Greek. Its Hebrew wording and any numerical patterns must be attributed to that translation.
- Word tagging and cross-reference datasets remain limited to editions with genuine matching annotations. Optional collections do not automatically enter existing daily readings or plans.
- Personal data is local to the browser. A failed persistence operation is clearly reported; session fallback cannot survive a reload. Remote pronunciation still requires the source host/network, with a source link and retry path when playback fails.
- The importer's lock prevents overlapping incremental imports; database build/import commands should not run against an actively modified database or simultaneously with each other. Stop a running app before replacing its database, as documented in the source/import guide.
