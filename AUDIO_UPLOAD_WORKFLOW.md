# Audio Upload Workflow

## Purpose

Make audiobooks, sermons, teaching audio, and future Bible audio easier to add without putting large files in the Vercel app bundle or publishing unclear rights.

## What We Are Doing Now

The first audiobook pilot, _All of Grace_, is using cleaned transcript samples because the source text came from an OCR scan. That cleanup work prepares a clean narration script. It is not the long-term upload workflow for every audiobook or sermon.

## Simple Workflow

1. Create or choose a Media Intake record.
2. Confirm the resource type:
   - Audiobook
   - Sermon Audio
   - Teaching Series
   - Bible Audio
   - Future video
3. Upload the audio file or folder to Cloudflare R2.
4. Paste the R2 path into the Media Intake record.
5. Attach transcript, notes, chapter markers, and cover art if available.
6. Confirm rights and visibility.
7. Keep private until reviewed.
8. Mark approved only when public use is safe.

## Recommended File Patterns

```text
audio/audiobooks/{author}/{work-slug}/{segment-number}-{segment-slug}.mp3
audio/sermons/{church-or-preacher}/{series-slug}/{sermon-slug}.mp3
audio/teaching/{series-slug}/{lesson-slug}.mp3
audio/bible/kjv/{book}/{chapter}.mp3
transcripts/audiobooks/{author}/{work-slug}/{segment-number}-{segment-slug}.md
transcripts/sermons/{church-or-preacher}/{series-slug}/{sermon-slug}.md
media/covers/audiobooks/{work-slug}.webp
media/covers/sermons/{series-slug}.webp
```

## Audiobooks

Use this path when a full book has audio:

- One public Library card for the book.
- Read and Listen buttons on the same resource.
- Audio files stored in R2.
- Transcript or chapter list attached when available.
- Narrator and rights metadata recorded.

If the book text is rough OCR, clean the transcript before narration. If the text is already clean, skip manual transcript cleanup and upload the audio directly.

## Sermons and Teaching

Use this path for church-owned sermons or Sunday School lessons:

- Record one MP3.
- Add title, preacher/teacher, passage, date, series, and topic.
- Attach sermon notes or transcript later.
- Confirm church/preacher permission before public release.
- Keep private by default until approved.

## Bible Audio

Do not upload public KJV Bible audio until written license terms are approved. Browser/device speech stays the default for now.

## Future Improvement

The next technical improvement is a signed R2 upload endpoint so an admin can upload directly inside the app instead of uploading in Cloudflare and pasting the path manually.
