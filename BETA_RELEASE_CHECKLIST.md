# Father's Business Bible Study Beta Release Checklist

Use this checklist before inviting private beta testers. The purpose is to confirm the app is stable, honest about limitations, and useful in the first five minutes.

## Release Snapshot

- Production URL: https://bible-study-app-eight.vercel.app/
- Current focus: Bible-centered daily growth, KJV reading, passage study, prayer, journal, memory, library, commentary, teaching prep, and feedback.
- Storage mode: signed-out users save locally; signed-in Supabase sync is available when the project, schema, RLS, and environment variables are configured.
- Content posture: public-domain or reviewed resources only; staged, permission-needed, and unclear resources stay labeled and hidden from normal public use.

## Core Screens To Audit

- Daily Growth Dashboard
- Bible Reader
- Study Drawer
- Passage Guide
- Book Introduction / Bible Survey
- Prayer
- Journal
- Scripture Memory
- Library Home
- Library Reader and listening controls
- Commentary Library and Dashboard
- Teaching Workspace
- Study Playlists
- Settings and sync status
- Feedback form

## Daily Growth Dashboard

- Today's Bible reading appears and opens the Bible Reader.
- Proverb of the day appears and opens the correct Proverbs chapter.
- Prayer focus appears and opens Prayer.
- Journal entry action opens or creates today's Scripture Journal entry.
- Memory verse action reviews the selected verse and marks memory activity today.
- Continue Library Reading opens the current resource or Library.
- Study Playlist opens the Bible playlist/study workflow.
- Continue Sermon opens the current sermon draft.
- Continue Journal opens the Journal workflow.
- Smart Resume shows last Bible, Library, Commentary, Sermon, and Journal context.
- Ministry Dashboard shows sermons, lessons, study hours, books completed, memory verses, prayer entries, and reading streak.
- Progress cards show Bible reading, Prayer, Journal, and Memory status for today.
- Dashboard remains clean on phone and desktop.

## Data Safety

- Signed-out local storage fallback is clear.
- Signed-in sync status is clear.
- Bible notes, highlights, bookmarks, markers, favorites, recent passages, prayer entries, journal entries, memory, library progress, and playlists persist after refresh.
- Export JSON works from Settings.
- Prayer exports work.
- Journal exports work.
- Library notes export works.
- Teaching notes exports work.
- Sermon markdown export works.
- Preaching notes export works.
- Slide outline copy/download works.
- Feedback falls back to copy plus a pre-addressed ministry email if the private Supabase queue is unavailable.
- Feedback UI categories match the table constraint and insert-only RLS policy.
- A disposable live delivery probe succeeds and is removed before release.

## Quality Checks

- Quick Jump works for `John 3`, `John 3:16`, `Romans 8:28`, `Luke 24`, and `Amos 1`.
- Bible markers A-D save and restore after refresh.
- Study Drawer tabs are usable on mobile.
- Passage Guide loads for John 3, Romans 8, Luke 24, Amos 1, and Genesis 1.
- Journal creates, saves, opens, and exports an entry.
- Prayer creates, marks prayed, marks answered, and exports.
- Library search and shelves load without sluggishness.
- A library resource opens in the reader and saves progress.
- Listen controls start, stop, and do not require refresh.
- Commentary Dashboard loads and does not expose staged unreviewed content as public.
- Teaching Workspace exports John 3, Romans 8, Luke 24, and Amos 1 notes.
- Sermon Workspace loads John 3 sample sermon.
- Slide Builder opens quickly and can copy/download a slide outline.
- Settings accurately reports local or Supabase mode.
- Feedback form opens from beta notice, Settings, Library, and Teaching Workspace.

## Performance Checks

- Mobile initial load is acceptable.
- Daily screen feels smooth.
- Bible Reader loads quickly.
- Library with the current verified resource set loads and searches acceptably.
- Commentary Dashboard does not feel sluggish.
- Passage Guide opens without long waits.
- No console errors on major screens.
- No failed static assets on production.

## Required Commands

- `npm run validate:strongs`
- `npm run validate:commentary`
- `npm run library:qa`
- `npm run audit:public-access` while the production build is running
- `npm run lint`
- `npm run build`

## Required Browser QA

- Mobile viewport around 390x844.
- Desktop viewport around 1280x900 or larger.
- Signed-out local mode.
- Private admin deep links return signed-out visitors to the public Library without exposing internal labels.
- Brand-new signed-in non-admin account cannot reach private admin tools.
- Refresh persistence test.
- Export/download test.
- Production URL test after deploy.

## Release Decision

Ready for private beta when:

- Required commands pass.
- Mobile and desktop QA pass.
- Production deployment succeeds.
- No secrets or `.env.local` files are tracked.
- Known limitations are documented.
- Testers have clear instructions.
