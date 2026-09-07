# Pre-class countdown — first slice

## Scope and audited baseline

Built on `origin/main` at `ddf12918`, in isolated branch `codex/pre-class-countdown`. The repository already has a sermon/lesson builder, series, Scripture resolution, slide authoring/export, presentation sessions, and a single-slide countdown. It lacked a linked multi-item pre-class sequence with paired questions/reveals and continuous background audio. No dedicated `Prepare to Teach` project model existed in this baseline. The sermon/lesson draft is the integration point; the new component accepts optional teaching-plan prayer/media/discussion fields for the related teaching workflow work.

No database schema, cloud sync, lesson-save behavior, existing presentation sessions, resource library, or billing was changed. Only an import and a builder button were added to the large existing page. New behavior lives in a separate component, scoped styles, and a pure timing/validation module.

## Reference video inspection

The requested `/mnt/data` location does not exist on this Mac. Inspected the matching local file in the August 3 King Ahaz task: `King Ahaz Bible Challenge Countdown - How Firm a Foundation.mp4`.

- Media inspection: exactly 300 seconds, 1280×720, H.264, 30 fps; stereo AAC at 44.1 kHz.
- Extracted a 12-frame contact sheet from the actual video. Dark olive/charcoal ancient-Judah background, gold headings, white text, consistent quiet composition, three choices labeled A/B/C, prominent upper-right timer continuing across slides.
- Companion production script confirms timings: 30-second welcome; four 25-second question / 25-second answer pairs; 35-second reflection; 25-second Scripture; 10-second ready-to-begin slide. Total 300 seconds. Frame samples show the anticipated paired question/answer rhythm.
- Answer screens show the answer plus explanatory text/reference; the Scripture remains distinct from explanation. Closing reflection shifts attention from recall to preparation.
- The actual video includes an audio track throughout. Silence analysis found brief 1.66-second gaps around 1:55 and 3:51, consistent with a roughly 116-second recording repeating; this is an inference, not a listening verification. Companion source notes identify a simple-piano “How Firm a Foundation” recording. No recording or video was imported into the app and no licensing claim from those notes was treated as clearance.
- Implemented the stable visual hierarchy and timing pattern using a CSS background, short fades, and paired phases. Reduced-motion preference disables animation. The historical background and recording were not copied.

## What works

Open **Sermons → create/open a sermon or lesson → Builder → Pre-class countdown**. The current draft can be used without saving the lesson first.

- Persistent master countdown, 1–60 whole minutes, independent of slide changes.
- Editable ordered sequence: welcome, multiple-choice question plus automatic answer reveal, exact KJV verse, series/passage context, phone reminder, announcement, optional prayer.
- Per-slide and answer timings, 5–120 seconds. Sequence repeats until the master time reaches zero. Final screen says “Let us begin”; music fades during the final four seconds and stops.
- Start, pause, resume, reset, audience preview, browser fullscreen, blackout with B, pause with Space, exit/pause with Escape or double-click.
- Large church-display typography, long-text fitting, contrast, reduced motion, and mobile editor layout.
- Local audio selection, volume control, looping audio without restart at slide boundaries. Audio needs a user start gesture. Decode/play errors are visible and stop the timer rather than pretending music is playing.
- Three built-in pacing presets, named browser-local templates, JSON backup export/import, per-lesson browser-local saves, invalid-input checks, storage errors, and conflicting-tab save protection.
- KJV verse-completion questions generated from up to two resolved lesson verses. Hymn title candidates use lesson theme keywords. Context uses series/title/passage. Optional explicit announcements and teaching-plan prayer/media/discussion fields are supported by the source adapter. Private study notes are not scanned or turned into announcements.
- Teacher review required before playback. All content edits, imports, and template applications clear review. Verse slides must match the app’s KJV resolver. Question explanations and doctrine require teacher review.
- Music requires a session-specific source/license/attribution note and recording-rights confirmation. Music files and approval are not saved in templates or JSON. No licensed media ships with the feature.

## Limits and next controlled slices

1. **Rehearse this local player on the actual church projector/audio system.** Browser tests do not certify physical equipment. The current display is this browser tab; move it to the projector before fullscreen. The device must stay awake.
2. **Service-time scheduling and handoff:** current duration starts on click, pause extends the real-world finish time, the last phase can be cut off at the deadline, and completion holds a welcome screen. Add a scheduled start/end time, protected closing segment, and explicit transition into the existing lesson deck.
3. **Unified teaching project integration:** merge with the separate teaching-plan slice and add an explicit shared project model. Current suggestions are deterministic verse-completion drafts, not semantic theological question generation. Existing discussion questions appear as teacher-only prompts to adapt; multiple-choice distractors are not invented from private answers. Default app records have no announcement feed, so announcements are entered manually.
4. **Media and portability:** add approved-library recording selection, persistent rights records, embedded attribution, audio playlists, cloud sync, and a self-contained presentation/video export. Current JSON backups contain content/timing only. Files and rights notes must be selected/entered each session. Template text, including dates and announcements, must be re-reviewed.
5. **Church production:** dedicated audience window, remote controller integration, scheduled warm-up/service/post-service sections, and wake-lock handling. Browser-local countdowns are not yet included in the app’s Ministry Backup; use Export backup here.

## Proclaim comparison

Proclaim’s official [Order of Service overview](https://support.proclaim.logos.com/hc/en-us/articles/19863521025293-Order-Of-Service-Overview) describes pre-service looping, a once-only warm-up, automatic transition to service at the scheduled time, and a post-service loop. Its [looping guide](https://support.proclaim.logos.com/hc/en-us/articles/34191535143821-How-to-Loop-Items) documents per-item timing.

| Capability | This slice | Proclaim comparison |
| --- | --- | --- |
| Repeating mixed pre-class slides | Yes | Similar basic loop behavior |
| Continuous countdown and audio | Yes, local browser | Suitable for a simple rehearsal; not full production parity |
| Bible multiple-choice / reveal | Paired timed phases, teacher reviewed | Purpose-built lesson integration here |
| Reusable layout/content | Local templates and JSON | Limited portability and team workflow |
| Service-time warm-up and deck handoff | Not yet | Proclaim schedules section transitions |
| External display / controller / media packaging | Not integrated in this slice | Existing app presentation systems still need connection |

This is a functioning first slice for a simple pre-class countdown, not a full Proclaim replacement.

## Verification

- Production webpack build and TypeScript passed.
- New component and timing module ESLint checks passed.
- Unit checks cover KJV-based suggestions, question/reveal boundaries, repeated-sequence boundaries, zero clamping, invalid timing/import data, and explicit announcements.
- Browser checks cover review gating, import/save/reopen, timed questions and reveal, pause/resume, completion, reset, fullscreen/exit, 390px mobile width, and no page errors.
- Additional browser checks exercise KJV mismatch rejection, music rights/playback/fade/stop, template review reset, invalid import preservation, and cross-tab save conflict handling.

Run `node scripts/test-pre-class-countdown.mjs`. Browser verification uses `COUNTDOWN_OUTPUT=/path/to/screenshots node scripts/check-countdown-browser.mjs` with the development app running at localhost:3108. Audio verification uses synthetic silence, not a third-party recording.
