# Sunday School preparation and presentation audit

Audited 2026-09-07 against origin/main `ddf12918` in isolated branch `codex/sunday-school-workflow`.

## Verdict

The app already contains much of the preparation and presentation machinery. This slice makes a complete, editable, 35-minute lesson path practical for 2 Corinthians 2, 3, and 6, and adds an audience-only offline presentation. It does **not** establish full Logos/Proclaim parity or certify the church projector/remote setup.

The cached prior conversation supplied a theme and outline description, not the actual Word/MP4 files. These are new original teaching drafts, not recovered copies of the previous package. September 13 is an editable assumption for the current lesson; chapter 3 remains unscheduled (“if asked”); chapter 6 is October 11, 2026. Final teacher review is required, and the app says so.

## Capability and gap map

| Workflow | Evidence in existing app | Result / remaining gap |
|---|---|---|
| Passage study | Complete es-kjv reader; passage guide; quick jump | Fixed chapter-only slide lookup that returned only five verses. Added Study lesson passage navigation from the builder. |
| Resource selection | Curated Library and author/doctrinal profiles; smart sermon suggestions | Eleven chapter commentary entries locally available for each test chapter. Catalog availability does not imply ownership or endorsement. |
| Commentary comparison | Commentary Explorer and comparison panels | Added persistent teacher comparison notes: source, passage, agreement/difference, conclusion from Scripture. No fabricated author summaries. |
| Dictionary / Strong’s | Webster lookup and Strong’s API; verified lexicon data | Strong’s validator passes 14,296 entries. Local API has zero verse-linked mappings for chapters 2, 3, 6 (`chapter-shard-missing`). Restore/configure reviewed storage shards before claiming that path works. |
| Cross-references | TSK imports, passage guide and Bible navigation | Existing July 16 coverage report lists 13/13 chapters but only 24 verse anchors across 2 Corinthians; chapter coverage is not verse depth. New templates include explicit contextual study prompts. |
| Notes | Personal notes; Send to Sermon; imported source notes | Reused existing transfer paths. Resource comparison is a manual teacher synthesis, not automatic research. |
| Lesson building | Sections, sermon manager, series, status, duplication, backups | New structured, optional lesson plan; usable for any Lesson, with three real starters. Legacy sermons still load. |
| Timed teaching | Timer previously divided target time equally across sections | New segment minutes, cumulative schedule, target mismatch notice, question/answer/application teaching view. |
| Discussion / application | Scattered existing starter content and plain sections | Each new lesson has four questions, private answer guides, and applications; all editable. |
| Illustration / prayer | Existing illustration field and prayer connections | Original analogy per lesson, prayer prompts in plan and closing slide. |
| Hymns / media | Media library, motifs, themes, Countdown slide type | Suggestions only. No lyrics/recordings imported and no assumption that hymn age licenses a recording. Automated five-minute music/Q&A/video sequence remains missing. |
| Slide generation | Title, Scripture, points, quote, application, closing | Removed silent 18-slide cap. New lesson deck follows segment order and preserves complete passage readings. Teacher answer guides become speaker notes. |
| Preview / export | In-app preview; PPTX; printable HTML/PDF via browser | Verified PPTX downloads and ZIP contents. Added self-contained HTML with escaped audience text, keyboard/touch buttons, blank screen and fullscreen control. Plain offline styling intentionally omits media, timers and speaker notes. |
| Church presentation | Existing presenter, display and controller workspaces | Offline same-device deck tested. Existing multi-device sessions and church network/projector have not been verified by this audit. |
| Data integrity | Local sermon save; Ministry Backup/Restore | New starter preserves current draft first and aborts on storage failure; Save reports failure instead of success. Slides require explicit regeneration after edits; replacement asks before overwriting. Not cloud sync or autosave. |

## Actual test cases

| Lesson | Main emphasis | Planned time | Generated deck |
|---|---|---:|---:|
| 2 Corinthians 2:1–17 | Forgiveness, comfort, confirmed love; sincere ministry | 35 min | 24 slides |
| 2 Corinthians 3:1–18 | Sufficiency from God, new testament ministry, transformation | 35 min | 23 slides |
| 2 Corinthians 6:1–18 | Faithful ministry, open heart, holy separation | 35 min | 23 slides |

For each chapter, the local commentary endpoint returns HTTP 200 with 11 chapter entries. Authors: Adam Clarke, E. P. Gould, Albert Barnes, Joseph S. Exell, G. Campbell Morgan, Jamieson-Fausset-Brown, Matthew Henry, Matthew Poole, Henry J. Foster, Joseph S. Exell and H. D. M. Spence-Jones, and John Wesley. Ironside, Bogard and Sorenson are not in these chapter indexes. Some authors have doctrinal differences or translation discussions; retain the existing discernment labels. Do not import owned Logos books merely because the user owns them.

## Controlled slices implemented

1. **Lesson model and editor:** optional backward-compatible `lessonPlan`; normalize restored content; section timing, question/answer/application, prayer and preparation notes. Three original drafts with KJV references. Existing KJV data supplies Scripture wording, not generated quotations.
2. **Preparation to presentation:** integrate plan in teaching mode and exports; generate section-based slides; fix five-verse chapter lookup and 18-slide truncation; protect edited slides from accidental replacement. Generic transcript generation remains independent of the lesson plan.
3. **Church fallback:** standalone audience HTML uses no server, CDN, media downloads, remote session, account, or connection. Speaker notes are not serialized into it. It has arrows/space/page navigation, Home/End, B to blank, and F/fullscreen button. Blank screen is reversible by keyboard or click.

No schema, auth, deployment, rights manifest, or doctrine changes. The large existing page was integrated narrowly rather than rewritten; new editor/data/export code lives in separate files.

## Verification

- `npm run build -- --webpack`: production compilation, TypeScript, and 21 static pages passed. Webpack is the repository's configured alternative, used with existing shared dependency installation; Turbopack was not verified.
- `npm run lint`: passed (final rerun after browser-test cleanup).
- `npm run test:sunday-school`: timing, three templates, legacy absence, malformed backup values, export completeness, HTML escaping and private-note exclusion.
- `npm run library:qa`: passed for 2,241 catalog resources; warnings identify storage-backed files that cannot be checked without `CONTENT_PUBLIC_BASE_URL`. This is not a claim all remote full texts were fetched.
- `npm run validate:commentary`: 349 files validated, 345/345 publishable files connected, 15,235 rows.
- `npm run validate:strongs`: 14,296 entries, zero errors/warnings. Lexicon validation does not prove chapter mapping availability.
- Production browser checks: all templates load/save; final verse included; private answer guides stay out of slide bodies; 35-minute teaching schedule; 390×844 builder has no horizontal overflow; Study lesson passage navigates to chapter 6; zero page exceptions.
- Offline browser checks: all 70 exported slides fit at 1280×720; one slide visible; first/last/next controls; blank/unblank; runs with connection disabled.
- PPTX: actual app downloads succeed; archives have 24/23/23 slides with matching notes counts and final prayer slide. Native PowerPoint rendering on the church machine remains unverified.

Run browser checks against a production server on port 3107 with `node scripts/check-sunday-browser.mjs`; optional `SUNDAY_TEST_OUTPUT` chooses an artifact folder (default temporary directory). Browser tests use a fresh profile and do not touch user account data.

## Next bounded slices

1. Restore/configure reviewed Strong’s chapter shards and check the actual deployed app; validate the selected words for all three chapters. Confirm remote Library full-text retrieval with deployment content configuration.
2. Add explicit local draft recovery/autosave and revision history with storage-failure tests. Existing manual Save and Ministry Backup remain necessary.
3. Improve source-linked comparison capture and student handouts with teacher answers excluded. Verify passage-level coverage and edition rights before adding paid sources.
4. Add reviewed pre-class cue lists with separate permissions for lyrics, arrangement, recording and background. Include loop timing and playback failure behavior before adding video production.
5. Rehearse existing display/controller with the church hardware, then audit server-side controller authorization before relying on cross-device control. This slice intentionally provides an independent local presentation option.

## Comparison sources

Official documentation checked September 7, 2026:

- [Logos Sermon Builder](https://support.logos.com/hc/en-us/articles/360016747391-Sermon-Builder): coordinated manuscript, slides, handouts and discussion output; the app's remaining student-handout and source-depth gaps are substantial.
- [Proclaim order of service](https://support.proclaim.logos.com/hc/en-us/articles/19863521025293-Order-Of-Service-Overview): timed pre-service/warm-up/service/post-service sequencing.
- [Proclaim audio tracks](https://support.proclaim.logos.com/hc/en-us/articles/19864256120077-How-Do-I-Add-An-Audio-Track-To-A-Service-Item-Or-Section): section audio and repeat/stop behavior; not implemented by a hymn suggestion or static countdown.
