# Father’s Business Bible Study Beta Release Checklist

Use this file before inviting real private beta testers. The goal is not to claim the app is finished; the goal is to make clear what is ready, what is limited, and what testers should report.

## Release Status

- Production URL: https://bible-study-app-eight.vercel.app/
- Current beta focus: Bible reader, study drawer, book introductions, teaching workflow, library reader, listening controls, and feedback.
- Library status: 128 verified, file-backed public resources.
- Bible survey status: 66 of 66 books covered.
- Commentary status: reviewed public entries are visible; full JFB and Matthew Henry source batches remain staged for review.
- Account status: Supabase sync is supported when environment variables and schema are configured; signed-out local storage remains available.

## What Works

- KJV Bible reader with book, chapter, verse navigation.
- Quick Jump for references such as `John 3`, `John 3:16`, `Romans 8:28`, and `Luke 24`.
- Recent passages, pinned favorites, and four Bible markers.
- Study Drawer with Study, Actions, Dictionary, Occurrences, Cross References, Notes, Audio, Commentary, and Memory.
- Webster lookup starter data plus imported dictionary lookup path.
- Notes, highlights, bookmarks, local fallback, and export JSON.
- 66-book Bible surveys in Book Introduction, Study Collection, and Teaching Workspace.
- Teaching Workspace with chapter analysis, export, commentary comparison, teacher notes, and section toggles.
- Library with 128 verified resources, author pages, shelves, collections, reader, progress, bookmarks, notes, and listening.
- Study playlists and listening controls using browser/device speech synthesis.
- Commentary Dashboard and reviewed commentary entries.
- Feedback page with copyable beta questions.

## Known Limitations

- Speech synthesis uses the browser/device voice. It is not licensed Bible audio and not AI narration.
- Supabase testing depends on a correctly configured project, schema, and RLS policies.
- Full JFB and Matthew Henry commentary source batches are staged and hidden until reviewed.
- Some author quotes remain marked for future exact-source review.
- Prayer and journal areas are placeholders on the Today screen.
- Admin Import Dashboard is hidden from normal navigation and should only be tested by admins.
- Personal book upload is a placeholder; public user uploads are not enabled.
- Strong’s numbers, paid content, sermon slides, AI tools, and marketplace features are not part of this beta.

## Quality Audit Notes

- Bible Reader: loads quickly in live QA; Quick Jump worked on mobile and desktop.
- Markers and favorites: local-storage based; testers should verify persistence after refresh.
- Study Drawer: dense but usable; testers should check drawer height controls and tab scrolling on phones.
- Book Introductions and Bible Surveys: all 66 books are present; content is concise survey-level material and can be expanded later.
- Teaching Workspace: powerful but information-rich; testers should report confusing labels or sections they would hide by default.
- Library: verified resources load and shelves have counts; long books should be tested for reading progress and listening comfort.
- Reader and Listening: stop controls should cancel active speech without a refresh; testers should try sleep timer and speed changes.
- Study Playlists: local-only for beta; testers should verify resume, stop, and duplicate prevention.
- Commentary Dashboard: validation passes; testers should report sluggishness if author/coverage panels feel heavy on older phones.
- Author Pages: strong enough for beta; some quotes and reading-order notes still need exact-source review.
- Import Dashboard: admin-only test path; no uploaded content should become public automatically.

## Content Audit Notes

- 66 book surveys: complete, concise, and KJV-oriented.
- Commentary recommendations: some resources are planned or staged; do not treat staged commentary as public reviewed content.
- Author pages: biographies and reading paths are useful; exact quotations should remain conservative until source verified.
- Library shelves: 128 verified resources; KJV/Textual Issues includes historical public-domain works and should keep discernment labels.
- Reading paths and study collections: useful for beta; expand only after workflow feedback.
- Amos workflow: ready as a teaching-prep test case; commentary text must remain verified only.
- Rights review: no David Cloud / Way of Life resources should be public without written permission.
- Doctrinal caution: keep “Use with discernment” and “Not all doctrine endorsed” labels where secondary differences may exist.

## What Testers Should Test

- Open the app on phone and desktop.
- Use Quick Jump for `John 3`, `John 3:16`, `Romans 8:28`, `Luke 24`, `Mark 1`, and `Amos 1`.
- Save and switch Marker A, Marker B, Marker C, and Marker D.
- Select John 3:16 and use each Study Drawer tab.
- Look up `believeth`, `loved`, and `death`.
- Add, edit, delete, and export notes.
- Highlight and bookmark verses, refresh, and confirm persistence.
- Open Book Introduction for Mark, Hebrews, Amos, and Revelation.
- Use Teaching Workspace export for John 3, Romans 8, Luke 24, and Amos 1.
- Open Library, search by author/title/category, read a book, listen, bookmark, and resume.
- Open Author Pages for Spurgeon, Ryle, Moody, Bounds, Bunyan, and Hudson Taylor.
- Try Study Playlists and confirm Stop works.
- Submit feedback using Settings, Library, or Teaching Workspace.

## What Not To Test Yet

- Strong’s numbers.
- Paid audio, AI narration, or licensed Bible audio.
- Payments, subscriptions, or marketplace behavior.
- Public personal uploads.
- Sermon slide builder, Proclaim export, PowerPoint, Keynote, or PDF exports.
- Full prayer management or full journal workflow.
- Automatic doctrinal generation.

## Feedback Questions

- What worked smoothly?
- What confused you?
- Was the Bible reader easy to use on your phone?
- Did the Study tab help you understand the selected verse?
- Did Book Introduction help you understand the book?
- Did the Teaching Workspace help you prepare a lesson?
- Was Library reading/listening comfortable?
- What felt unfinished or distracting?
- What should be the next most important feature?
- Did anything feel doctrinally unclear or poorly labeled?

## Browser And Device Test Matrix

- iPhone Safari, 390x844 or similar.
- iPhone Chrome, 390x844 or similar.
- Android Chrome, mid-size phone.
- iPad Safari, portrait and landscape.
- Desktop Chrome, 1440x900 or larger.
- Desktop Safari.
- Desktop Firefox.
- Signed-out local mode.
- Signed-in Supabase mode.
- Slow network or throttled mobile connection.

## Required Pre-Release Checks

- `npm run library:qa`
- `npm run validate:commentary`
- `npm run lint`
- `npm run build`
- Live mobile QA.
- Live desktop QA.
- No console errors on major screens.
- Confirm `.env.local` and secrets are not tracked.

