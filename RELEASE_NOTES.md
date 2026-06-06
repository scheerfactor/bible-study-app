# Release Notes

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
