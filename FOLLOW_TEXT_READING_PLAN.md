# Follow Text Reading Plan

## Goal

Make Bible, commentary, and library listening feel natural by keeping the visible text synchronized with the spoken audio while allowing quick capture of quotes, sermon notes, and journal thoughts.

## Phase 1: Browser Voice Follow-Along

- Split reader text into stable paragraphs.
- Store paragraph IDs by resource slug, chapter, and paragraph index.
- Highlight the current paragraph during browser speech playback.
- Auto-scroll the current paragraph into view when listening.
- Save last listening position locally.
- Keep Stop, Pause, Resume, speed, voice, and sleep timer consistent across Bible, commentary, and books.

## Phase 2: Sentence Tracking Foundation

- Split each paragraph into sentence spans.
- Store sentence index inside the current paragraph.
- Highlight the active sentence when timing data is available.
- Fall back to paragraph highlighting when the browser voice does not expose timing.
- Avoid forcing exact timing if it causes jumpy reading.

## Phase 3: Quote Capture

- Add "Add Quote" while reading or listening.
- Capture:
  - selected text or current sentence
  - resource title
  - author
  - location
  - timestamp or paragraph index
  - rights/source note
- Allow sending quote to Sermon Builder.
- Mark OCR-sourced quotes as "review before quoting" when needed.

## Phase 4: Sermon Note Capture

- Add "Add Sermon Note" while listening.
- Capture:
  - current passage or resource
  - current paragraph/sentence
  - note text
  - sermon target
  - optional section: introduction, point, illustration, application, conclusion
- Save locally first, then prepare Supabase sync later.

## Phase 5: Journal Capture

- Add "Add Journal Note" while listening.
- Capture:
  - verse/resource location
  - selected sentence or paragraph
  - reflection
  - application
  - prayer thought
- Link journal entry back to the Bible passage, commentary, or book.

## Phase 6: Premium Audio Sync

- When premium generated audio is added, create timing metadata:
  - resource slug
  - chapter
  - paragraph index
  - sentence index
  - start time
  - end time
- Store timing metadata separately from text.
- Keep human narration timing optional because alignment can be expensive.

## Safety Rules

- Do not require paid audio for follow-along reading.
- Do not lose the user's place when audio stops.
- Do not auto-generate or publish copyrighted audio.
- Keep Bible text primary and easy to return to.

