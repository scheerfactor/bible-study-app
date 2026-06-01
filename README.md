# Father's Business Bible Study

A first working prototype for a mobile-first KJV Bible study app.

## Current Prototype

- Full KJV reader using the public-domain `es-kjv` package
- Book, chapter, and verse jump
- John 3:16 quick path from the Today screen
- Full KJV text search in the browser
- Study Drawer with Actions, Dictionary, Cross References, Notes, and Audio placeholder tabs
- Verse actions for highlight, note, bookmark, copy, and share
- Webster's 1828 lookup with word normalization for forms such as `believeth` -> `believe`
- John 3:14-18 sample cross references using the future TSK table structure
- Commentary tab and `commentary_entries` table placeholder
- Import scripts for Webster's 1828 entries and TSK cross references
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
    'user_bookmarks'
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
- Record source rights in `resource_sources`.
- Validate each row has `verse_ref`, `target_ref`, `label`, `source`, and `source_title`.
- Run the JSON and CSV sample imports before the full file.
- Spot-check John 3:14-18 and confirm cross references stay tied to the selected verse.

### First commentary import

- Import only a small verified public-domain sample first.
- Confirm each entry has author, resource title, verse range, public-domain status, and source URL.
- Keep commentary brief in the drawer; use the Full Study view for deeper reading.
- Do not import unclear, modern, or copyrighted commentary content.

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
