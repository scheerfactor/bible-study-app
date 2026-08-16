# e-Sword And SwordSearcher Benchmark

Research reviewed: August 16, 2026

This benchmark compares the current official e-Sword and SwordSearcher feature sets with Father's Business Bible Study. It focuses on what makes study faster, what the app already does well, and which improvements should come before more feature or content expansion.

## Executive Decision

Father's Business should not try to win by copying every module or desktop panel. It should combine:

- e-Sword's immediate Strong's, reference, note, tag, and layout workflows
- SwordSearcher's verse-indexed library, StudyClick actions, and search precision
- Father's Business's KJV-first word study, source transparency, teaching pipeline, hymns, audio, prayer, and presentation tools

The work must begin with client performance. The current production build reports approximately **63.5 MB of first-load JavaScript uncompressed and 20.13 MB gzip** for `/`. The main client page is **50,796 lines and 2.48 MB of source code**, with **77 direct data imports**. A fast study interaction cannot compensate for a first load that sends most of the product and its data at once.

## What e-Sword Does Well

The [official e-Sword feature page](https://www.e-sword.net/) emphasizes resources one click away, Strong's and Scripture tooltips, Bible and library search, parallel/compare views, an integrated editor, verse copying, highlighting, and printing.

The current [e-Sword 15 changes](https://www.e-sword.net/changes.html) add several especially useful ideas:

- right-click a Strong's number to find every occurrence
- dock search results, cross references, verse tags, and history beside the Bible
- search the whole library at once
- save and recall different workspace layouts
- apply multiple tags to verses
- keep user notes, tags, and highlights compatible across platforms

The pictured [e-Sword LT for iPhone](https://www.e-sword.net/iphone/) keeps the mobile promise simple: tap for Strong's definitions or Scripture references, search by Strong's number, tag verses, use reading plans, and open location maps.

What to copy in principle:

- definitions and reference previews without leaving the passage
- one action from a Strong's number to all occurrences
- nearby history, tags, and cross references
- task-specific layouts that remember their state
- dependable user-data portability

What not to copy:

- a user-facing module-management burden
- translation clutter that conflicts with the app's KJV-first scope
- desktop controls squeezed unchanged onto a phone
- third-party resources without consistent rights and quality review

## What SwordSearcher Does Well

The [official SwordSearcher overview](https://www.swordsearcher.com/) currently lists a $69.95 one-time Windows license and emphasizes speed, an included library, privacy, local user data, and no recurring fee.

Its strongest workflow ideas are:

- **Verse Guide:** an index of every library item that references the current verse
- **Bible Margin:** optional links beside each verse when selected resources contain relevant material
- **StudyClick:** configurable word actions such as definition, first and last use, or Bible search
- **personal books and commentaries:** user writing is searchable and automatically indexed by Scripture reference
- **full-library search:** exact phrase, all words, any words, Boolean expressions, partial words, English word forms, fuzzy matches, and resource scopes
- **discovery tools:** cross references, word trees, and word clouds that remain secondary to the Bible text

SwordSearcher's [full-library search documentation](https://www.swordsearcher.com/helpfiles/current/full_library_search_dialog.html) shows why it feels fast even when the library is large: searching text and finding resources indexed to a verse are distinct operations, each with a purpose-built index.

What to copy in principle:

- precomputed verse-to-resource indexes
- visible but optional verse-margin availability indicators
- configurable word actions
- separate Bible, library-text, and verse-reference search modes
- automatic Scripture linking in personal notes
- fast preview before opening a full resource

What not to copy:

- Windows-only reach
- an interface that assumes a mouse and several fixed desktop panels
- an unlimited module ecosystem without source, rights, and doctrinal metadata

## Current Capability Comparison

| Study need | e-Sword / SwordSearcher strength | Father's Business today | Decision |
| --- | --- | --- | --- |
| Jump to a passage | Fast reference navigation | Global Quick Jump, recent passages, favorites, and markers exist | Keep and add navigation back/forward history |
| Define a Bible word | Strong's tooltip or StudyClick | Every KJV word is tappable; Webster lookup and a study drawer exist | Replace the multi-step result with one combined Word Lens |
| Strong's study | Number search and occurrence lookup | Reviewed mappings cover the KJV; numbers can be displayed and opened | Show Webster, Strong's, first use, counts, and actions together |
| Cross references | Docked references and previews | TSK references and verse previews exist in the study drawer | Add instant preview without changing the reader position |
| Find all resources on a verse | Verse Guide and Bible Margin | Passage Guide and commentary recommendations exist | Build a complete verse-to-resource index and compact margin indicator |
| Search Scripture | Phrase, word forms, fuzzy, proximity, Strong's | Current search scans all verses for substring/token matches | Replace with a prebuilt index and explicit search modes |
| Search the library | Scoped whole-library search | Library metadata search exists; full text is not one unified search surface | Add indexed title, author, topic, text, note, and Scripture-reference scopes |
| Personal study | Notes become searchable linked resources | Notes, highlights, bookmarks, journal, sermons, and exports exist | Auto-link Scripture references and index personal writing locally |
| Organize verses | Multiple tags and verse lists | Markers, favorites, memory, and word highlight sets exist | Add named tags and reusable verse collections |
| Change study modes | Saved view layouts | Reader, drawer, full study, sermon, and presentation views exist | Add Read, Word Study, Teaching, and Sermon Prep presets |
| Work offline | Installed local resources | Local state exists, but the web app is not a dependable offline study library | Add installable core and explicit offline book/chapter packs |
| Teach from study | Editor and print workflows | Sermon, lesson, journal, slides, and presentation workflows are broader | Preserve this as a primary differentiator |
| Verify content | Module provenance varies | Rights, source, review, and doctrinal metadata are unusually strong | Keep this visible and non-negotiable |

## Priority Zero: Make The Core Fast

### Measured baseline

- `/` first-load JavaScript: 63,524,927 bytes uncompressed
- `/` first-load JavaScript: 20,131,983 bytes gzip
- `src/app/page.tsx`: 50,796 lines and 2,475,376 bytes
- direct data imports in the client page: 77
- feedback route comparison: about 210 KB gzip

These values came from the August 16 production build and `.next/diagnostics/route-bundle-stats.json`.

### First extraction result

The first performance batch removed 24 directly bundled commentary datasets and moved them to the existing deferred commentary API. The same production diagnostic then reported:

- `/` first-load JavaScript: 12,742,572 bytes uncompressed
- `/` first-load JavaScript: 2,085,285 bytes gzip
- gzip reduction from the measured baseline: 89.6%
- ordinary Bible reading now requests a 17-file, 1.44 MB uncompressed curated commentary starter set only after the Bible opens
- the complete validated commentary catalog remains available when a full-study or commentary workflow requests it

The repository now includes `npm run audit:bundle`, with a first-milestone gzip budget of 5 MB for `/`. The next extraction target remains 1.5 MB gzip.

### Second delivery result

The next performance batch added a deterministic, server-only commentary chapter index and a cached chapter endpoint. Bible reading, Full Study, and Passage Guide now request the current chapter instead of downloading source files individually.

- the index covers all 1,189 KJV chapters across 345 publishable catalog files
- `/api/commentary/chapter/[book]/[chapter]` reads only files indexed for that chapter and preserves the original validated rows
- the dashboard makes zero commentary requests
- opening Hosea 4 makes one chapter request and zero individual commentary-file requests
- moving to Hosea 5 makes one additional chapter request; Passage Guide and Full Study reuse the chapter cache
- Hosea 4 returns 13 exact reviewed rows from 13 sources in 593,902 bytes uncompressed and 216,109 bytes gzip
- ordinary Bible commentary requests fell from 17 to 1, while Full Study and Passage Guide fell from as many as 345 to 1 for the active chapter

Commentary Explorer now reads a compact catalog covering 12,850 entries, 66 Bible books, and 1,189 chapters, then requests only the selected chapter. Visited chapters remain cached for the session, and source rows retain their reviewed wording and provenance. Dedicated whole-book study paths still use complete-catalog loading; their next step is query-driven book/chapter delivery.

### Third extraction result

The complete KJV corpus now loads as a separate verified chunk instead of being embedded in the application shell. One exact starter verse keeps the first render safe while the 31,102-verse corpus loads and passes its expected-count check.

- `/` first-load JavaScript: 7.64 MB uncompressed
- `/` first-load JavaScript: 0.70 MB gzip
- the route now clears the 1.5 MB coming-soon milestone
- John 3 expands from the starter verse to all 36 verses after the corpus is ready
- quick navigation, exact-phrase search, and Word Lens continue to use the full local KJV corpus
- loading and failure states remain visible; a failed corpus request does not silently present partial coverage as complete

The bundle audit now enforces a 1.5 MB gzip default budget. The separate KJV chunk is still a meaningful download and parse cost, so current-chapter delivery and a precomputed search index remain worthwhile later optimizations.

### Required engineering changes

1. Keep only the shell, KJV reader, current chapter, quick navigation, and essential user state in the first route chunk.
2. Move TSK, commentary, library, media, admin, sermon, presentation, and acquisition data behind APIs or static book/chapter shards.
3. Split `page.tsx` by feature ownership and dynamically load screens only when opened.
4. Precompute maps for books, chapters, verses, words, Strong's numbers, and verse-to-resource links instead of repeatedly filtering full arrays.
5. Load the current chapter first; prefetch adjacent chapters after the reader becomes interactive.
6. Add a bundle-size audit to CI so content imports cannot silently return to the first-load chunk.
7. Measure real mobile performance on a throttled midrange device before every public release.

### Performance budgets

Use staged budgets rather than pretending the current build can reach the final target in one change:

- first extraction milestone: below 5 MB gzip on `/`
- beta milestone: below 1.5 MB gzip on `/`
- public target: below 750 KB gzip for the initial reader route
- cached quick jump: visible chapter in under 100 ms
- cached Word Lens: preliminary result in under 100 ms, full result in under 300 ms
- KJV search: first results in under 100 ms after the index is ready
- library search: first results in under 300 ms for the local index
- Core Web Vitals target at the 75th percentile: LCP at or below 2.5 seconds and INP at or below 200 ms

## Priority One: Quick Word Lens

Tapping a KJV word should open one compact anchored panel or mobile sheet containing:

- the exact selected KJV word and verse
- Webster 1828 definition, with review status
- mapped Strong's number, original word, transliteration, and plain definition
- chapter, book, and whole-Bible occurrence counts
- first occurrence and several key occurrences
- actions for all occurrences, related words, note, sermon, teaching outline, and copy

Do not make the user choose Dictionary, Strong's, and Occurrences before seeing whether those tools contain anything. Keep the full study drawer for deeper work, but make the first answer immediate.

## Priority Two: Verse Guide And Study Margin

Build one generated index keyed by Bible reference. Each verse record should list:

- TSK cross references
- commentary entries that cover the verse
- books that cite the verse
- dictionary, person, place, map, timeline, archaeology, hymn, sermon, quote, and illustration connections
- the user's notes, sermons, journal entries, tags, and presentations that cite the verse

In the reader, show a restrained optional margin indicator such as `3 Comm · 8 TSK · 2 Books · 1 Note`. Tapping it should open a fast preview list without moving the Bible. Users must be able to choose which categories appear.

This is the most valuable SwordSearcher idea to adopt because it turns a large library into relevant help instead of a bookshelf the user must search manually.

## Priority Three: Purpose-Built Search

The current Bible search performs client-side filtering across the full verse array whenever the query changes. Replace it with a compact prebuilt index, loaded in a Web Worker or queried through a fast local/server endpoint.

Support these explicit modes:

- reference jump
- exact phrase
- all words
- any word
- KJV word forms such as `love`, `loveth`, `loved`, and `loving`
- fuzzy spelling
- words within the same verse or within a chosen distance
- Strong's number
- Old Testament, New Testament, book, chapter, or selected range
- library title/author/topic
- full library text
- personal notes and sermons
- resources that cite a verse

Search should preserve the current passage and open results beside or below it. A result preview should never force navigation until the user chooses Open.

## Priority Four: Personal Study As A First-Class Resource

- Add multiple named tags to any verse.
- Add named verse collections for sermons, doctrines, people, promises, commands, and lessons.
- Detect KJV references as the user types and turn them into previewable links.
- Index notes, journal entries, sermons, and teaching outlines by both text and Scripture reference.
- Allow the user to export all personal writing in documented JSON and readable Markdown.
- Preserve local-only use while offering optional encrypted account sync later.

This combines e-Sword's cross-platform user files with SwordSearcher's personal commentary model while retaining the app's existing export and teaching strengths.

## Priority Five: Workspace Presets And Offline Study

Offer four simple presets rather than an unrestricted panel designer:

- **Read:** KJV text, audio, recent passages, and minimal controls
- **Word Study:** KJV, Word Lens, occurrences, Strong's, Webster, and TSK
- **Teach:** KJV, Passage Guide, commentary, notes, questions, and outline
- **Sermon Prep:** KJV, notes, illustrations, quotations, sermon draft, and slides

Remember the user's last size and position on desktop/tablet. Keep one reader plus a bottom sheet on mobile.

Make the KJV core, Strong's mappings, Webster essentials, TSK, notes, and selected resources available offline. Show storage size before downloading and make removal simple.

## Where Father's Business Can Be Better

### One KJV word, one complete connection

Neither competitor's core message combines Webster 1828, reviewed Strong's mapping, English occurrences, source status, and direct teaching actions as one carefully guided workflow. This should become a signature feature.

### Study that ends in faithful use

Move naturally from reading to observation, interpretation, doctrine, application, prayer, obedience, lesson, sermon, and presentation. Tools should help the user understand and do the Word, not merely collect search results.

### Rights and source trust

Every public book, commentary, image, map, sermon, hymn, and audio item should retain source, edition, rights basis, review status, and correction reporting. This is a meaningful advantage over unmanaged module collections.

### Teaching and worship workflow

The existing sermon, slide, presentation, hymn, audio, and media direction can connect personal study to actual church teaching in a way that ordinary reference software often leaves to separate products.

### Curated Baptist resources without catalog confusion

Permission-cleared Fundamental Baptist books, sermons, courses, and media can be a focused strength. Keep the doctrine and source labels clear, preserve exact permissions, and surface resources by passage and study purpose rather than by promotional placement.

## Delivery Sequence

1. Establish the bundle audit and extract first-load data from the client page.
2. Ship the combined Word Lens using chapter-level Webster and Strong's caches.
3. Build the verse-to-resource index and compact Study Margin.
4. Add navigation history and non-destructive verse/reference previews.
5. Replace scan-based Bible search with a precomputed KJV index.
6. Add scoped library and personal-writing search.
7. Add tags, verse collections, and automatic Scripture links in user writing.
8. Add workspace presets and offline packs.
9. Test each stage with pastors, teachers, and serious Bible students before expanding the catalog again.

## Product Test

A teacher opening John 3:16 should be able to:

1. tap `believeth` and understand the Webster and Strong's connection immediately
2. see every relevant cross reference, commentary, book, note, sermon, and illustration without searching each collection
3. preview linked verses without losing John 3:16
4. search all KJV forms and the whole library quickly
5. save the finding to a lesson or sermon and export it

If that workflow is fast on an ordinary phone, the app will have learned the best lessons from e-Sword and SwordSearcher while offering a clearer path from study to teaching and obedience.
