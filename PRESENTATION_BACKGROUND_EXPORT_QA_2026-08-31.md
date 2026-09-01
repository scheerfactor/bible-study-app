# PowerPoint background-image fidelity — 2026-08-31

## Change

PowerPoint exports now embed the selected local, rights-documented sermon-slide JPEG as a full-slide 16:9 cover image. A contrast overlay remains above the photo and behind visible text. Slides without a media asset retain their existing solid theme background.

Only allow-listed files under the bundled `photos` and `archaeology` directories are accepted. Every image is fetched before PowerPoint creation, capped at 8 MB, and checked for a JPEG signature. Missing, malformed, or unapproved images stop export before a file is written.

Presenter copies load the bundled media manifest and append a `[Sources]` block containing the background source, source URL, rights status, artist, and credit. Slides-only copies embed the same image but exclude this private note metadata. A missing presenter rights record also stops export. Existing user speaker notes remain intact.

No external media was downloaded, no new rights claim was made, and no deployment configuration changed.

## Passed

- `node scripts/test-presentation-export-privacy.mjs`: actual PowerPoint ZIPs contain embedded JPEG media in both modes; background source, URL, rights, artist, and credit exist only in presenter XML and never visible slide XML; missing rights record and invalid JPEG both reject without writing files. Existing KJV, quotation, author, private-note, text-boundary, and splitting tests pass.
- Full-size render of the generated cross-background slide: 16:9 crop, contrast overlay, title, attribution, quotation, footer, and decorative motif visually inspected with no clipping or unintended overlap.
- Production UI journey: selected the bundled Ancient Jerusalem background, verified its active state, and successfully exported slides-only and presenter copies without fallback/error status.
- `npm run lint`: exit 0 (existing large-file Babel informational notice only).
- `npm run build -- --webpack`: exit 0; TypeScript and all 28 static pages passed.
- Disposable presentation was not saved; test tab closed and local server stopped.

## Remaining gates / next slice

Physical PowerPoint/Keynote display, projector contrast, iPad/Safari download behavior, and authenticated cross-device control remain unverified. PowerPoint currently applies one general cover crop and overlay. The next useful refinement is per-background focal-position and contrast metadata so portrait archaeology images and light/dark photographs keep their most important subject visible while preserving readable text.
