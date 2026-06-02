# Storage Strategy

This plan keeps Father's Business Bible Study fast, rights-safe, and affordable as the app grows from a beta Bible reader into a larger study and library platform.

## Guiding Principle

Keep small, structured, frequently queried data close to the app and database. Move large text and future audio assets out of the app bundle and into durable object storage.

The app should not require a user's phone to download large books, full libraries, or audio files before the user can read the Bible.

## Storage Tiers

### 1. GitHub and Vercel

Use GitHub and Vercel for:

- Next.js app code
- UI components
- Import scripts
- Small sample data
- Small metadata files used during development
- Documentation and policies
- Public beta checklists
- Source manifests when they are small enough to review in Git

Do not use GitHub/Vercel for:

- Large imported book text files at scale
- Full audio libraries
- Private keys
- User notes, highlights, bookmarks, progress, or account data
- Large generated indexes that make builds slow

Reason: Vercel should deploy a lean app. Large content files increase build size, slow deploys, and can accidentally push the browser toward downloading too much data.

### 2. Supabase Postgres

Use Supabase Postgres for searchable, structured, permission-aware data:

- User accounts through Supabase Auth
- User notes
- User highlights
- User bookmarks
- User library progress
- User completed resources
- User listening progress
- Resource metadata
- Rights metadata
- Doctrinal review metadata
- Library categories and labels
- Chapter recommendations
- Chapter study metadata
- Bible book/chapter/verse metadata
- Dictionary lookup index
- TSK lookup index
- Commentary metadata and verse ranges

Keep these fields indexed for fast lookup:

- Bible reference fields: `book`, `chapter`, `verse`, `verse_ref`
- Dictionary fields: `headword`, `normalized_headword`
- Cross-reference fields: `verse_ref`, `target_ref`, `source`
- Commentary fields: `book`, `chapter`, `verse_start`, `verse_end`, `source_id`
- Resource fields: `slug`, `title`, `author`, `category`, `import_status`, `rights_status`
- User data fields: `user_id`, `verse_ref`, `resource_slug`, `updated_at`

Use Postgres full-text search later for:

- Bible text search
- Dictionary entry search
- Library title/author/category search
- Resource body search when chunks are stored or indexed
- Commentary search after verified imports

### 3. Fast Server-Side Lookup Data

Keep these optimized for fast server-side lookup:

- KJV Bible chapters
- Webster's 1828 lookup index
- TSK lookup index
- Core study metadata
- People, places, types of Christ, prophecy connections
- Book introductions
- Chapter recommendations

Recommended approach:

- Store canonical records in Supabase Postgres.
- Use API routes or server functions to fetch small slices by reference.
- Cache common lookups.
- Return only the current chapter, current word definition, or current verse's study data.

Do not send the whole Bible, full Webster dictionary, or full TSK dataset to the browser as one large payload.

### 4. Supabase Storage or Cloudflare R2

Move large content assets to object storage:

- Full public-domain book text files
- Long OCR source files
- Future audiobook files
- Future Bible audio files
- Future generated or licensed media files
- Large exports or archived import packages

Recommended default:

- Use Supabase Storage while the app is mostly Supabase-centered and beta-scale.
- Consider Cloudflare R2 when file volume, bandwidth, or CDN needs grow.

Use object storage paths like:

```text
library/verified/{resource_slug}/source.txt
library/verified/{resource_slug}/chunks/{chunk_number}.txt
audio/bible/kjv/{book}/{chapter}.mp3
audio/library/{resource_slug}/{section_id}.mp3
imports/raw/{source_slug}/{filename}
```

Keep searchable metadata in Postgres even when the file body is in storage.

## Library Text Strategy

Do not load entire long books into the browser if avoidable.

For short books:

- The reader may fetch the full text if file size is small.
- Keep a clear size threshold.

For long books:

- Split into chunks during import.
- Store chunk metadata in Postgres.
- Store chunk text either in Postgres or object storage depending on size.
- Fetch the current chunk plus nearby chunks.
- Save progress by `resource_slug`, `chunk_id`, and scroll/progress percentage.

Recommended future tables:

```text
library_resource_chunks
library_resource_search_index
library_resource_assets
```

Suggested chunk fields:

```text
id
resource_slug
chunk_number
title
section_label
start_location
end_location
word_count
storage_path
plain_text_preview
search_vector
created_at
updated_at
```

## Bible Text Strategy

The KJV Bible should remain fast and central.

For beta:

- Current local KJV package can remain acceptable while the app is small.
- Add server-side chapter endpoints as the next step.

For production:

- Store Bible books, chapters, and verses in Postgres.
- Fetch by book and chapter.
- Cache chapter responses aggressively.
- Keep verse text payloads small and predictable.
- Avoid sending all 31,000+ verses to the browser on initial load.

Recommended endpoint shape:

```text
GET /api/bible/chapter?book=John&chapter=3
GET /api/bible/verse?ref=John%203%3A16
GET /api/bible/search?q=believe&testament=new
```

## Dictionary Strategy

Webster's 1828 should be searched by normalized headword first.

Keep in Postgres:

- `headword`
- `normalized_headword`
- `definition`
- `source_id`
- `source_line_start`
- `source_line_end`
- `review_status`
- `search_vector`

Use object storage only for raw import files or source archives.

Cache:

- Common words
- Normalized lookups
- Not-found responses for short periods

Do not load the full dictionary in the browser.

## TSK Strategy

Treasury of Scripture Knowledge data should be verse-centered.

Keep in Postgres:

- Source verse
- Target verse
- Label
- Source
- Source rights metadata
- Optional confidence/review status

Fetch cross references by selected verse or current chapter.

Cache:

- Current verse references
- Current chapter references
- John/Romans/Luke beta test references

Do not load the full TSK dataset in the browser.

## Commentary Strategy

Commentary should be imported one verified collection at a time.

Keep in Postgres:

- Resource metadata
- Source rights metadata
- Book/chapter/verse range
- Author
- Resource title
- Entry text for short entries
- Storage path for long entries if needed

For longer commentary sections:

- Store chunk text in object storage.
- Store searchable metadata and previews in Postgres.
- Fetch only entries that match the current passage.

## Audio Strategy

Current phase:

- Browser/device text-to-speech only.
- Save listening progress locally.
- Prepare table names for future Supabase sync.

Future phase:

- Store licensed KJV audio or public-domain audio in Supabase Storage or Cloudflare R2.
- Store audio metadata in Postgres.
- Fetch signed or public URLs depending on rights.
- Cache current chapter audio URLs.
- Never bundle audio files into the app.

Recommended future audio metadata:

```text
audio_assets
audio_playlist_items
user_listening_progress
```

## Caching Strategy

Add caching for:

- Bible chapters
- Dictionary lookups
- Library metadata
- Chapter study data
- Cross references
- Book introductions
- Resource detail metadata

Recommended layers:

1. Browser memory cache for the current session.
2. Browser local storage or IndexedDB for small user-safe cached data.
3. Next.js route caching for public reference data.
4. Supabase/Postgres indexes for direct lookup speed.
5. CDN/object storage caching for large public files.

Cache carefully:

- Public Bible/reference data can cache longer.
- User notes/highlights/bookmarks should not be globally cached.
- Rights/review metadata should refresh when changed by admins.

## Search Strategy

Prepare future full-text search using either:

- Postgres full-text search for the first production phase.
- A dedicated search index later if scale requires it.

Start with Postgres full-text search because:

- It keeps the stack simpler.
- It can search Bible, dictionary, commentary, and resource metadata.
- It works well for controlled, rights-reviewed content.

Consider a dedicated search index later if:

- Library grows to thousands of resources.
- Search latency becomes too slow.
- Ranking, typo tolerance, or faceted search becomes important.

## Data Ownership Summary

| Data | Primary Home | Notes |
| --- | --- | --- |
| App code | GitHub/Vercel | Keep lean and deployable |
| Small metadata | GitHub or Postgres | Git for reviewed static docs; Postgres for live app lookup |
| Bible text | Postgres/server lookup | Cache by chapter |
| Webster index | Postgres | Cache by normalized word |
| TSK index | Postgres | Cache by verse/chapter |
| Core study metadata | Postgres or small static data | Move to Postgres as it grows |
| Library metadata | Postgres | Searchable and filterable |
| Large library text | Supabase Storage or R2 | Chunk long books |
| Future audio files | Supabase Storage or R2 | Never bundle in app |
| User notes/highlights/bookmarks | Supabase Postgres | RLS required |
| User progress | Supabase Postgres later | Local first during beta is acceptable |

## Next Implementation Steps

1. Define size thresholds for full-text loading versus chunked loading.
2. Add API endpoints for Bible chapter and verse lookup.
3. Move dictionary lookup fully server-side.
4. Add Postgres indexes for lookup-heavy fields.
5. Add a chunking import step for long library resources.
6. Store large verified library text in Supabase Storage or R2.
7. Add metadata-only library search first.
8. Add full-text search for chunks after the chunk table exists.
9. Add cache headers for public reference endpoints.
10. Keep user-owned data protected by RLS and avoid global caching.

