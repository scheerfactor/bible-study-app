# Library Expansion Queue Phase 8

## Goal

Prepare the next high-value public-domain expansion without importing unclear material into the public app.

## Rule

Nothing in this queue is public content until the source, edition, rights status, duplicate check, and doctrinal review are complete.

## Commentary Candidates

| Candidate | Current Status | Next Safe Step |
| --- | --- | --- |
| Pulpit Commentary | Needs exact volume review | Choose one volume, document source and edition, stage one chapter only. |
| Biblical Illustrator | Needs exact volume review | Treat as teaching-help material; stage one chapter only after rights review. |
| Matthew Poole | Needs original-source review | Locate original public-domain edition and test one chapter. |
| H. A. Ironside | Mixed rights by title/edition | Verify title-level source before any public import. |
| William Kelly | Needs source and edition review | Stage only a narrow sample after exact source is documented. |
| J. N. Darby | Needs source, edition, and doctrinal review | Keep as candidate metadata until a narrow Bible-study use is approved. |
| F. W. Grant | Needs source and parser review | Review one exact volume before staging. |
| Arno C. Gaebelein | Needs duplicate and source review | Use only exact non-duplicate public-domain sources. |

## Book And Author Candidates

| Author / Area | Recommended Focus | Caution |
| --- | --- | --- |
| C. H. Spurgeon | Sermons, devotionals, Treasury of David review | Avoid duplicate editions and noisy sermon batches. |
| H. A. Ironside | Early verified works and commentaries | Later editions can be mixed; review title by title. |
| Clarence Larkin | Public-domain Bible charts/textual works | Avoid duplicate Larkin cards and unclear scans. |
| William Kelly | John, Romans, epistles, selected Bible studies | Use with discernment labels and exact source notes. |
| J. N. Darby | Narrow Bible-study resources only | Doctrinal context needed; do not bulk import silently. |
| F. W. Grant | Bible study helps where source is clean | Parser and OCR quality must be proven first. |
| Arno C. Gaebelein | Prophecy/commentary works where verified | Check existing Gaebelein resources before adding. |
| Baptist History | Armitage, Vedder, Cathcart, Ivimey, Welsh Baptist history | Verify edition and avoid unclear modern reprints. |
| Missions | Carey, Judson, Brainerd, Hudson Taylor, Morrison | Prefer clean Project Gutenberg or original archive sources. |
| Bible Tools | ISBE, Hastings, McClintock and Strong, TSK expansion | Large works need chunking and search plan before import. |

## Next Batch Recommendation

1. Pick 10 candidates from `NEXT_LIBRARY_IMPORT_CANDIDATES.csv`.
2. Verify exact source URL and edition.
3. Check duplicate title, author, checksum, and source URL.
4. Stage metadata only.
5. Import text only after `npm run library:qa` and rights review pass.
6. Keep all uncertain resources in Needs Review or Permission Needed.

## Do Not Import Publicly Yet

- Modern copyrighted KJV defense works without written permission.
- Trail of Blood until rights and edition are proven.
- Richard Wurmbrand / Tortured for Christ or other modern copyrighted works.
- Any OCR text with poor quality that is not safe for reading.
- Any personal-use upload for all users.
