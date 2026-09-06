# Storage Migration Report

Generated: 2026-09-06T23:58:51.431Z

## Path Strategy

Mirror current repository-relative paths in object storage during the transition. This lets the existing app fetch the same relative paths from `CONTENT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_CONTENT_BASE_URL`.

## Inventory Summary

| Area | Files | Present | Missing | Size |
| --- | ---: | ---: | ---: | ---: |
| Library text | 2,388 | 2,388 | 0 | 2.05 GB |
| Commentary chapter index | 1 | 1 | 0 | 82.16 KB |
| Commentary batches | 354 | 354 | 0 | 514.93 MB |
| Dictionary files | 2 | 2 | 0 | 38.21 MB |
| Library manifests | 1 | 1 | 0 | 5.14 MB |
| Study tool files | 9 | 9 | 0 | 26.41 MB |
| Strong's indexes | 2 | 2 | 0 | 181.01 KB |
| Strong's chapter mappings | 0 | 0 | 0 | 0 B |
| Bible map media | 21 | 21 | 0 | 12.18 MB |
| TSK/cross-reference batches | 45 | 45 | 0 | 5.14 MB |
| Total public content | 2,823 | 2,823 | 0 | 2.64 GB |

Commentary entries represented in public batch files: 13,015

Storage-backed library text already uploaded to object storage: 486 files (457.19 MB).

## Biggest Storage Pressure

Large library text files over 1 MB: 569 files (1.37 GB).

Large public content files over 1 MB: 697 files (1.87 GB).

These are the best first candidates for R2 because moving them out of the deploy bundle gives the largest size relief while keeping metadata, rights notes, and indexes in Git.

| Size | Kind | Resource | Path |
| ---: | --- | --- | --- |
| 46.91 MB | library_text | John Gill's Commentary On The Whole Bible | `data/library/verified/john-gill-s-commentary-on-the-whole-bible-john-gill.txt` |
| 34.60 MB | dictionary | data/generated/websters-1828.entries.json | `data/generated/websters-1828.entries.json` |
| 34.00 MB | commentary_batch | biblical-illustrator-reviewed-epistles-depth-phase-1-commentary.json | `data/imports/biblical-illustrator-reviewed-epistles-depth-phase-1-commentary.json` |
| 27.07 MB | library_text | The Exhaustive Concordance of the Bible | `data/library/verified/the-exhaustive-concordance-of-the-bible-james-strong.txt` |
| 21.56 MB | commentary_batch | american-commentary-reviewed-new-testament-commentary.json | `data/imports/american-commentary-reviewed-new-testament-commentary.json` |
| 18.22 MB | library_text | Young's Analytical Concordance to the Bible | `data/library/verified/young-s-analytical-concordance-to-the-bible-young-robert.txt` |
| 18.02 MB | commentary_batch | pulpit-commentary-reviewed-foundation-books-phase-1-commentary.json | `data/imports/pulpit-commentary-reviewed-foundation-books-phase-1-commentary.json` |
| 15.90 MB | commentary_batch | biblical-illustrator-reviewed-foundation-books-phase-1-commentary.json | `data/imports/biblical-illustrator-reviewed-foundation-books-phase-1-commentary.json` |
| 15.01 MB | commentary_batch | pulpit-commentary-reviewed-weak-books-commentary.json | `data/imports/pulpit-commentary-reviewed-weak-books-commentary.json` |
| 14.58 MB | commentary_batch | biblical-illustrator-reviewed-weak-books-commentary.json | `data/imports/biblical-illustrator-reviewed-weak-books-commentary.json` |
| 13.95 MB | commentary_batch | pulpit-commentary-reviewed-epistles-depth-phase-1-commentary.json | `data/imports/pulpit-commentary-reviewed-epistles-depth-phase-1-commentary.json` |
| 13.55 MB | library_text | A Complete Concordance to the Holy Scriptures | `data/library/verified/a-complete-concordance-to-the-holy-scriptures-alexander-cruden.txt` |
| 13.52 MB | library_text | Hastings Dictionary of the Bible, Volume 4 | `data/library/verified/hastings-dictionary-of-the-bible-volume-4-james-hastings.txt` |
| 12.67 MB | library_text | The Bible Interpreter; or, Improved Helps to Bible Study | `data/library/verified/the-bible-interpreter-or-improved-helps-to-bible-study-roswell-d-hitchcock-and-contributors.txt` |
| 12.54 MB | library_text | Annotations upon the Holy Bible, Volume 2 | `data/library/verified/annotations-upon-the-holy-bible-volume-2-matthew-poole-and-continuators.txt` |
| 12.20 MB | library_text | Annotations upon the Holy Bible, Volume 1 | `data/library/verified/annotations-upon-the-holy-bible-volume-1-matthew-poole-and-continuators.txt` |
| 11.68 MB | library_text | Works of John Bunyan — Complete | `data/library/verified/works-of-john-bunyan-complete-bunyan-john-and-offor-george.txt` |
| 11.61 MB | commentary_batch | pulpit-commentary-reviewed-historical-books-phase-1-commentary.json | `data/imports/pulpit-commentary-reviewed-historical-books-phase-1-commentary.json` |
| 11.60 MB | library_text | Hastings Dictionary of the Bible, Volume 2 | `data/library/verified/hastings-dictionary-of-the-bible-volume-2-james-hastings.txt` |
| 11.52 MB | commentary_batch | matthew-henry-reviewed-batch-2-commentary.json | `data/imports/matthew-henry-reviewed-batch-2-commentary.json` |
| 11.39 MB | library_text | Hastings Dictionary of the Bible, Volume 1 | `data/library/verified/hastings-dictionary-of-the-bible-volume-1-james-hastings.txt` |
| 10.33 MB | commentary_batch | biblical-illustrator-reviewed-focus-books-commentary.json | `data/imports/biblical-illustrator-reviewed-focus-books-commentary.json` |
| 10.00 MB | library_text | Nave's Topical Bible | `data/library/verified/naves-topical-bible.txt` |
| 10.00 MB | study_tool | data/library/verified/naves-topical-bible.txt | `data/library/verified/naves-topical-bible.txt` |
| 9.90 MB | commentary_batch | biblical-illustrator-reviewed-prophecy-teaching-commentary.json | `data/imports/biblical-illustrator-reviewed-prophecy-teaching-commentary.json` |

## Recommended Migration Order

1. Upload all `library_text` objects to R2 first. This removes the biggest pressure while preserving Library metadata in Git.
2. Upload the `commentary_index` and all `commentary_batch` objects next, especially Pulpit Commentary, Biblical Illustrator, Poole, and other large set files.
3. Upload dictionaries and study tools after the reader is confirmed to load external text quickly.
4. Keep manifests, rights metadata, import reports, author profiles, and validation scripts in Git.
5. After production is verified against R2, stop committing new full-text files to `data/library/verified`; commit metadata plus storage paths instead.

## Next Commands

```bash
npm run storage:plan
npm run storage:preflight
npm run storage:upload:r2 -- --dry-run
npm run storage:upload:r2 -- --kind=commentary_index --dry-run
npm run storage:upload:r2 -- --kind=strongs_index --dry-run
npm run storage:upload:r2 -- --kind=strongs_mapping_chapter --dry-run
npm run storage:upload:r2 -- --kind=tsk_cross_reference_batch --dry-run
```

When R2 credentials and a public base URL are configured:

```bash
npm run storage:upload:r2 -- --execute
npm run storage:upload:r2 -- --kind=commentary_index --execute
npm run storage:upload:r2 -- --kind=strongs_index --execute
npm run storage:upload:r2 -- --kind=strongs_mapping_chapter --execute
npm run storage:upload:r2 -- --kind=tsk_cross_reference_batch --execute
```

If using Wrangler instead of S3 credentials:

```bash
npm run storage:upload:wrangler -- --kind=commentary_index --execute
npm run storage:upload:wrangler -- --kind=strongs_index --execute
npm run storage:upload:wrangler -- --kind=strongs_mapping_chapter --path-prefix=data/strongs/mappings-by-chapter/genesis- --execute
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
