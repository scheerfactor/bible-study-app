# Performance Checklist

Use this checklist before private beta updates and before adding more content. The goal is to keep the app fast, Bible-centered, and comfortable on a phone.

## Core Rule

The Bible reader should feel useful within five minutes and should not wait on large books, audio files, or full resource libraries to load.

## App Bundle

- Keep Next.js app code small and focused.
- Do not import large public-domain book text directly into client components.
- Do not bundle future audio files.
- Avoid adding large client-side libraries unless they solve a real beta problem.
- Keep icons and UI assets lightweight.
- Review bundle size after major feature additions.

## Initial Load

- Load the Today screen and Bible reader quickly.
- Do not load the entire library body on first page load.
- Do not load the full Webster dictionary in the browser.
- Do not load the full TSK dataset in the browser.
- Fetch only the data needed for the current view.
- Keep mobile first: test with a phone-sized viewport.

## Bible Reader

- Fetch or render one chapter at a time when possible.
- Cache recently opened chapters.
- Keep previous/next chapter navigation instant or near-instant.
- Keep John 3, Luke 24, and Romans 8 fast because they are common test passages.
- Avoid rerendering the whole app when selecting a verse.
- Keep the Study Drawer lightweight while Bible text remains visible.

## Dictionary Lookup

- Normalize words before lookup.
- Query by `normalized_headword`.
- Cache common lookups such as `believe`, `love`, `grace`, `faith`, and `repentance`.
- Cache not-found responses briefly so repeated taps do not cause repeated server work.
- Return one best definition first; deeper dictionary browsing can come later.
- Keep raw source import files out of the browser.

## Cross References and TSK

- Fetch cross references by selected verse.
- For chapter views, fetch only references for the current chapter.
- Cache current verse and current chapter cross-reference results.
- Keep sample references fast while the full TSK rights/import plan is completed.
- Do not send the full TSK dataset to the browser.

## Chapter Study Data

- Cache chapter study data by `book` and `chapter`.
- Keep people, places, types, prophecy connections, key words, and recommendations grouped by chapter.
- Use compact previews on the Bible screen.
- Defer deeper pages until the user taps for more.
- Avoid heavy panels that compete with the Bible text.

## Library Metadata

- Load metadata separately from full text.
- Cache library metadata because it changes slowly.
- Search metadata first: title, author, category, labels, rights status, recommended use.
- Keep rights and doctrinal review labels visible without loading book bodies.
- Paginate or filter library lists when the collection grows.

## Library Reader

- Do not load entire long books into the browser if avoidable.
- Add chunking for long books.
- Fetch current chunk plus nearby chunks.
- Save progress by resource and chunk/location.
- Preserve font size, theme, and reading width without rerendering large text unnecessarily.
- Keep Continue Reading fast.
- Mark complete when the user reaches the end without needing all prior chunks loaded.

## Book Chunking

Use chunking when a resource is long enough to hurt mobile load time.

Chunk by:

- Chapter
- Section
- Sermon
- Heading
- Word count fallback

Each chunk should have:

- Resource slug
- Chunk number
- Section title
- Word count
- Storage path
- Plain-text preview
- Search index fields

## Audio and Listen Mode

- Continue using browser/device text-to-speech first.
- Do not bundle audio files in the app.
- Store future audio files in Supabase Storage or Cloudflare R2.
- Cache only the current audio URL or playlist item.
- Save listening progress.
- Keep speed controls responsive.
- Stop playback cleanly when changing resource or passage.
- Use sleep timer without requiring background server work.

## Search

- Keep Bible search fast by avoiding full client-side scans at production scale.
- Prepare Postgres full-text search for Bible, dictionary, commentary, and library chunks.
- Start with simple ranking:
  - exact reference match
  - exact phrase match
  - title/author match
  - word match
- Add a dedicated search index only if Postgres search becomes too slow.
- Never search unreviewed or do-not-import resources in the public app.

## Supabase Postgres

- Add indexes before full imports become large.
- Index lookup-heavy fields.
- Use RLS for user-owned data.
- Avoid broad queries without `limit`.
- Avoid fetching text bodies when only metadata is needed.
- Keep service-role imports server/local only.
- Never expose service-role keys in browser code.

Suggested indexes to verify later:

```text
dictionary_entries(normalized_headword)
cross_references(verse_ref)
cross_references(target_ref)
commentary_entries(book, chapter, verse_start, verse_end)
resource_sources(title)
library_resources(slug)
library_resources(category)
library_resource_chunks(resource_slug, chunk_number)
user_notes(user_id, verse_ref)
user_highlights(user_id, verse_ref)
user_bookmarks(user_id, verse_ref)
```

## Supabase Storage or Cloudflare R2

- Store only verified resources in public/readable storage paths.
- Keep needs-review and do-not-import files private.
- Record every storage object in metadata.
- Use CDN caching for public-domain public files.
- Use signed URLs only when rights or privacy require it.
- Keep future audio files outside the app bundle.

## Caching Checklist

Add or verify caching for:

- Bible chapters
- Dictionary lookups
- Library metadata
- Chapter study data
- Cross references
- Book introductions
- Resource detail metadata
- Current library chunks

Suggested cache lifetimes:

- Bible chapters: long cache, changes rarely.
- Dictionary entries: long cache after import is stable.
- Cross references: medium to long cache after rights-reviewed import.
- Library metadata: medium cache, refresh after admin edits.
- User notes/highlights/bookmarks: no shared cache.
- Audio URLs: cache according to storage provider and rights rules.

## Mobile UX Performance

- Test on a phone viewport before shipping.
- Confirm the bottom navigation does not cover drawer or reader controls.
- Keep the Study Drawer half-height by default.
- Keep tap targets large enough.
- Avoid layout shifts when tabs, cards, or text load.
- Keep Bible text readable before secondary study data appears.

## Beta Test Performance Flow

Run this after major content or storage changes:

1. Open the app on a phone-sized viewport.
2. Open John 3.
3. Jump to John 3:16.
4. Open the Study Drawer.
5. Tap a key word and load Webster's 1828.
6. Open cross references.
7. Open Book Introduction.
8. Search for `believe`.
9. Open the Library.
10. Search by title and author.
11. Open a long resource.
12. Confirm the reader does not freeze.
13. Continue reading after refresh.
14. Export notes.

## Warning Signs

Fix these before adding more content:

- Initial load feels slow on phone.
- Browser downloads large text files before the user opens them.
- Search freezes the UI.
- Opening a book loads the entire library.
- Study Drawer lags after selecting a verse.
- Build size grows because imported content was bundled.
- Supabase queries fetch all rows without limits.
- User-owned data appears in shared cache.

## Next Speed Improvements

1. Move Bible chapter reads behind a cached API endpoint.
2. Move Webster lookups behind a cached server lookup.
3. Add chunked library reading for long books.
4. Store large verified text files in Supabase Storage or R2.
5. Add Postgres full-text search for metadata and resource chunks.
6. Add lightweight loading states for chapter data and dictionary lookups.
7. Measure mobile performance before expanding the library again.

