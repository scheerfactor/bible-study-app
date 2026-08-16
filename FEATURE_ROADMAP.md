# Feature Roadmap

This roadmap keeps Father's Business Bible Study Bible-centered, fast, affordable, and useful in the first five minutes. The product should serve new believers, Sunday school teachers, pastors, and serious Bible students without becoming heavy Bible software.

## Product Philosophy

- Keep the Bible text central.
- Make one-tap actions obvious.
- Prefer guided workflows over crowded research panels.
- Add depth only when it helps reading, study, teaching, listening, prayer, or journaling.
- Avoid feature sprawl, social clutter, and marketplace pressure.
- Build local-first where appropriate, then sync when the workflow is proven.

## Lessons from SwordSearcher, theWord, and Sacra Script

Father's Business Bible Study should combine:

- Logos depth: rich study data, passage workflow, teaching help, and library structure.
- SwordSearcher speed: fast KJV navigation, verse-centered search, included resources, and no subscription pressure.
- theWord affordability and modularity: free/affordable resource thinking with a flexible library foundation.
- Bible.is listening workflow: Bible audio, chapter/range listening, and follow-along reading.
- YouVersion simplicity: useful daily reading and habits without a steep learning curve.
- Sacra Script-style Bible connections: story flow, people, places, events, historical setting, and guided biblical literacy.

The app must still stay:

- Bible-centered
- Fast
- Simple
- KJV-focused
- Useful in five minutes
- Curated instead of bloated

Practical design meaning:

- Prefer one clear Bible reader over many research windows.
- Prefer curated resources over a confusing module marketplace.
- Prefer guided Bible connections over course-heavy screens.
- Prefer fast verse-centered search over academic search setup.
- Prefer public-domain and rights-reviewed content over rapid library expansion.
- Prefer affordable, low-pressure growth over subscriptions or marketplace pressure during beta.

## Must-Have Feature List

### Bible Reading

- Fast book/chapter/verse navigation
- Previous/next chapter
- Two-column Bible layout option
- Large readable text
- Dark/sepia/light themes
- Recent passages
- Pinned passages
- Bible markers/ribbons

### Study Tools

- Webster's 1828
- TSK cross references
- Occurrence explorer
- People mentioned
- Places mentioned
- Events and story flow
- Types of Christ
- Prophecy/fulfillment
- Commentary
- Notes/highlights/bookmarks

### Teaching Tools

- Chapter analysis
- Key words
- Key verses
- Teaching view
- Export lesson notes
- Copy verses cleanly

### Listening

- Bible chapter listen mode
- Book/chapter/range playlists
- Repeat chapter/book
- Sleep timer
- Speed control
- Follow-along highlighting
- Future licensed KJV audio support

### Library

- Curated public-domain library
- Rights dashboard
- Warnings for doctrinal concerns
- Trusted categories
- Continue reading
- Completed books
- Read again

### Prayer

- Church prayer list
- Missionaries
- Ministries
- Birthdays/anniversaries
- Unreached people group placeholder
- Prayer rotation
- Answered prayer tracking

### Journal

- Scripture journal
- Define words
- Dissect the verse
- Rewrite in own words
- Application
- Prayer
- Handwritten/iPad support placeholder

## Now: Private Beta Stability

These are current or near-current beta priorities. Finish these before expanding the app into a larger ecosystem.

1. Client performance and data delivery
   - Reduce the current `/` first-load JavaScript from 20.13 MB gzip in staged milestones: below 5 MB, then 1.5 MB, then a public target below 750 KB.
   - Remove commentary, TSK, library, media, admin, sermon, and presentation datasets from the initial reader chunk.
   - Split the 50,796-line client page by feature and load advanced workspaces only when opened.
   - Add a bundle-size regression check before public beta.
   - See [e-Sword And SwordSearcher Benchmark](./ESWORD_SWORDSEARCHER_BENCHMARK.md).

2. Bible reader navigation
   - Keep quick navigation always available in Bible Reader.
   - Preserve recent and pinned passages locally.
   - Add navigation back/forward history and non-destructive verse previews.

3. Quick Word Lens, study drawer, and full study reliability
   - Show Webster, mapped Strong's data, occurrence counts, and first use together when a KJV word is tapped.
   - Keep Study tab first.
   - Keep selected verse, key words, cross references, notes, and commentary visible without clutter.
   - Make sure notes/highlights/bookmarks persist signed-in and signed-out.

4. Search and occurrence explorer
   - Keep Bible search fast on mobile.
   - Replace repeated full-array scanning with a precomputed KJV search index.
   - Add phrase, all/any words, KJV word forms, fuzzy spelling, proximity, Strong's number, and range scopes.
   - Keep occurrence counts simple: chapter, book, Bible.
   - Learn from SwordSearcher: verse-centered search should not interrupt the study flow.

5. Verse Guide and Study Margin
   - Build a verse-to-resource index across TSK, commentary, books, study tools, and personal writing.
   - Show compact optional resource counts beside the passage without covering the KJV text.
   - Preview results before changing the current reader position.

6. Webster's 1828
   - Continue full import validation.
   - Normalize common KJV forms.
   - Add dictionary search and fast lookup from Bible words.

7. Library reader polish
   - Keep continue reading, completed books, read again, and listening controls stable.
   - Preserve public-domain rights metadata.
   - Learn from theWord: resources can be flexible and affordable, but must be curated and simple to use.

8. Beta protection
   - Keep Export My Notes.
   - Keep known limitations clear.
   - Avoid adding paid features or AI during this stage.

## Next: Guided Study and Teaching

Build these after the beta reader, notes, search, dictionary, and library workflows are dependable.

1. Two-column Bible layout
   - Desktop/tablet option for Bible plus notes, cross references, or commentary.
   - Mobile remains single-column with drawer.

2. Bible markers/ribbons
   - Simple "mark this place" feature like a physical Bible ribbon.
   - Include a small ribbons list near Recent and Favorites.

3. TSK cross-reference implementation
   - Complete rights review.
   - Import verified sample.
   - Import full dataset only if rights and data quality are acceptable.

4. Commentary collection 1
   - Choose one verified public-domain commentary collection.
   - Import with source metadata.
   - Show commentary inline in Full Study without crowding the reader.

5. Teaching export
   - Export selected chapter notes, key verses, key words, cross references, and personal notes.
   - Start with Markdown or plain text.
   - Later consider PDF and slide outline.

6. Guided Bible connections
   - Expand people, places, events, themes, types of Christ, and prophecy connections chapter by chapter.
   - Learn from Sacra Script: help users connect story, setting, and Scripture without making the app course-heavy.
   - Keep entries manually reviewed and doctrinally governed.

7. Prayer module v1
   - Today prayer card.
   - Church list, missionaries, ministries.
   - Prayer rotation and answered prayer.
   - Keep setup minimal.

8. Journal module v1
   - Scripture journal tied to selected verse.
   - Prompts: define words, dissect the verse, rewrite in own words, application, prayer.
   - Export journal entries.

## Later: Deeper Tools

These should wait until the core app is truly useful and stable.

1. Strong's and original-language tools
   - Add only with licensed/verified data.
   - Explain in plain English.
   - Avoid scholar-only complexity.

2. Licensed KJV audio
   - Keep browser speech synthesis until licensed audio is ready.
   - Support chapter, range, playlist, repeat, speed, and sleep timer first.

3. Sermon and lesson builder
   - Only after Teaching View and export are proven.
   - Start with lesson outline export before slides or media.

4. Full library expansion
   - Import only reviewed public-domain or properly licensed content.
   - Add doctrinal warnings and rights dashboard first.
   - Keep theWord-style modularity as a data structure, not a confusing user-facing module marketplace.

5. iPad handwriting support
   - Placeholder now.
   - Later add Apple Pencil-friendly journal/markup if it supports real workflows.

6. Social or group features
   - Avoid until core reading, study, prayer, and journaling are strong.
   - If added, keep it church/group focused, not social-feed focused.

7. Paid plans or marketplace
   - Not during beta.
   - Only consider after users clearly value the free/core experience.

## Success Measures

- A new user can open the app and know what to do in five minutes.
- A teacher can prepare a simple lesson from one chapter without opening five tools.
- A reader can quickly return to recent and pinned passages.
- A user can read, listen, study, make notes, and export data without fear of loss.
- The app feels faster and calmer than large Bible software.
