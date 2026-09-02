# Exact commentary excerpts — August 30, 2026

## Delivered

Presentations → Slide Deck → Commentary now offers **Choose exact excerpt** on each result, alongside the existing opening-excerpt action. The picker shows the full loaded commentary entry for context, supports native text selection or pasting a continuous excerpt, and checks the wording before insertion. It limits the selection to 700 characters without silently truncating it.

The new Quote slide preserves author, source URL, rights basis, interpretive-use guidance, and the KJV comparison reminder. Speaker notes also record the selected text's character range within the loaded entry (first matching occurrence). Source files and KJV wording are unchanged. This checks fidelity to the loaded text, not its transcription accuracy or doctrinal correctness.

## Verification

- `node scripts/test-commentary-excerpt.mjs`: 10 checks passed for exact wording, punctuation/case, contiguous text, outer whitespace, empty text, paraphrases, length boundaries, and repeated-text location.
- `npm run lint`: passed; focused lint rerun after the keyboard-focus adjustment also passed.
- `npm run build -- --webpack`: passed, including TypeScript.
- Production-browser journey on port 3031: direct Presentations entry; source picker receives keyboard focus; native select-all and Use selected words populate the draft; an overlong selection is blocked; altered wording is blocked.
- A sentence at characters 822–859 of Gaebelein's Hosea 1 entry was added unchanged, with source and selection location in speaker notes. This verifies selection beyond the initial automatic preview.
- Cancel leaves the deck unchanged. Loading another chapter closes the old picker, preventing a stale source from being mistaken for the new results.
- Save → page reload → Open retains the exact excerpt and provenance. The isolated test deck was archived afterward.
- Phone (390 × 844) visual check and tablet (768 × 1024) layout check passed without document horizontal overflow. These are browser viewport checks, not physical-device Safari tests.

## Remaining work

No deployment, licensed content import, publisher outreach, or remote-control configuration was performed. Actual iPad/projector rehearsal and shared remote-control verification remain presentation launch gates.

The next useful improvement is finding and highlighting a searched phrase inside the long source entry, so users can reach the relevant context without scrolling through an entire chapter. Existing source text may contain OCR errors and must still be reviewed before teaching.
