# Storage Migration Report

Generated: 2026-08-18T11:17:43.376Z

## Path Strategy

Mirror current repository-relative paths in object storage during the transition. This lets the existing app fetch the same relative paths from `CONTENT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_CONTENT_BASE_URL`.

## Inventory Summary

| Area | Files | Present | Missing | Size |
| --- | ---: | ---: | ---: | ---: |
| Library text | 2,240 | 2,240 | 0 | 1.86 GB |
| Commentary chapter index | 1 | 1 | 0 | 81.09 KB |
| Commentary batches | 345 | 345 | 0 | 505.03 MB |
| Dictionary files | 1 | 1 | 0 | 34.60 MB |
| Library manifests | 1 | 1 | 0 | 4.68 MB |
| Study tool files | 9 | 9 | 0 | 26.41 MB |
| Strong's indexes | 2 | 2 | 0 | 181.01 KB |
| Bible map media | 21 | 21 | 0 | 12.18 MB |
| TSK/cross-reference batches | 45 | 45 | 0 | 5.14 MB |
| Total public content | 2,665 | 2,665 | 0 | 2.44 GB |

Commentary entries represented in public batch files: 12,850

Storage-backed library text already uploaded to object storage: 486 files (457.19 MB).

## Biggest Storage Pressure

Large library text files over 1 MB: 530 files (1.23 GB).

Large public content files over 1 MB: 653 files (1.72 GB).

These are the best first candidates for R2 because moving them out of the deploy bundle gives the largest size relief while keeping metadata, rights notes, and indexes in Git.

| Size | Kind | Resource | Path |
| ---: | --- | --- | --- |
| 46.91 MB | library_text | John Gill's Commentary On The Whole Bible | `data/library/verified/john-gill-s-commentary-on-the-whole-bible-john-gill.txt` |
| 34.60 MB | dictionary | data/generated/websters-1828.entries.json | `data/generated/websters-1828.entries.json` |
| 34.00 MB | commentary_batch | biblical-illustrator-reviewed-epistles-depth-phase-1-commentary.json | `data/imports/biblical-illustrator-reviewed-epistles-depth-phase-1-commentary.json` |
| 21.56 MB | commentary_batch | american-commentary-reviewed-new-testament-commentary.json | `data/imports/american-commentary-reviewed-new-testament-commentary.json` |
| 18.22 MB | library_text | Young's Analytical Concordance to the Bible | `data/library/verified/young-s-analytical-concordance-to-the-bible-young-robert.txt` |
| 18.02 MB | commentary_batch | pulpit-commentary-reviewed-foundation-books-phase-1-commentary.json | `data/imports/pulpit-commentary-reviewed-foundation-books-phase-1-commentary.json` |
| 15.90 MB | commentary_batch | biblical-illustrator-reviewed-foundation-books-phase-1-commentary.json | `data/imports/biblical-illustrator-reviewed-foundation-books-phase-1-commentary.json` |
| 15.01 MB | commentary_batch | pulpit-commentary-reviewed-weak-books-commentary.json | `data/imports/pulpit-commentary-reviewed-weak-books-commentary.json` |
| 14.58 MB | commentary_batch | biblical-illustrator-reviewed-weak-books-commentary.json | `data/imports/biblical-illustrator-reviewed-weak-books-commentary.json` |
| 13.95 MB | commentary_batch | pulpit-commentary-reviewed-epistles-depth-phase-1-commentary.json | `data/imports/pulpit-commentary-reviewed-epistles-depth-phase-1-commentary.json` |
| 13.52 MB | library_text | Hastings Dictionary of the Bible, Volume 4 | `data/library/verified/hastings-dictionary-of-the-bible-volume-4-james-hastings.txt` |
| 12.67 MB | library_text | The Bible Interpreter; or, Improved Helps to Bible Study | `data/library/verified/the-bible-interpreter-or-improved-helps-to-bible-study-roswell-d-hitchcock-and-contributors.txt` |
| 11.68 MB | library_text | Works of John Bunyan — Complete | `data/library/verified/works-of-john-bunyan-complete-bunyan-john-and-offor-george.txt` |
| 11.61 MB | commentary_batch | pulpit-commentary-reviewed-historical-books-phase-1-commentary.json | `data/imports/pulpit-commentary-reviewed-historical-books-phase-1-commentary.json` |
| 11.60 MB | library_text | Hastings Dictionary of the Bible, Volume 2 | `data/library/verified/hastings-dictionary-of-the-bible-volume-2-james-hastings.txt` |
| 11.52 MB | commentary_batch | matthew-henry-reviewed-batch-2-commentary.json | `data/imports/matthew-henry-reviewed-batch-2-commentary.json` |
| 11.39 MB | library_text | Hastings Dictionary of the Bible, Volume 1 | `data/library/verified/hastings-dictionary-of-the-bible-volume-1-james-hastings.txt` |
| 10.33 MB | commentary_batch | biblical-illustrator-reviewed-focus-books-commentary.json | `data/imports/biblical-illustrator-reviewed-focus-books-commentary.json` |
| 10.00 MB | library_text | Nave's Topical Bible | `data/library/verified/naves-topical-bible.txt` |
| 10.00 MB | study_tool | data/library/verified/naves-topical-bible.txt | `data/library/verified/naves-topical-bible.txt` |
| 9.90 MB | commentary_batch | biblical-illustrator-reviewed-prophecy-teaching-commentary.json | `data/imports/biblical-illustrator-reviewed-prophecy-teaching-commentary.json` |
| 9.38 MB | commentary_batch | biblical-illustrator-reviewed-historical-books-phase-1-commentary.json | `data/imports/biblical-illustrator-reviewed-historical-books-phase-1-commentary.json` |
| 8.30 MB | commentary_batch | barnes-reviewed-completion-prophets-commentary.json | `data/imports/barnes-reviewed-completion-prophets-commentary.json` |
| 8.24 MB | library_text | An exposition of the Old and New Testament : with practical remarks and observations | `data/library/verified/an-exposition-of-the-old-and-new-testament-with-practical-remarks-and-observations-matthew-henry.txt` |
| 8.21 MB | commentary_batch | biblical-illustrator-reviewed-luke-complete-commentary.json | `data/imports/biblical-illustrator-reviewed-luke-complete-commentary.json` |

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
npm run storage:upload:r2 -- --kind=tsk_cross_reference_batch --dry-run
```

When R2 credentials and a public base URL are configured:

```bash
npm run storage:upload:r2 -- --execute
npm run storage:upload:r2 -- --kind=commentary_index --execute
npm run storage:upload:r2 -- --kind=strongs_index --execute
npm run storage:upload:r2 -- --kind=tsk_cross_reference_batch --execute
```

If using Wrangler instead of S3 credentials:

```bash
npm run storage:upload:wrangler -- --kind=commentary_index --execute
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
