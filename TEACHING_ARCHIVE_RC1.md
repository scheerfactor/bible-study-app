# Teaching Workstation RC1 — Sermon / Lesson Archive

## What is implemented

Prepare to Teach now has a **Sermon / Lesson Archive** tab. Open a saved lesson or prepare a new one, review its notes and slides, enter the actual teaching date, church/location and audience, then choose **Preserve taught version**.

Each teaching occasion stores a deep snapshot of the complete working sermon/lesson, including its lesson plan, text, quotations/citations, illustrations, study notes, slide content/settings and teacher notes. Actual-delivery notes and review observations are separate from that prepared snapshot. Later recollections are appended; earlier notes are never overwritten.

Search checks all stored text, including nested lesson sections, slides, quotes, stories and delivery notes, with separate location and teaching-date filters. Search is case-insensitive, ANDs space-separated terms and normalizes dash characters. It is text search, not a Scripture-reference parser or semantic search.

**Revise / reuse in Prepare to Teach** creates a new saved draft, retains the message identity and source-event link, and clears scheduling/date/location/audience for the new occasion. It preserves the current draft before switching. The reuse tools allow replacing illustrations/quotes, restoring the prior material, or keeping both. The original stays in read-only history. Review/regenerate slides after revising lesson content; existing edited slides are deliberately retained.

The existing “Mark Preached”, “Mark Taught” and “Archive” actions now direct users through preservation rather than silently changing a label. A working draft is still editable after logging; the historical snapshot is a separate immutable record. Older Preached/Taught/Archived drafts are not automatically converted: review their currently available content and record the actual occasion. Versions overwritten before this feature cannot be reconstructed.

## Offline, backups and presentation

- Archive storage is separated by signed-in account or guest device scope. No automatic guest-to-account upload.
- Every local write holds a Web Lock, re-reads existing history and merges append-only records. A full/corrupt store produces an error, not a success message. Conflicting IDs stop restore without replacing data.
- Export/restore **archive backups** separately from the older Ministry Backup. The existing Ministry Backup does not contain this new archive.
- **Download private lesson pack** includes the message’s recorded versions and their delivery notes. Restore it through the archive to recover/reuse it on another device. Treat it as private because it includes teacher notes.
- **Download preserved slides (offline)** produces a self-contained audience HTML deck with the stored Scripture/text and no private notes. The existing text-focused export does not reproduce background images, audio, animations or all editor styling.
- Offline audience countdown slides now display a wall-clock countdown and advance to the next slide at zero. Returning to a countdown slide restarts it. Existing pre-class countdown builder remains available.
- Install/download offline study while online, then reload and use local lesson preparation and archiving offline. Licensed library resources/audio are not bundled.

Snapshots cover the sermon/lesson’s own saved slide deck. Independently edited Presentation Workspace decks, separate pre-class countdown configurations, media recordings and resources linked by URL are not bundled into the snapshot. Export separate presentation material as well when it differs from the lesson deck. No claim is made that prepared notes are a transcript of actual speech.

## Supabase integration and rollout

The referenced shared conversation is **Building A Ministry Archive**:
https://chatgpt.com/share/6aac82e3-bd44-83ea-93ce-a1ad7c30a403

Its existing `preaching_messages`, `preaching_events`, `preaching_message_versions` and `preaching_locations` tables were inspected read-only in the Bible Study project. Messages/events were empty at inspection. The new migration captures the four core table definitions for fresh installs and extends the existing event model; it does not introduce a competing archive table.

`preaching_events.prepared_snapshot` holds the versioned RC1 envelope; `message_id` groups teaching occasions. `preaching_event_addenda` stores append-only later delivery notes. Revision lineage is in the envelope. The separate existing message-version/illustration/quote libraries are not yet edited by this UI.

The two new RPCs use **security invoker** with ownership checks, authenticated-only execute, idempotent inserts and rejection of conflicting historical IDs. RLS isolates owners; event insertion checks ownership of referenced message/location/version. Event and addendum updates/deletes are blocked. Cascaded deletion through a parent message is also blocked. Consequently, account-erasure/retention tooling must explicitly address archived history in a controlled administrative migration; account deletion must not silently destroy it.

Sync is explicit, uses paginated reads and sends parents before revisions regardless of device clock order. Interrupted sync can be retried. No service-role key is added to the client. The UI reports migration/network failures and retains local records.

Apply `supabase/migrations/20260918002926_teaching_archive_rc1.sql` through the normal reviewed deployment process before enabling account sync on the deployed app. **This task did not deploy the migration or frontend.** The migration and database tests were executed together inside `BEGIN … ROLLBACK` against the existing schema; synthetic fixtures and schema changes were rolled back.

## Verification

- Archive unit tests: deep-copy preservation; revision identity and cleared scheduling; all requested search fields; date validation; delivery notes; backup validation/conflicts; lineage ordering; account scope; failed storage; duplicate occasions; concurrent appends; corrupt-storage preservation.
- Database transaction test: idempotent RPC retry, conflict rejection, event update/delete denial, cross-owner isolation and reference checks, anonymous denial, addendum retries and parent-cascade protection.
- Production build and TypeScript check.
- Existing Sunday School, countdown, presentation privacy and offline-worker tests.
- Browser workflow passed: offline reload, preservation, search, reuse at a different church, unchanged original, append-only notes, backup restore/conflict rejection, audience export, quota failure, mobile width and countdown auto-advance.
- Existing release browser regression passed: all 31,102 KJV verses available offline, saved lesson slides, private-answer exclusion, teaching timer, pre-class countdown at phone width, dated lesson template and reload persistence.
- Lint: zero errors; two existing unused-symbol warnings in the large page component.

Reproduce with `npm run test:teaching-archive`, `npm run test:sunday-school`, `npm run test:offline`, `node scripts/test-pre-class-countdown.mjs`, `node scripts/test-presentation-export-privacy.mjs`, and `npm run build -- --webpack`. Start the app and run `RELEASE_TEST_URL=http://127.0.0.1:3117 node scripts/check-teaching-archive-browser.mjs`. Database test fixtures are in `supabase/tests/teaching_archive.sql`; begin a transaction first and apply the migration in it when testing against a schema where it is not installed. The test ends with rollback.

## Remaining release gates / next milestone

1. Deploy this branch and migration to a review environment; verify real sign-in and two-device archive sync, retry and sign-out. Browser tests in this task use guest local storage; database tests cover authenticated authorization.
2. Run the complete offline teaching loop on physical Mac/iPad and an external projector. Verify presenter/audience separation, background assets, countdown transitions and recovery after screen sleep.
3. Bundle independently edited presentation decks and pre-class settings with a versioned lesson pack, with explicit rights-aware media availability.
4. Add reviewed shared illustration/quote alternatives and prepared-versus-recorded-transcript comparison incrementally. No automatic transcription, content expansion or app-store packaging is claimed by RC1.

KJV text, doctrine and licensing policies remain unchanged. No new third-party content or recordings were imported.
