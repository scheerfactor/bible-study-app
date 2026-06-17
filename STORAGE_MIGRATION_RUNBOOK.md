# Storage Migration Runbook

## Goal

Keep Father's Business Bible Study deployable on Vercel while allowing the Library, commentary collection, dictionaries, audio, sermon media, and presentation assets to keep growing.

The immediate technical target is:

- Keep every Vercel serverless function well below the 250 MB unzipped limit.
- Keep initial app load focused on Today/Bible, not full library/commentary data.
- Move large public content out of the app bundle and out of serverless functions.
- Keep searchable metadata and review/rights records structured.

## Current State

As of the storage refactor:

- The main page no longer bundles commentary bodies.
- Commentary batches load after the user opens Bible/study/commentary workflows.
- Webster's 1828 and the Library manifest no longer bundle into serverless functions.
- Library text and Webster data are temporarily fetched from GitHub raw in production.
- Vercel function sizes are safe:
  - Root page: about 8.45 MB
  - API routes: about 2.34 MB

This is a safe beta stopgap, not the final storage architecture.

## Provider Decision

Use a two-layer storage model.

### Supabase

Use Supabase for:

- Auth
- User notes
- Highlights
- Bookmarks
- Reading/listening progress
- Sermons and sermon drafts
- Prayer and journal data
- Rights metadata
- Resource metadata
- Search indexes
- Review workflow tables

Reason: this data is relational, user-specific, searchable, and permission-sensitive.

### Cloudflare R2

Use Cloudflare R2 for:

- Public-domain book text files
- Commentary body files
- Webster source JSON/chunks
- Large dictionary/reference files
- Public-domain cover images
- Presentation media assets
- Future public-domain audio
- Future licensed audio when permission allows public delivery

Reason: library-heavy apps create storage and bandwidth pressure. R2 is a strong fit for large public objects and CDN-style delivery. Supabase Pro remains useful for auth, user data, metadata, search indexes, and review workflow records. Confirm current provider pricing before committing to the paid storage tier.

## Storage Paths

Use stable object paths. Do not encode implementation details that may change later.

```text
library/verified/{resource_slug}/source.txt
library/verified/{resource_slug}/chunks/{chunk_number}.txt
library/verified/{resource_slug}/cover.webp

commentary/{author_slug}/{work_slug}/{book_slug}/{chapter}.json
commentary/{author_slug}/{work_slug}/manifest.json

dictionaries/webster-1828/chunks/{letter}.json
dictionaries/easton/source.json
dictionaries/smith/source.json
dictionaries/nave/source.json

study-tools/tsk/{book_slug}/{chapter}.json
study-tools/strongs/{language}/{strongs_number}.json

media/presentation/backgrounds/{category}/{asset_slug}.webp
media/authors/{author_slug}/portrait.webp

audio/library/{resource_slug}/{section_id}.mp3
audio/sermons/{preacher_slug}/{sermon_slug}.mp3
audio/bible/kjv/{book_slug}/{chapter}.mp3
```

## Metadata Tables

Supabase should hold metadata and indexes, not large text bodies.

Recommended tables:

```text
library_resources
library_resource_assets
library_resource_chunks
library_resource_search_index

commentary_resources
commentary_entries
commentary_entry_assets

dictionary_sources
dictionary_entries

cross_references
strongs_entries

media_assets
audio_assets

rights_records
rights_holders
permission_requests
resource_review_queue
```

Minimum fields for `library_resource_chunks`:

```text
id
resource_slug
chunk_number
title
section_label
word_count
storage_bucket
storage_path
plain_text_preview
checksum
ocr_quality_score
safe_for_reading
safe_for_quoting
created_at
updated_at
```

Minimum fields for `commentary_entries`:

```text
id
book
chapter
verse_start
verse_end
author
resource_title
entry_preview
storage_bucket
storage_path
source_url
public_domain_status
rights_basis
review_status
created_at
updated_at
```

## API Shape

The browser should request small slices.

```text
GET /api/library
GET /api/library/{slug}
GET /api/library/{slug}/chunk/{chunk_number}

GET /api/commentary?book=John&chapter=3
GET /api/commentary/{entry_id}

GET /api/dictionary?query=believe
GET /api/dictionary/{headword}

GET /api/study-tools/tsk?ref=John%203%3A16
GET /api/strongs?query=G4100
```

## Migration Phases

### Phase 1: Stabilize Vercel

Status: complete.

- Remove commentary bodies from the page bundle.
- Remove Webster JSON from serverless bundles.
- Remove Library manifest from serverless bundles.
- Keep GitHub raw as a temporary production data source.

### Phase 2: Add Storage Adapter

Status: started.

Create a storage helper that can read from:

- local files in development
- GitHub raw during transition
- R2 in production

Implemented starting point:

- `src/lib/server-content-storage.ts`
- Reads local files in development.
- Reads from `CONTENT_PUBLIC_BASE_URL` in production when configured.
- Falls back to GitHub raw in production during transition.
- Used by Webster, Library manifest, Library reader API, and Study Tools search.

Recommended environment variables:

```text
CONTENT_PUBLIC_BASE_URL=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_PUBLIC_CONTENT=
```

Do not expose R2 secret keys in client code.

### Phase 3: Move Public Library Text

Start with public-domain Library text:

1. Upload `data/library/verified/*.txt` to R2.
2. Keep resource metadata in Git/Supabase.
3. Add `storage_path` and `storage_provider` to resource metadata.
4. Change reader API to fetch selected text from storage.
5. Add chunking for long books.

Do not import the next large book batch until this phase is working.

### Phase 4: Move Commentary Bodies

1. Keep commentary metadata and previews in Supabase/Postgres.
2. Store full commentary body files in R2 by book/chapter/author.
3. Load only current chapter commentary in the Bible Reader and Passage Guide.
4. Keep Commentary Explorer searchable by metadata and preview.

### Phase 5: Move Dictionary and Study Tools

1. Split Webster into alphabet chunks or Postgres dictionary rows.
2. Store TSK by book/chapter or verse.
3. Store Strong's lookup data by number/language.
4. Cache common lookups.

### Phase 6: Audio and Media

1. Move presentation background assets to R2 once the media library grows.
2. Store audiobook and sermon audio in R2.
3. Keep all rights/licensing metadata in Supabase.
4. Use signed URLs only where licensing requires controlled access.

## Content Growth Gate

Before adding another large batch of 200+ books or 1,000+ commentary entries, complete:

- Storage adapter
- R2 bucket and path convention
- Library text upload script
- Manifest/storage path update script
- Reader API fetch from R2
- Commentary chapter fetch API

After that, content growth can resume without pushing Vercel toward size limits.

Use `STORAGE_READY_CONTENT_QUEUE.md` as the first acquisition queue after this gate is complete.

## Next Content Batch Priority

Prepare but do not bulk-import until Phase 3 is done:

1. Pulpit Commentary and Biblical Illustrator coverage by book/chapter.
2. Matthew Poole coverage where parser quality is clean.
3. H. A. Ironside verified works and commentaries.
4. Spurgeon sermons/books and Treasury of David refinement.
5. Baptist history and English Bible/KJV history works.
6. Missions biographies and revival/preaching books.

## QA Checklist

Run before committing storage changes:

```bash
npm run library:qa
npm run library:validate
npm run validate:commentary
npm run validate:strongs
npm run lint
npm run build
VERCEL_ANALYZE_BUILD_OUTPUT=1 npx vercel@latest build --prod --yes
```

Verify:

- Root function remains under 25 MB.
- API functions remain under 10 MB.
- Library count is correct.
- Dictionary lookup works.
- Book detail loads text.
- Commentary Explorer loads counts after opening.
- Mobile 390px has no horizontal overflow.
- No console errors.
