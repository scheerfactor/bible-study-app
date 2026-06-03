# Commentary Import Pipeline

This pipeline prepares full public-domain commentary sets without publishing unreviewed material.

## Safety Rule

Commentary remains secondary to Scripture. A parsed commentary file is not public until each entry is reviewed and marked `Verified`.

Do not publicly import:

- Copyrighted or unclear modern editions.
- Website-enhanced text unless the source terms allow reuse.
- Entries without source URL, work title, author, and rights notes.
- Material that has not passed doctrinal/resource review.

## Folder Layout

- `data/commentary/<source>/source-manifest.json` documents source, rights, parser, and recommended use.
- `data/commentary/<source>/source/` stores downloaded source archives locally. Zip files are ignored by Git.
- `data/commentary/staging/` stores parsed entries marked `Needs Review`.
- `data/commentary/reports/` stores coverage and duplicate reports.
- `data/imports/` stores public app commentary entries after review.

## Prepare A Full Source

Default JFB run:

```bash
npm run commentary:prepare
```

Dry run:

```bash
npm run commentary:prepare -- --dry-run
```

Custom manifest:

```bash
npm run commentary:prepare -- data/commentary/jfb/source-manifest.json
```

The prepare step:

- Downloads the source archive if missing.
- Parses HTML/TXT source files.
- Splits text by Bible book and chapter.
- Adds author, work title, source URL, rights notes, and checksum.
- Marks every entry `Needs Review`.
- Writes a coverage report.

## Review And Promote

Review staged entries in:

```text
data/commentary/staging/
```

Only change `review_status` to `Verified` after source, rights, reference, and text quality review.

Promote verified rows:

```bash
npm run commentary:promote -- data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json --dry-run
```

Then without `--dry-run` when ready:

```bash
npm run commentary:promote -- data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json
```

Rows still marked `Needs Review`, `Permission Needed`, or `Do Not Import` remain private to the review queue.

## Create A Reviewed Batch

Use reviewed batches for 25-50 chapters at a time:

```bash
npm run commentary:review-batch -- --refs="John 1-5,Romans 1-8,Amos 1-9,Luke 24,Psalms 1-5,Revelation 1-3" --prune-public-conflicts
```

The batch tool:

- Selects chapters from a staged commentary file.
- Requires the batch to stay in the configured chapter range.
- Marks only the reviewed output rows `Verified`.
- Preserves source URL, author, title, rights notes, and checksums.
- Removes older conflicting public sample entries when `--prune-public-conflicts` is used.
- Writes a public import file only for the reviewed batch.

## Validation

Run:

```bash
npm run validate:commentary
```

This validates public commentary imports and staged commentary files for:

- Required metadata.
- Valid KJV book/chapter/verse references.
- Duplicate entries.
- Chapter coverage counts.

## Current Full-Set Pipeline Status

JFB is the first full commentary set prepared because the CCEL HTML archive has a predictable Bible-book file structure and clear public-domain language.

Prepared output:

- `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- `data/commentary/reports/jamieson-fausset-brown-complete-commentary-coverage.json`

Current JFB staging result:

- 1,189 entries
- 66 Bible books
- 1,189 Bible chapters
- 0 missing chapters
- 0 duplicate entries
- Review status: `Needs Review`

Current JFB public promotion:

- `data/imports/jfb-reviewed-batch-1-commentary.json`
- 31 verified public chapters
- John 1-5
- Romans 1-8
- Amos 1-9
- Luke 24
- Psalms 1-5
- Revelation 1-3

## Matthew Henry Full Parser

Matthew Henry now has a full CCEL volume-archive parser:

- Manifest: `data/commentary/matthew-henry/source-manifest.json`
- Staging file: `data/commentary/staging/matthew-henry-complete-commentary-needs-review.json`
- Coverage report: `data/commentary/reports/matthew-henry-complete-commentary-coverage.json`

Current Matthew Henry staging result:

- 1,189 entries
- 66 Bible books
- 1,189 Bible chapters
- 0 missing chapters
- 0 duplicate entries
- Review status: `Needs Review`

## Next Commentary Sources

Recommended order:

1. Review and promote JFB by book or small batches.
2. Add Matthew Henry full-source parser or source manifest and stage remaining books.
3. Add Wesley Notes parser if source structure remains simple.
4. Add Barnes, Gill, and Clarke only after stable source files and rights notes are confirmed.
