# Audiobook Import Plan

## Goal

Prepare the app to support audiobook imports without duplicating book records or publishing audio without rights.

## Supported Formats

### MP3

- Good first format for simple chapter files.
- Store one file per chapter or section when possible.
- Track duration, narrator, bitrate, source, and rights status.

### M4B

- Better for complete audiobooks with chapter markers.
- Requires chapter marker extraction.
- Store original file plus parsed chapter metadata.
- Keep M4B support behind admin review until extraction is reliable.

## Chapter Markers

Each audiobook should store:

- resource slug
- chapter title
- chapter number
- start time
- end time
- duration
- optional linked text paragraph range

## Metadata

Required fields:

- title
- author
- narrator
- source URL
- audio source
- rights status
- commercial-use status
- duration
- file format
- file size
- checksum
- cover image path
- text version link
- text sync available true/false

## Cover Art

- Use public-domain or permission-cleared covers only.
- If no rights-safe cover exists, use generated cover metadata.
- Do not use modern copyrighted publisher covers without permission.

## Narration

Accepted narration sources:

- human narration owned by the ministry
- public-domain audio
- permission-cleared audio
- user-private personal audio
- future premium TTS generated audio after rights review

Do not publicly ship modern copyrighted audiobook audio without written permission.

## Import Workflow

1. Add audiobook metadata.
2. Verify rights.
3. Upload audio to object storage.
4. Calculate file size and checksum.
5. Extract or create chapter markers.
6. Link audiobook to existing book resource.
7. Add Listen button to the existing resource card.
8. Keep one public work card with Read, Listen, and Add to Playlist buttons.

## Storage Plan

- Keep audio files in Supabase Storage or Cloudflare R2.
- Keep searchable metadata in Supabase Postgres.
- Cache chapter lists and continue-listening progress.
- Do not load full audio libraries into the browser at once.

## Beta Scope

- Browser/device text-to-speech remains the default.
- Imported audiobooks are admin-only until rights, storage, and playback QA are complete.
- Personal uploads remain private to the signed-in user.

