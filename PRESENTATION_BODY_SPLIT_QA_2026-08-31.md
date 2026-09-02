# Lossless teaching and quotation slide splitting — 2026-08-31

## Change

Long non-Scripture presentation slides now have a **Split Long Text** action in the existing slide editor. It prefers sentence boundaries, falls back to word boundaries for long sentences, and creates readable parts using the same size targets as Scripture splitting.

Each generated part preserves the original slide type, subtitle/attribution, speaker/source notes, background, theme settings, layout, and display settings. The original slide keeps its ID; additional parts receive new IDs. Any presentation group containing the original slide expands in place to contain every generated part, preserving service order.

The PowerPoint preflight warning now directs users to the appropriate one-click action for Scripture versus teaching/quotation text. No text is summarized or doctrinally rewritten. No content, permissions, dependencies, or deployment configuration changed.

## Passed

- `node scripts/test-presentation-export-privacy.mjs`: sentence and word-boundary splitting; short-text no-op; normalized text/punctuation equality; 1,400/1,401 export boundary; no blocked file output; actual PPTX ZIP/XML privacy, KJV, quotation, author, source, and final-word checks.
- `npm run lint`: exit 0 (existing large-file Babel informational notice only).
- `npm run build -- --webpack`: exit 0; TypeScript and all 28 static pages passed.
- Production browser journey: 1,502-character synthetic quotation blocked export, then split into four ordered parts. All 18 numbered sentences remained present in order. `[Sources]`, author, and rights fixture notes appeared on all four parts. The `Opening` group expanded from one to four slides. Warning cleared and slides-only export completed.
- 390×844 phone viewport: Split Long Text remained visible and document width matched viewport width (no horizontal page overflow).
- Disposable test presentation was not saved; test tab closed, viewport reset, local server stopped.

## Remaining gates / next slice

Physical iPad/Safari, projector/PowerPoint display, and authenticated cross-device control remain unverified. The exporter still uses presentation motifs rather than embedding the selected local media background as a full PowerPoint image. That background-fidelity gap is now the next highest-value presentation improvement.
