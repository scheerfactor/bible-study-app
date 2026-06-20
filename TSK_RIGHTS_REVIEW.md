# Treasury of Scripture Knowledge Rights Review

Last reviewed: 2026-06-02

Update on 2026-06-20: a formal study-tool source manifest now lives at
`data/study-tools/source-candidates.json`, with validation through
`npm run validate:study-sources`. OpenBible.info is the preferred next staging
candidate because it provides a downloadable cross-reference dataset and states
that the data draws primarily from public-domain sources, especially TSK, with
Creative Commons Attribution terms. This does not mean it is public-domain-only;
the app must preserve attribution and import reference links only.

## Summary

The original Treasury of Scripture Knowledge tradition is public domain, but not every modern digital TSK dataset is automatically unrestricted. Treat the printed/source work and the downloadable dataset as two separate rights questions.

Final recommendation for this app:

1. Prefer a public-domain scan/OCR source from Internet Archive, Wikimedia Commons, or Sacred Texts for long-term unrestricted import.
2. Use the Phase 1 reviewed sample in `data/imports/tsk-phase-1-reviewed-sample.json` while the full source is being prepared.
3. Do not import Bible Hub, Bible Study Tools, or other website-rendered TSK pages by scraping.
4. If using OpenBible.info, crossreferences.org, MetaV, or another prepared dataset, accept and document that dataset's Creative Commons obligations before import.

## Phase 1 Implementation Decision

Current decision: import and display only a reviewed sample for Genesis 1-5, Exodus 1-5, John 1-5, Romans 1-8, and Luke 24.

The Phase 1 file is:

```text
data/imports/tsk-phase-1-reviewed-sample.json
```

Each row includes:

- source verse
- target verse
- short label
- source name
- source title
- source URL
- public-domain/source status
- rights notes

The app should not import the whole TSK dataset until a public-domain archive/OCR source has been selected, parsed, and quality reviewed. The current sample is intentionally small so cross references can become useful across important chapters without creating rights or quality problems.

## Final Recommendation

Use a public-domain archive source as the primary TSK completion path. This best fits the app's public-domain library policy and avoids silently introducing Creative Commons share-alike obligations into the core cross-reference database.

Recommended sequence:

1. Keep the current Phase 1 reviewed sample live in the app.
2. Select a public-domain archive source and record its manifest under `data/sources/tsk/<source-name>/source-manifest.json`.
3. Build a parser that extracts verse owner references and target references without importing any website-rendered page content.
4. Import a reviewed sample of 25-50 references first.
5. Compare the sample against the printed/source structure for quality.
6. Import the full public-domain source only after the sample passes rights and quality review.
7. Use OpenBible.info, MetaV, or crossreferences.org only as alternate paths if attribution/share-alike obligations are explicitly accepted and recorded.

Do not import full TSK from Bible Hub, Bible Study Tools, or any rendered website pages.

## Quality Review Requirements

Before full import, verify:

- Verse ownership is correct.
- Target references resolve in the local KJV data.
- Duplicate references are merged safely.
- Labels are short and do not become commentary.
- Imported source metadata is stored with every row or source record.
- A sample can be opened from the Study Drawer and Full Study view.
- References do not overwhelm the reader; prioritize display order for the most useful references first.

## Source Options

### Option A: Public-domain scan/OCR source

Status: best long-term option.

Evidence:

- Sacred Texts hosts Treasury of Scriptural Knowledge with attribution to Canne, Browne, Blayney, Scott, and others, with an introduction by R. A. Torrey, dated circa 1880.
- Wikimedia Commons lists an Internet Archive scan of a related treasury Bible knowledge volume with public-domain status in the United States because of pre-1931 publication.

Implementation notes:

- Download a scan/OCR text from a public-domain archive.
- Keep the raw source under `data/sources/tsk/`.
- Create a parser that preserves verse ownership and target references.
- Import a reviewed sample first, then the full dataset.

### Option B: MetaV CrossRefIndex

Status: usable only if attribution/share-alike terms are accepted.

Current local manifest:

```text
data/sources/tsk/source-manifest.json
```

Notes:

- The MetaV repository says it uses several public-domain, Creative Commons, or open-use sources.
- The current local manifest records the candidate license as Creative Commons Attribution-ShareAlike 3.0.
- Share-alike may affect redistribution of the derived cross-reference dataset.

Implementation notes:

- Keep `scripts/prepare-tsk-metav-cross-references.mjs`.
- Do not run the full import until license acceptance is documented.
- A small sample may be imported only if the source and license are shown in app metadata.

### Option C: OpenBible.info cross-reference download

Status: usable if CC BY attribution is acceptable and ESV text is not imported.

Evidence:

- OpenBible.info says the dataset draws primarily from public-domain sources, especially Treasury of Scripture Knowledge.
- The page offers a downloadable cross-reference data file and says the content is licensed under a Creative Commons Attribution License unless otherwise indicated.
- The page displays ESV quotations, so the app should import reference links only and continue using the app's KJV text previews from its own KJV data.

Implementation notes:

- Download the data file from the provided download link rather than scraping rendered pages.
- Record OpenBible.info as the source in `resource_sources`.
- Preserve attribution in the source metadata and future about/settings pages.
- Import a small John 3:16 sample first.

### Option D: crossreferences.org dataset

Status: usable only if CC BY-SA 4.0 share-alike obligations are acceptable.

Evidence:

- crossreferences.org states its TSK mapping dataset is licensed under Creative Commons Attribution-ShareAlike 4.0.
- It separates the dataset license from Bible text licenses and lists KJV as public domain.

Implementation notes:

- Treat this as a derivative-data licensing decision, not a public-domain import.
- Do not combine it silently with public-domain-only resource claims.
- If used, add visible attribution and share-alike notes in `resource_sources`.

### Option E: Bible study websites

Status: read-only reference, not import source.

Notes:

- Some websites state TSK or Matthew Henry resources are public domain, but their site terms and page presentation can still restrict scraping or bulk copying.
- Use those pages for rights clues only; do not scrape.

## Implementation Plan

1. Keep the current `cross_references` table.
2. Keep current John 3:14-18 TSK-style sample rows.
3. Add a source-specific import folder under `data/sources/tsk/<source-name>/`.
4. Add a source manifest with:
   - title
   - editor/compiler
   - publication year
   - source URL
   - download URL
   - license/public-domain statement
   - attribution notes
   - commercial-use notes
5. Convert a reviewed sample into `data/imports/tsk-cross-references.sample-reviewed.json`.
6. Validate the sample:

```bash
npm run validate:tsk -- data/imports/tsk-phase-1-reviewed-sample.json
```

7. Run a dry import:

```bash
npm run import:tsk -- data/imports/tsk-phase-1-reviewed-sample.json --dry-run
```

8. After review, run the actual sample import.
9. Only after the sample works and rights are accepted, import the full dataset.

## Current Decision

Do not import full TSK yet. The app should keep the Phase 1 reviewed sample and prepare a public-domain archive source as the preferred completion path. Creative Commons datasets remain alternate paths only if attribution/share-alike obligations are accepted and documented.

## Next Safe Sprint

1. Download the OpenBible cross-reference zip into a local, uncommitted review
   folder.
2. Parse only reference pairs and ranking/order metadata; do not import ESV
   quotations or rendered website text.
3. Generate a 50-reference staging sample with:
   - source URL
   - attribution note
   - license summary
   - review status `Needs Review`
4. Run:

```bash
npm run prepare:tsk-openbible -- --input=/path/to/cross_references.txt --limit=50
npm run validate:study-sources
npm run validate:tsk -- data/imports/<new-tsk-staging-sample>.json
```

5. Promote only reviewed rows into public app data.
