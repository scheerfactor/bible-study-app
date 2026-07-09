# Storage Migration Report

Generated: 2026-07-09T10:20:04.065Z

## Path Strategy

Mirror current repository-relative paths in object storage during the transition. This lets the existing app fetch the same relative paths from `CONTENT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_CONTENT_BASE_URL`.

## Inventory Summary

| Area | Files | Present | Missing | Size |
| --- | ---: | ---: | ---: | ---: |
| Library text | 1,738 | 1,738 | 0 | 1.39 GB |
| Commentary batches | 256 | 256 | 0 | 412.38 MB |
| Dictionary files | 1 | 1 | 0 | 34.28 MB |
| Library manifests | 1 | 1 | 0 | 3.51 MB |
| Study tool files | 9 | 9 | 0 | 26.41 MB |
| Strong's indexes | 2 | 2 | 0 | 181.01 KB |
| Bible map media | 21 | 21 | 0 | 12.18 MB |
| TSK/cross-reference batches | 28 | 28 | 0 | 4.45 MB |
| Total public content | 2,056 | 2,056 | 0 | 1.87 GB |

Commentary entries represented in public batch files: 11,404

Storage-backed library text already uploaded to object storage: 59 files (49.12 MB).

## Biggest Storage Pressure

Large library text files over 1 MB: 391 files (923.75 MB).

Large public content files over 1 MB: 488 files (1.32 GB).

These are the best first candidates for R2 because moving them out of the deploy bundle gives the largest size relief while keeping metadata, rights notes, and indexes in Git.

| Size | Kind | Resource | Path |
| ---: | --- | --- | --- |
| 34.28 MB | dictionary | data/generated/websters-1828.entries.json | `data/generated/websters-1828.entries.json` |
| 34.00 MB | commentary_batch | biblical-illustrator-reviewed-epistles-depth-phase-1-commentary.json | `data/imports/biblical-illustrator-reviewed-epistles-depth-phase-1-commentary.json` |
| 18.22 MB | library_text | Young's Analytical Concordance to the Bible | `data/library/verified/young-s-analytical-concordance-to-the-bible-young-robert.txt` |
| 17.72 MB | commentary_batch | pulpit-commentary-reviewed-foundation-books-phase-1-commentary.json | `data/imports/pulpit-commentary-reviewed-foundation-books-phase-1-commentary.json` |
| 15.89 MB | commentary_batch | biblical-illustrator-reviewed-foundation-books-phase-1-commentary.json | `data/imports/biblical-illustrator-reviewed-foundation-books-phase-1-commentary.json` |
| 15.01 MB | commentary_batch | pulpit-commentary-reviewed-weak-books-commentary.json | `data/imports/pulpit-commentary-reviewed-weak-books-commentary.json` |
| 14.53 MB | commentary_batch | biblical-illustrator-reviewed-weak-books-commentary.json | `data/imports/biblical-illustrator-reviewed-weak-books-commentary.json` |
| 13.95 MB | commentary_batch | pulpit-commentary-reviewed-epistles-depth-phase-1-commentary.json | `data/imports/pulpit-commentary-reviewed-epistles-depth-phase-1-commentary.json` |
| 13.52 MB | library_text | Hastings Dictionary of the Bible, Volume 4 | `data/library/verified/hastings-dictionary-of-the-bible-volume-4-james-hastings.txt` |
| 11.68 MB | library_text | Works of John Bunyan — Complete | `data/library/verified/works-of-john-bunyan-complete-bunyan-john-and-offor-george.txt` |
| 11.60 MB | library_text | Hastings Dictionary of the Bible, Volume 2 | `data/library/verified/hastings-dictionary-of-the-bible-volume-2-james-hastings.txt` |
| 11.52 MB | commentary_batch | matthew-henry-reviewed-batch-2-commentary.json | `data/imports/matthew-henry-reviewed-batch-2-commentary.json` |
| 11.51 MB | commentary_batch | pulpit-commentary-reviewed-historical-books-phase-1-commentary.json | `data/imports/pulpit-commentary-reviewed-historical-books-phase-1-commentary.json` |
| 11.39 MB | library_text | Hastings Dictionary of the Bible, Volume 1 | `data/library/verified/hastings-dictionary-of-the-bible-volume-1-james-hastings.txt` |
| 10.33 MB | commentary_batch | biblical-illustrator-reviewed-focus-books-commentary.json | `data/imports/biblical-illustrator-reviewed-focus-books-commentary.json` |
| 10.00 MB | library_text | Nave's Topical Bible | `data/library/verified/naves-topical-bible.txt` |
| 10.00 MB | study_tool | data/library/verified/naves-topical-bible.txt | `data/library/verified/naves-topical-bible.txt` |
| 9.90 MB | commentary_batch | biblical-illustrator-reviewed-prophecy-teaching-commentary.json | `data/imports/biblical-illustrator-reviewed-prophecy-teaching-commentary.json` |
| 9.38 MB | commentary_batch | biblical-illustrator-reviewed-historical-books-phase-1-commentary.json | `data/imports/biblical-illustrator-reviewed-historical-books-phase-1-commentary.json` |
| 8.30 MB | commentary_batch | barnes-reviewed-completion-prophets-commentary.json | `data/imports/barnes-reviewed-completion-prophets-commentary.json` |
| 8.21 MB | commentary_batch | biblical-illustrator-reviewed-luke-complete-commentary.json | `data/imports/biblical-illustrator-reviewed-luke-complete-commentary.json` |
| 7.82 MB | library_text | Smith's Comprehensive Dictionary of the Bible | `data/library/verified/smiths-comprehensive-dictionary-of-the-bible.txt` |
| 7.82 MB | study_tool | data/library/verified/smiths-comprehensive-dictionary-of-the-bible.txt | `data/library/verified/smiths-comprehensive-dictionary-of-the-bible.txt` |
| 7.55 MB | commentary_batch | barnes-reviewed-phase-3-commentary.json | `data/imports/barnes-reviewed-phase-3-commentary.json` |
| 7.43 MB | library_text | Authorized Version 1611 Facsimile | `data/library/verified/authorized-version-1611-facsimile-pollard-alfred-w-alfred-william-1859-1944.txt` |

## Recommended Migration Order

1. Upload all `library_text` objects to R2 first. This removes the biggest pressure while preserving Library metadata in Git.
2. Upload `commentary_batch` objects next, especially Pulpit Commentary, Biblical Illustrator, Poole, and other large set files.
3. Upload dictionaries and study tools after the reader is confirmed to load external text quickly.
4. Keep manifests, rights metadata, import reports, author profiles, and validation scripts in Git.
5. After production is verified against R2, stop committing new full-text files to `data/library/verified`; commit metadata plus storage paths instead.

## Next Commands

```bash
npm run storage:plan
npm run storage:upload:r2 -- --dry-run
npm run storage:upload:r2 -- --kind=strongs_index --dry-run
npm run storage:upload:r2 -- --kind=tsk_cross_reference_batch --dry-run
```

When R2 credentials and a public base URL are configured:

```bash
npm run storage:upload:r2 -- --execute
npm run storage:upload:r2 -- --kind=strongs_index --execute
npm run storage:upload:r2 -- --kind=tsk_cross_reference_batch --execute
```

If using Wrangler instead of S3 credentials:

```bash
npm run storage:upload:wrangler -- --kind=strongs_index --execute
npm run storage:upload:wrangler -- --kind=tsk_cross_reference_batch --execute
```

Required environment variables:

```text
CONTENT_PUBLIC_BASE_URL
NEXT_PUBLIC_CONTENT_BASE_URL
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_PUBLIC_CONTENT
```

## Safety Notes

- Do not delete Git-backed content until production has been verified against object storage.
- Do not import the next large content batch until the reader, dictionary, study tools, and commentary batches load from object storage.
- Keep rights and review metadata in Git/Supabase; object storage should hold large public content bodies and assets.
