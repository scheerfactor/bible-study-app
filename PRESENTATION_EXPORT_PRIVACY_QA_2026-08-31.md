# Presentation PowerPoint privacy — August 31, 2026

## Delivered

Presentation Workspace now offers two clearly named PowerPoint copies in both Manager and Slide Deck views:

- **Slides-only PowerPoint:** omits speaker notes and uses a generic document subject instead of private presentation notes. The filename ends in `-slides-only.pptx`.
- **Presenter PowerPoint — includes notes:** preserves speaker notes, including source/rights records, and presentation-note metadata. The filename ends in `-presenter-with-notes.pptx`.

The presentation export handler defaults to slides-only. Exporting never deletes notes from the saved deck. Visible slide text and author/source subtitles are preserved. Users must still review visible content and applicable rights before sharing; stripping notes is not a general privacy or redistribution guarantee.

A failed presentation PowerPoint export no longer silently downloads a Markdown plan containing private notes. Markdown remains an explicit separate action with a privacy warning. The separate Sermons export workflow retains its existing behavior; this slice changes Presentation Workspace only.

## Verification

- `node scripts/test-presentation-export-privacy.mjs` passed. It extracts the actual exporter and its helpers from `page.tsx`, invokes the existing PowerPoint library, and inspects all XML parts of generated PowerPoint ZIP files.
- Synthetic speaker-note and document-metadata sentinels are absent from the slides-only file and present in the presenter copy. Neither copy places those sentinels on visible slides.
- The John 3:16 KJV fixture, quotation fixture, and author/source subtitle are unchanged in both exports. Presenter source records remain intact, and the input slide objects are not mutated.
- Unknown export modes fail closed. The presentation failure handler has no automatic private-file download.
- `npm run lint` and `npm run build -- --webpack` passed, including TypeScript.
- Production browser on port 3031: empty decks disable export; each button completes its appropriate export and reports the correct privacy status; original speaker notes remain in the editor.
- Phone viewport 390 × 844: no document horizontal overflow; both export choices and privacy warnings are readable. This is not a physical Safari test.

No new slide layout was authored or redesigned. The PowerPoint checks establish content/privacy behavior in generated files, not visual fidelity in desktop PowerPoint or Keynote.

## Remaining launch gates / next improvement

- The existing exporter calls `pptxCleanText(..., 1400)`, which silently truncates longer bodies. Long Scripture passages require a preflight warning or splitting workflow before claiming complete export fidelity.
- Test representative exported files in desktop PowerPoint and on the actual church projector. Existing exported background motifs are not a promise of full image fidelity.
- Physical iPad/controller rehearsal and authenticated cross-device control remain unverified here.
- No deployment, publisher outreach, rights changes, or new paid content was included.
