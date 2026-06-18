# Media Intake and Storage Plan

## Purpose

Prepare Father's Business Bible Study to support audio sermons, audiobooks, teaching series, Bible audio, and future video without publishing unclear or copyrighted media.

## Storage Strategy

- Store large media files in Cloudflare R2 or another dedicated object store.
- Keep app code, small metadata, rights records, and review status in Git/Supabase.
- Keep public, licensed, and personal-use media clearly separated.
- Do not place large audio or video files in the Vercel app bundle.

## Suggested R2 Paths

```text
audio/audiobooks/{author}/{work-slug}/
audio/sermons/{preacher-or-church}/{series-slug}/{sermon-slug}.mp3
audio/teaching/{series-slug}/{lesson-slug}.mp3
audio/bible/{translation-or-source}/{book}/{chapter}.mp3
video/sermons/{preacher-or-church}/{series-slug}/{sermon-slug}/
transcripts/sermons/{preacher-or-church}/{series-slug}/{sermon-slug}.md
transcripts/teaching/{series-slug}/{lesson-slug}.md
media/covers/{kind}/{slug}.webp
```

## Required Metadata

- title
- media type
- creator, preacher, narrator, or church
- Scripture passage
- series
- duration
- source URL
- rights status
- intake status
- storage bucket
- media storage path
- transcript path
- cover path
- visibility
- notes
- next action

## Rights Gates

No media becomes public until:

- written permission or public-domain evidence is documented
- speaker/preacher/narrator/church ownership is confirmed
- audiobook or TTS narration rights are reviewed
- transcript rights are reviewed
- public/private/personal-use visibility is set
- storage path and source metadata are complete

## Safe Beta Path

1. Track media records in the admin-only Media Intake tab.
2. Use device/browser TTS for books while audiobook rights are reviewed.
3. Test personal teaching audio privately with transcripts.
4. Add public sermon/audio only when ownership and permission are clear.
5. Add video later after storage, bandwidth, and player needs are proven.

## Pilot Order

1. **Audiobook structure pilot:** public-domain text such as Spurgeon's _All of Grace_ using private generated or human narration samples.
2. **Teaching audio pilot:** Hosea 4-9 Sunday School audio with transcript and teaching notes, kept private until publication intent is clear.
3. **Sermon audio pilot:** one church-owned sermon with speaker/church permission, transcript, and cover art.
4. **Bible audio planning:** keep browser/device speech active while researching licensed KJV audio or premium TTS terms.
5. **Video planning:** wait until audio workflow, transcripts, storage costs, and rights gates are working smoothly.

## Validation

Run before adding or publishing media records:

```bash
npm run validate:media
```

The validator checks required metadata, rights status, public-readiness gates, storage path prefixes, and placeholder paths.

## Do Not Add Yet

- copyrighted sermon audio without permission
- official audiobook copies without rights
- AI/TTS-generated public audio without narration rights review
- video hosting inside the Vercel bundle
- public member uploads
