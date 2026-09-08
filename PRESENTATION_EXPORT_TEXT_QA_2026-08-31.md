# PowerPoint text-loss protection — 2026-08-31

## Change

The shared exporter previously silently sliced body/Scripture text at 1,400 characters. It now normalizes whitespace without truncation and rejects oversized decks before creating a file. Both presentation and sermon handlers report the affected slide numbers before error/fallback handling.

The presentation manager and deck export panels list affected titles, slide numbers, and character counts; disable both PowerPoint modes; and offer Review slide buttons that select the slide, open the deck editor, scroll, and focus it. Existing Scripture splitting remains available. No automatic rewriting, content imports, permissions changes, or deployment.

The 1,400-character threshold retains the previous export ceiling as an explicit safety limit, not a promise of legibility or layout fidelity. Titles/subtitles, PDF print layout, and background-image export are outside this change.

## Passed

- `node scripts/test-presentation-export-privacy.mjs`: actual generated ZIP/XML verified for accepted 1,400-character body including final words; 1,401-character body blocked; multiple offenders; empty input; Scripture/body precedence; input unchanged; no file written for blocked exports in either mode. Existing KJV, quotation, author, source-note, and private-metadata tests pass. Both handlers preflight before fallback handling.
- `npm run lint`: exit 0 (existing large-file Babel informational notice).
- `npm run build -- --webpack`: exit 0, TypeScript and all 28 static pages passed.
- Production server on port 3031: empty draft disables exports; 1,599-character teaching text disables both modes and displays counts in manager and deck; Review slide returns to the editor with focus; manual split clears warning and slides-only export succeeds.
- 390×844 phone viewport: warning and buttons wrap; document width equals viewport width, no horizontal page overflow. Warning visually inspected.
- 768×1024 tablet viewport: 1,703-character synthetic Scripture fixture (John 3:16 KJV repeated 12 times) blocks export. Existing Split Long Passage creates four Scripture slides; all 12 complete verse instances verified in editor DOM; presenter export succeeds.
- Test draft was not saved; test tab closed, viewport reset, temporary server stopped.

## Remaining gates / next slice

Physical iPad/Safari, projector/PowerPoint display, and authenticated cross-device control have not been verified here. This local preview has no shared remote backend configured. Source checkout and its AGENTS.md were not edited. No new resource rights were assumed.

Next useful slice: lossless splitting for long teaching/quotation slides, retaining source notes and presentation groups, so users do not have to divide those slides manually. Separately, exported background fidelity and dense-slide typography still require attention before calling presentation export launch-ready.
