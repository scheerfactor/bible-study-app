# Bible Audio Marker Review

This report tracks Bible audio chapter markers before chapter-level release.

## Summary

- Bible audio files with markers: 1
- Total chapter markers: 14
- Estimated markers: 14
- Verified markers: 0
- Markers requiring manual review before public release: 14
- Public visibility violations: 0

## Release Rule

Do not mark Bible audio public until every chapter marker for that file is manually checked and changed from `Estimated` to `Verified`.

## Manual Review Instructions

For each boundary:

1. Open the source or R2 audio file.
2. Jump to 10 seconds before the listed chapter start.
3. Confirm the prior chapter ends cleanly.
4. Confirm the target chapter heading or first words begin at the listed start.
5. Adjust the marker if needed.
6. Change the marker status to `Verified` only after checking it by ear.
7. If a corrected start or end changes a shared boundary, use `--sync-adjacent` so both chapters remain contiguous. The command refuses to move a neighboring marker that is already verified.

Example:

```bash
npm run media:update-marker -- --manifest data/media/manifests/media-intake-candidates.json --book Genesis --chapter 2 --start 399 --end 661 --status Verified --method "Manually verified by ear on YYYY-MM-DD." --sync-adjacent
```

## Files

### Genesis 1-14

- Work: Bible (KJV), Complete
- Creator: King James Version / Michael Armenta
- Duration: 1:03:54
- Visibility: Public after review
- Intake status: Approved For Public Use
- Source: https://librivox.org/bible-complete-king-james-version/
- Playback file: https://www.archive.org/download/bible_kjv_complete_2001_librivox/bible_001_kjv_128kb.mp3

| Done | Chapter | Start | End | Status | Open review point | Review checkpoint |
| --- | --- | ---: | ---: | --- | --- | --- |
| [ ] | Genesis 1 | 0:00 | 6:39 | Estimated | [Open at 0:00](https://www.archive.org/download/bible_kjv_complete_2001_librivox/bible_001_kjv_128kb.mp3#t=0) | Confirm file begins with this chapter/range opening. |
| [ ] | Genesis 2 | 6:39 | 11:01 | Estimated | [Open at 6:29](https://www.archive.org/download/bible_kjv_complete_2001_librivox/bible_001_kjv_128kb.mp3#t=389) | Listen from 6:29 and confirm boundary. |
| [ ] | Genesis 3 | 11:01 | 16:07 | Estimated | [Open at 10:51](https://www.archive.org/download/bible_kjv_complete_2001_librivox/bible_001_kjv_128kb.mp3#t=651) | Listen from 10:51 and confirm boundary. |
| [ ] | Genesis 4 | 16:07 | 21:04 | Estimated | [Open at 15:57](https://www.archive.org/download/bible_kjv_complete_2001_librivox/bible_001_kjv_128kb.mp3#t=957) | Listen from 15:57 and confirm boundary. |
| [ ] | Genesis 5 | 21:04 | 24:54 | Estimated | [Open at 20:54](https://www.archive.org/download/bible_kjv_complete_2001_librivox/bible_001_kjv_128kb.mp3#t=1254) | Listen from 20:54 and confirm boundary. |
| [ ] | Genesis 6 | 24:54 | 29:16 | Estimated | [Open at 24:44](https://www.archive.org/download/bible_kjv_complete_2001_librivox/bible_001_kjv_128kb.mp3#t=1484) | Listen from 24:44 and confirm boundary. |
| [ ] | Genesis 7 | 29:16 | 33:32 | Estimated | [Open at 29:06](https://www.archive.org/download/bible_kjv_complete_2001_librivox/bible_001_kjv_128kb.mp3#t=1746) | Listen from 29:06 and confirm boundary. |
| [ ] | Genesis 8 | 33:32 | 37:47 | Estimated | [Open at 33:22](https://www.archive.org/download/bible_kjv_complete_2001_librivox/bible_001_kjv_128kb.mp3#t=2002) | Listen from 33:22 and confirm boundary. |
| [ ] | Genesis 9 | 37:47 | 42:39 | Estimated | [Open at 37:37](https://www.archive.org/download/bible_kjv_complete_2001_librivox/bible_001_kjv_128kb.mp3#t=2257) | Listen from 37:37 and confirm boundary. |
| [ ] | Genesis 10 | 42:39 | 46:51 | Estimated | [Open at 42:29](https://www.archive.org/download/bible_kjv_complete_2001_librivox/bible_001_kjv_128kb.mp3#t=2549) | Listen from 42:29 and confirm boundary. |
| [ ] | Genesis 11 | 46:51 | 51:33 | Estimated | [Open at 46:41](https://www.archive.org/download/bible_kjv_complete_2001_librivox/bible_001_kjv_128kb.mp3#t=2801) | Listen from 46:41 and confirm boundary. |
| [ ] | Genesis 12 | 51:33 | 55:41 | Estimated | [Open at 51:23](https://www.archive.org/download/bible_kjv_complete_2001_librivox/bible_001_kjv_128kb.mp3#t=3083) | Listen from 51:23 and confirm boundary. |
| [ ] | Genesis 13 | 55:41 | 58:57 | Estimated | [Open at 55:31](https://www.archive.org/download/bible_kjv_complete_2001_librivox/bible_001_kjv_128kb.mp3#t=3331) | Listen from 55:31 and confirm boundary. |
| [ ] | Genesis 14 | 58:57 | 1:03:54 | Estimated | [Open at 58:47](https://www.archive.org/download/bible_kjv_complete_2001_librivox/bible_001_kjv_128kb.mp3#t=3527) | Listen from 58:47 and confirm boundary. |

Marker notes:

- Genesis 1: 0:00-6:39 (Estimated) — Candidate file start preserves the LibriVox introduction; the Genesis 1 announcement was independently detected at 30.2 seconds. Manual by-ear review is still required.
- Genesis 2: 6:39-11:01 (Estimated) — Candidate Chapter 2 announcement boundary corroborated by the exact KJV transition and independent tiny.en/base.en transcription passes on 2026-08-29. Manual by-ear review is still required.
- Genesis 3: 11:01-16:07 (Estimated) — Candidate Chapter 3 announcement boundary corroborated by the exact KJV transition and independent tiny.en/base.en transcription passes on 2026-08-29. Manual by-ear review is still required.
- Genesis 4: 16:07-21:04 (Estimated) — Candidate Chapter 4 announcement boundary corroborated by the exact KJV transition and independent tiny.en/base.en transcription passes on 2026-08-29. Manual by-ear review is still required.
- Genesis 5: 21:04-24:54 (Estimated) — Candidate Chapter 5 announcement boundary corroborated by the exact KJV transition and independent tiny.en/base.en transcription passes on 2026-08-29. Manual by-ear review is still required.
- Genesis 6: 24:54-29:16 (Estimated) — Candidate Chapter 6 announcement boundary corroborated by the exact KJV transition and independent tiny.en/base.en transcription passes on 2026-08-29. Manual by-ear review is still required.
- Genesis 7: 29:16-33:32 (Estimated) — Candidate Chapter 7 announcement boundary corroborated by the exact KJV transition and independent tiny.en/base.en transcription passes on 2026-08-29. Manual by-ear review is still required.
- Genesis 8: 33:32-37:47 (Estimated) — Candidate Chapter 8 announcement boundary corroborated by the exact KJV transition and independent tiny.en/base.en transcription passes on 2026-08-29. Manual by-ear review is still required.
- Genesis 9: 37:47-42:39 (Estimated) — Candidate Chapter 9 announcement boundary corroborated by the exact KJV transition and independent tiny.en/base.en transcription passes on 2026-08-29. Manual by-ear review is still required.
- Genesis 10: 42:39-46:51 (Estimated) — Candidate Chapter 10 announcement boundary corroborated by the exact KJV transition and independent tiny.en/base.en transcription passes on 2026-08-29. Manual by-ear review is still required.
- Genesis 11: 46:51-51:33 (Estimated) — Candidate Chapter 11 announcement boundary corroborated by the exact KJV transition and independent tiny.en/base.en transcription passes on 2026-08-29. Manual by-ear review is still required.
- Genesis 12: 51:33-55:41 (Estimated) — Candidate Chapter 12 announcement boundary corroborated by the exact KJV transition and independent tiny.en/base.en transcription passes on 2026-08-29. Manual by-ear review is still required.
- Genesis 13: 55:41-58:57 (Estimated) — Candidate Chapter 13 announcement boundary corroborated by the exact KJV transition and independent tiny.en/base.en transcription passes on 2026-08-29. Manual by-ear review is still required.
- Genesis 14: 58:57-1:03:54 (Estimated) — Candidate Genesis 14 first-verse boundary corroborated by the exact KJV transition and independent tiny.en/base.en transcription passes; no spoken chapter heading was detected. Manual by-ear review is still required.

## Next Action

- Review 14 estimated chapter markers by ear before public release.
- Keep the source URL and rights evidence attached to every audio file.
- Keep LibriVox/public-domain attribution visible in admin metadata before any public display.

