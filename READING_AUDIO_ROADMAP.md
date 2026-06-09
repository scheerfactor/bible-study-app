# Reading and Audio Roadmap

## Current Beta Strategy

The app uses browser/device speech synthesis first. This keeps beta testing simple, avoids paid API calls, and lets users read and listen with the same public-domain text already available in the Library.

## Reader 2.0 Goals

- Clean typography with light, sepia, and dark themes.
- Estimated reading time and listening time.
- Continue reading and continue listening.
- Paragraph-based table of contents for long resources.
- Bookmarks, reader notes, journal notes, quotes, illustrations, and sermon notes without leaving the reader.
- Reading goals and completion tracking stored locally first, with Supabase sync planned later.

## Follow-Along Reading

Current beta support:

- Paragraph highlighting while listening.
- Auto-scroll to the active paragraph.
- Jump-to-part controls for long resources.

Future support:

- Sentence tracking after text/audio alignment is reliable.
- Quote capture from the active sentence.
- Audio-to-text sync for imported audiobooks.

## OpenAI TTS

Potential use:

- Premium public-domain audiobook generation.
- Scripture-safe narration profiles.
- Sermon and lesson preparation audio.

Requirements before implementation:

- Server-side API key storage only.
- Cost controls and usage limits.
- Rights review for every generated audio resource.
- Caching generated audio files in Supabase Storage or Cloudflare R2.
- Clear distinction between generated narration and licensed/human narration.

## ElevenLabs

Potential use:

- Premium long-form audiobook voices.
- Pastor, teacher, devotional, and audiobook voice profiles.

Requirements before implementation:

- Verify current commercial terms.
- Verify voice licensing and cloning restrictions.
- Store generated files with rights metadata.
- Avoid generating copyrighted modern resources without written permission.

## Human Narration

Best fit:

- KJV Bible audio if licensed or recorded specifically for the app.
- Key public-domain books with ministry-safe human narration.
- Sermon and teaching resource audio where permission is clear.

Requirements:

- Narrator agreement.
- Audio rights metadata.
- Chapter markers.
- Text sync status.
- Storage and bandwidth plan.

## Audiobook Imports

Future import model:

- One public work card with Read and Listen options.
- Audio metadata: narrator, duration, source, rights status, audio path, text sync available.
- Personal-use-only uploads for user-owned audio.
- No public copyrighted audiobook imports without written permission.

## Storage Plan

- Keep metadata in GitHub/Vercel and Supabase Postgres.
- Store large audio files in Supabase Storage or Cloudflare R2.
- Cache text chunks and audio manifests.
- Do not load full large books or audio manifests into the browser when chunking is practical.

## Beta Limitation

Browser voices vary by device and browser. Apple voices may appear only in Safari or in browsers that expose installed system voices. The app should always fall back gracefully when a saved voice is unavailable.
