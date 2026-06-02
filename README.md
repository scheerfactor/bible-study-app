# Father's Business Bible Study

A first working prototype for a mobile-first KJV Bible study app.

## Current Prototype

- Full KJV reader using the public-domain `es-kjv` package
- Book, chapter, and verse jump
- John 3:16 quick path from the Today screen
- Full KJV text search in the browser
- Webster's 1828 dictionary search
- Study Drawer with Actions, Dictionary, Cross References, Notes, device Text-to-Speech, and Commentary tabs
- Verse actions for highlight, note, bookmark, copy, and share
- Webster's 1828 lookup with word normalization for forms such as `believeth` -> `believe`
- John 3:14-18 sample cross references using the future TSK table structure
- Commentary tab with the first public-domain commentary collection path
- Import scripts for Webster's 1828 entries, TSK cross references, and commentary entries
- Browser/device Text-to-Speech for Bible chapters, selected verses, and library resources
- Local Bible Listen Mode with chapter/range/book listening and simple playlist planning
- Local Library Reader controls for progress, completed books, reading settings, and listening position
- Search results highlight matched words/phrases
- Signed-out notes, highlights, and bookmarks persist in local storage
- Signed-in notes, highlights, and bookmarks sync to Supabase when env vars and schema are configured
- Supabase schema includes future-ready tables for resources, dictionary entries, cross references, and content rights tracking

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase Setup

### Required environment variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Use the project URL and public anon/publishable key from Supabase Project Settings. Only browser-safe public keys belong in `NEXT_PUBLIC_` variables. Do not put a service-role key in this app.

Restart the dev server after creating or changing `.env.local`.

For server-side import scripts, also set these in your shell or a private local env file that is never exposed to the browser:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

The service-role key is only for local import scripts. Never put it in `NEXT_PUBLIC_` variables and never commit it.

This prototype is currently wired locally to:

```text
https://sxsypmvlneegzgudqgcn.supabase.co
```

### Run the schema

1. Open your Supabase project dashboard.
2. Go to SQL Editor.
3. Open `supabase/schema.sql` from this repo.
4. Paste the whole file into the SQL Editor.
5. Run it.
6. Confirm these tables exist:

```text
resource_sources
bible_books
bible_chapters
bible_verses
dictionary_entries
cross_references
commentary_entries
user_notes
user_highlights
user_bookmarks
user_library_progress
user_completed_resources
user_listening_progress
```

The schema is written to be rerunnable: it creates tables/indexes if missing, drops and recreates policies, grants Data API access, and upserts the sample source/cross-reference records.

### Verify RLS policies

Run this in the Supabase SQL Editor:

```sql
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'resource_sources',
    'bible_books',
    'bible_chapters',
    'bible_verses',
    'dictionary_entries',
    'cross_references',
    'commentary_entries',
    'user_notes',
    'user_highlights',
    'user_bookmarks',
    'user_library_progress',
    'user_completed_resources',
    'user_listening_progress'
  )
order by tablename;
```

Every row should show `rowsecurity = true`.

Then check policies:

```sql
select
  schemaname,
  tablename,
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

You should see public read policies for Bible/reference tables and user-owned policies for notes, highlights, and bookmarks.

Also run Supabase Database Advisors in the dashboard when possible. Supabase docs recommend RLS on exposed `public` tables and explicit policies for browser access.

### Test signed-in notes, highlights, and bookmarks

1. Start the app:

```bash
npm run dev
```

2. Open the local URL shown in the terminal.
3. Go to Settings.
4. Enter your email and use the magic link to sign in.
5. Confirm the app shows `Signed in — syncing to Supabase`.
6. Go to John 3:16.
7. Add a highlight, bookmark, and note.
8. Refresh the page.
9. Confirm the data remains visible.
10. In Supabase Table Editor, check:

```text
user_notes
user_highlights
user_bookmarks
```

Each new row should have your authenticated `user_id`.

To verify local fallback:

1. Sign out.
2. Confirm the app shows `Signed out — saving locally`.
3. Add a different note/highlight/bookmark.
4. Refresh the page.
5. Confirm it remains in the browser.
6. Confirm no new Supabase row was created while signed out.

## Content Rights

The prototype includes a `resource_sources` table so every Bible text, dictionary, commentary, or future book can carry source and rights notes before import.

Library reader data is local-storage first for beta testing. The schema now reserves Supabase sync tables for later:

- `user_library_progress`
- `user_completed_resources`
- `user_listening_progress`

Bible audio playlists are also local-storage first. Current local keys:

- `fathers-business-bible-listening-progress`
- `fathers-business-bible-audio-playlists`

The app currently uses:

- KJV text from `es-kjv`, which identifies its KJV JSON as public domain.
- Starter Webster-style definitions written into the prototype for UI testing.
- Sample TSK-style cross references for John 3:14-18.
- Placeholder commentary rows only. Full commentary imports must wait until source rights are verified.

A full Webster's 1828 import should be done from a documented public-domain source with source and commercial-use notes recorded in `resource_sources`.

A full Treasury of Scripture Knowledge import should use the existing `cross_references` table and a documented source record in `resource_sources`.

## Import-ready sample formats

Small import-shape examples live in:

```text
data/import-formats/tsk-cross-references.sample.json
data/import-formats/tsk-cross-references.sample.csv
data/import-formats/websters-1828.sample.json
data/import-formats/commentary-entries.sample.json
```

These files are not full imports. They define the expected fields for later importer scripts.

## Import Webster's 1828

Put your reviewed Webster import file anywhere local, commonly:

```text
data/imports/websters-1828.json
```

The first verified sample import lives at:

```text
data/imports/websters-1828-verified-sample.json
```

The source files and rights/review manifest live at:

```text
data/sources/websters-1828/source-manifest.json
```

The source is the 1828 Noah Webster work from Internet Archive/Open Library. The original work is public domain; OCR should still be reviewed before a full production import. Large OCR source files should be downloaded locally into `data/sources/websters-1828/` when needed; they are intentionally ignored by git so the beta repo stays lightweight.

The app also includes a generated, server-side Webster lookup file:

```text
data/generated/websters-1828.entries.json
```

Rebuild it from the local OCR source files:

```bash
npm run prepare:webster
```

The generator currently parses both documented OCR volumes and writes a substantially complete Webster dataset for API lookup/search. The raw OCR files remain ignored by Git; the generated app-ready file is committed.

Accepted formats: `.json` or `.csv`.

Required fields:

```text
headword
normalized_headword
definition
source_title
```

`source_title` should usually be:

```text
American Dictionary of the English Language
```

Run:

```bash
npm run import:webster -- data/imports/websters-1828.json
```

Or import the generated full dataset:

```bash
npm run import:webster -- data/generated/websters-1828.entries.json --dry-run
npm run import:webster -- data/generated/websters-1828.entries.json
```

Use the sample format as a template:

```bash
npm run import:webster -- data/import-formats/websters-1828.sample.json
npm run import:webster -- data/imports/websters-1828-verified-sample.json --dry-run
```

The importer prints a summary with:

```text
total_entries_found
imported_entries
skipped_entries
errors
```

Do not scrape websites for this. Use a file from a documented source whose rights and transcription terms have been reviewed.

## Import TSK Cross References

Put your reviewed TSK import file anywhere local, commonly:

```text
data/imports/tsk-cross-references.json
```

Accepted formats: `.json` or `.csv`.

Required fields:

```text
verse_ref
target_ref
label
source
source_title
```

`source` should normally be `TSK`. `source_title` should normally be:

```text
Treasury of Scripture Knowledge
```

Run:

```bash
npm run import:tsk -- data/imports/tsk-cross-references.json
```

Use either sample format as a template:

```bash
npm run import:tsk -- data/import-formats/tsk-cross-references.sample.json
npm run import:tsk -- data/import-formats/tsk-cross-references.sample.csv
```

Cross references remain tied to the selected verse through `cross_references.verse_ref`.

### Prepare a TSK file from MetaV

A downloadable TSK source candidate is documented at:

```text
data/sources/tsk/source-manifest.json
```

The candidate uses the MetaV `CrossRefIndex.csv` and `Verses.csv` files. The original Treasury of Scripture Knowledge is public domain, but the MetaV repository files are published under Creative Commons Attribution-ShareAlike 3.0. Do not treat that CSV dataset as unrestricted public-domain app data until that license tradeoff is accepted.

If approved, convert the files into this app's import shape:

```bash
npm run prepare:tsk-metav -- \
  data/sources/tsk/Verses.csv \
  data/sources/tsk/CrossRefIndex.csv \
  data/imports/tsk-cross-references.json

npm run import:tsk -- data/imports/tsk-cross-references.json --dry-run
npm run import:tsk -- data/imports/tsk-cross-references.json
```

## Import Readiness Checklist

Use this before importing anything beyond the current verified samples.

### Full Webster's 1828 import

- Confirm the source file is downloaded from a documented public-domain source.
- Record source title, source URL, public-domain status, commercial-use notes, and attribution notes in `resource_sources`.
- Run the importer against `data/imports/websters-1828-verified-sample.json` first.
- Run the full file with `--dry-run` and review `total_entries_found`, `imported_entries`, `skipped_entries`, and `errors`.
- Import the full file only after the dry run has no unexpected skips or parsing errors.
- Spot-check common words in the app: `believe`, `begotten`, `grace`, `faith`, `charity`.

### TSK import

- Confirm the TSK source rights and transcription terms before import.
- Review `TSK_RIGHTS_REVIEW.md` before choosing a full source.
- Record source rights in `resource_sources`.
- Validate each row has `verse_ref`, `target_ref`, `label`, `source`, and `source_title`.
- Run the JSON and CSV sample imports before the full file.
- Spot-check John 3:14-18 and confirm cross references stay tied to the selected verse.

### First commentary import

- Current first commentary collection path: `data/commentary/expositors-bible-john/`.
- Source: Marcus Dods, `The Expositor's Bible: The Gospel of St. John, Volume I`, Project Gutenberg ebook 33151.
- Import only this one commentary collection until the workflow is proven.
- Confirm each entry has author, resource title, verse range, public-domain status, and source URL.
- Keep commentary brief in the drawer; use the Full Study view for deeper reading.
- Do not import unclear, modern, or copyrighted commentary content.

Dry-run the first sample:

```bash
npm run import:commentary -- data/commentary/expositors-bible-john/john-3-sample.json --dry-run
```

### Source rights verification

- Every resource needs a `resource_sources` row before import.
- Rights notes must include whether commercial use is allowed or needs review.
- Keep placeholder rows marked as placeholders until a real source is verified.
- Do not scrape websites for dictionary, TSK, commentary, or book content.

## Resource Library Plan

Future resource planning lives in:

```text
data/resource-library-plan.json
```

This is planning metadata only. It is not a library importer.

## Public-Domain Book Import Staging

Future public-domain books are staged under `data/library/`. This structure is for review and import preparation only; books are not imported into the app UI yet.

Use these folders:

```text
data/library/verified
data/library/needs-review
data/library/do-not-import
data/library/manifests
```

Folder rules:

- `verified`: only use after the exact title, author, edition/source, public-domain status, and commercial-use status are reviewed.
- `needs-review`: use for candidate books that look promising but still need rights/source verification.
- `do-not-import`: use for placeholders, unclear rights, modern compilations, or anything that should be blocked from import.
- `manifests`: store JSON manifests and schema files. Do not put full book text here.

The manifest schema lives at:

```text
data/library/manifests/book-manifest.schema.json
```

The current sample manifest lives at:

```text
data/library/manifests/sample-public-domain-books.json
```

The first curated 25-resource import manifest lives at:

```text
data/library/manifests/curated-public-domain-resources.json
```

Each manifest entry must include:

```text
title
author
year
category
source_url
file_path
public_domain_status
commercial_use_status
attribution_required
notes
import_status
```

Current sample manifest entries are metadata only:

- `The Pilgrim's Progress` by John Bunyan: verified public-domain candidate, no text imported.
- `E. M. Bounds on Prayer`: needs review because the exact work/source must be selected and modern compilations may have separate rights.
- `H. A. Ironside placeholder`: do not import until exact work/source/rights are verified.
- `Baptist history placeholder`: needs review until a specific public-domain title is chosen.

Do not add copyrighted, unclear, or modern compiled texts to `verified`. Do not expose these staged books in the app UI until a separate importer and rights review workflow is built.

### Curated library import workflow

The curated library system is data-first. It downloads and verifies source text files, records rights metadata, and prepares Supabase metadata rows without adding a book reader UI yet.

Run manifest validation:

```bash
npm run library:validate
```

Download verified public-domain text files:

```bash
npm run library:download
```

The downloader writes each text file under:

```text
data/library/verified/
```

It also updates the curated manifest with:

```text
word_count
file_size_bytes
checksum_sha256
```

Dry-run the Supabase metadata import:

```bash
npm run library:import -- --dry-run
```

Import library metadata to Supabase after `supabase/schema.sql` has been run and `SUPABASE_SERVICE_ROLE_KEY` is available in your shell:

```bash
npm run library:import
```

The first 25 verified resources currently cover:

- Bible study helps
- Baptist history
- Prayer
- Evangelism
- Christian life
- Preaching/teaching
- Missions
- Fiction/classics

Source texts are from Project Gutenberg. Project Gutenberg catalog pages report these selected works as public domain in the USA. The downloaded files retain Project Gutenberg license/header material, so redistribution should follow the Project Gutenberg license and trademark terms unless the text is cleaned and reviewed separately as a non-Project-Gutenberg derivative.
