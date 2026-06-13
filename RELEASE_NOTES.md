# Release Notes

## Private Beta Ready - Pre-Tester QA (June 9, 2026)

Status: Private Beta Ready for 3-5 invited testers.

Deployment recovery verified after clean Vercel CLI production deploy.

This pass focused on the live production app only. The goal was to confirm that a new tester can open the site, find the main study workflows, and move through Bible reading, study, library, prayer, journal, sermons, presentations, and feedback without hitting broken screens.

## Verified In Production

- Today welcome flow loads cleanly on desktop and 390px mobile.
- Study Amos opens the Amos 1-9 Study Path with reading, listening, sermon, journal, playlist, and export actions.
- Study John / Start Reading opens John 3 and John 3:16 correctly.
- Bible Reader shows Quick Navigation, Passage Guide, Study Workspace 2.0, Word Connection Mode, Webster/Strong's study signals, favorites, recent passages, and markers.
- Library search works by author/resource, including Spurgeon search and author matches.
- Library opens real resources with Read, Listen, Add to Playlist, reading/listening estimates, quality labels, related passages, related themes, and related books.
- Commentary Explorer opens with 4,099 public commentary entries and no console errors.
- Prayer, Journal, Notes, Sermons, Presentations, Settings, and Feedback all open without console errors.
- Feedback form includes beta categories for bug reports, suggestions, resource issues, commentary issues, audio issues, and study workflow issues.
- Mobile 390px QA passed for Library, Commentary, Prayer, Journal, Sermons, Presentations, and Today.
- No horizontal overflow was found in the tested desktop or mobile views.
- Local signed-out beta state survived refresh in the production browser.

## Current Content Totals Shown In App

- 924 public resource cards / grouped works.
- 1,079 verified public-domain files.
- 334 authors.
- 4,099 public commentary entries.
- 13 dictionary / Bible help resources.

## Beta Notes

- Browser/device speech varies. The Listen controls are visible and production handles unavailable playback with a clear message, but testers should confirm actual audio on their own Chrome, Safari, iPhone, and iPad devices.
- The in-app QA browser cannot complete native downloads, so testers should confirm export downloads in their normal browser.
- Signed-out data remains local to the device/browser. Supabase sync status is shown, but beta testers should still export important notes.
- TSK and Strong's are still reviewed starter datasets, not complete imports.

## Final Beta Depth And QA Sprint

This release focuses on private beta depth: stronger commentary coverage, more Bible tool starter data, clearer tester docs, and listening QA.

## Added

- Today dashboard includes Smart Resume cards.
- Today dashboard includes Ministry Dashboard statistics.
- Continue cards now include Bible, Proverb, Prayer, Journal, Memory, Library, Study Playlist, Sermon, and Journal resume.
- Bible Study Drawer has one-click workflow actions:
  - Add verse to Journal
  - Add verse to Prayer
  - Add verse to Memory
  - Add verse to Sermon
  - Add verse to Study Playlist
- Commentary tab can send a reviewed insight to Sermon, Notes, or Journal.
- Library reader can send selected text as a sermon quote or illustration idea.
- Teaching Workflow shows the path from Study Passage to Preach.
- Beta tester documentation now includes a simple start-here path, feedback form, known limitations, and release checklist.
- Matthew Henry public commentary coverage now finishes Isaiah 51-66 and continues through Jeremiah, Lamentations, and Ezekiel 1-27.
- JFB public commentary coverage now includes the remaining late New Testament epistles through Jude.
- TSK beta-depth reviewed samples were added for John 3, Romans 8, Amos 1, Daniel 7, and Revelation 13.
- Strong's starter entries were expanded for Romans 8 and Amos study words.
- Daniel 7 and Revelation 13 now have targeted background notes for beta study testing.
- Private beta docs were added:
  - PRIVATE_BETA_START_HERE.md
  - TESTER_TASKS.md

## Verified

- Library QA passes with 696 verified public resources.
- Commentary validation passes.
- Strong's validation passes.
- Lint passes.
- Production build passes.
- Production deployment is live at https://bible-study-app-eight.vercel.app/.

## Still Beta

- Signed-out data is local to the browser/device.
- Prayer, Journal, Library progress, playlists, memory, and sermons are local-first in beta.
- PowerPoint export is an MVP.
- TSK and Strong's are not full imports yet; they are reviewed starter/beta datasets.
- PDF, Keynote, Proclaim, licensed audio, AI tools, payments, public uploads, and church management are not ready yet.
