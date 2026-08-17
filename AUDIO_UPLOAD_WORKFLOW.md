# Audio Upload Workflow

## Purpose

Make audiobooks, sermons, teaching audio, and future Bible audio easier to add without putting large files in the Vercel app bundle or publishing unclear rights.

## What We Are Doing Now

The first audiobook pilot, _All of Grace_, is using cleaned transcript samples because the source text came from an OCR scan. That cleanup work prepares a clean narration script. It is not the long-term upload workflow for every audiobook or sermon.

## Simple Workflow

For a localhost admin preview, set `NEXT_PUBLIC_ENABLE_LOCAL_ADMIN_PREVIEW=true` in the local environment and restart the app. Leave it unset or `false` for normal public-access testing.

1. Open Admin -> Library Acquisition Center -> Media Intake.
2. Use **New audio or sermon upload** to create a private review record.
3. Choose the media type:
   - Audiobook
   - Sermon Audio
   - Teaching Series
   - Bible Audio
   - Future video
4. Add title, creator/preacher/narrator, passage, series, duration, source, rights status, and visibility.
5. Choose the local MP3/M4B/MP4 file so the app can suggest the proper R2 path.
6. Create the review record. This does not publish anything.
7. Upload the audio file or folder to Cloudflare R2 at the suggested path.
8. Attach transcript, notes, chapter markers, and cover art if available.
9. Confirm rights and visibility.
10. Keep private until reviewed.
11. Mark approved only when public use is safe.

## What The App Does Today

The current admin form creates the media review record and suggests safe R2 paths. It can also request a short-lived R2 upload URL when the server has upload credentials configured.

Direct upload is intentionally limited:

- Server-side R2 credentials only.
- Admin upload token required.
- Public Domain or Approved rights status required.
- Permission Needed, Personal Use Only, and Do Not Import records can be reviewed but cannot be directly uploaded into the public bucket.

## Direct R2 Upload Setup

Set these only in Vercel/server environment variables. Do not expose them in client code.

```text
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_PUBLIC_CONTENT=fathers-business-bible-study-public
MEDIA_UPLOAD_ADMIN_TOKEN=
MEDIA_UPLOAD_MAX_BYTES=1073741824
```

Optional:

```text
R2_BUCKET_MEDIA=
```

If `R2_BUCKET_MEDIA` is set, direct media uploads use that bucket. Otherwise they use `R2_BUCKET_PUBLIC_CONTENT`.

The R2 bucket also needs CORS for browser uploads. Allow the production app origin and local development origin to `PUT` objects with `Content-Type`.

Suggested CORS intent:

```text
Allowed origins:
- https://bible-study-app-eight.vercel.app
- http://localhost:3052

Allowed methods:
- PUT

Allowed headers:
- Content-Type
```

Keep actual Cloudflare CORS settings as narrow as practical.

## Bulk Uploading Many Files

For dozens or hundreds of sermons/audiobooks, use the batch uploader instead of clicking one file at a time.

1. Copy the sample CSV:

```text
data/media/batches/media-upload-batch.sample.csv
```

2. Create a new batch CSV with one row per file.
3. Use absolute local file paths when the files are outside the repository.
4. Keep `rights_status` as `Public Domain` or `Approved` only. Permission-needed items should stay in review and should not be uploaded to the public bucket.
5. Run a dry run:

```text
npm run media:upload -- --csv=data/media/batches/my-sermon-batch.csv --dry-run
```

6. When the dry run is clean, upload with one of these methods.

If server-style R2 credentials are available in the shell:

```text
npm run media:upload -- --csv=data/media/batches/my-sermon-batch.csv --execute
```

If you are logged in to Cloudflare with Wrangler, use the easier local admin path:

```text
npm run media:upload -- --csv=data/media/batches/my-sermon-batch.csv --method=wrangler --execute
```

The batch uploader checks:

- local file exists
- storage path begins with `audio/` or `video/`
- extension is supported
- rights status is upload-safe
- duplicate storage paths are blocked
- content type is supported

## Review Record Fields

Every media record should include:

- Title
- Creator, preacher, teacher, or narrator
- Passage when applicable
- Series or collection
- Duration
- Source URL or ownership notes
- Rights status
- Intake status
- Visibility
- Storage bucket
- Media path
- Transcript path
- Cover path
- Notes
- Next action

## Old Manual Workflow

This still works when needed:

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

The app now has a signed R2 upload endpoint for admin browser uploads, but production still needs the R2 write environment variables and bucket CORS before that button can upload directly from the browser. Until then, the Wrangler batch uploader is the preferred path for larger sermon, audiobook, and video batches.
