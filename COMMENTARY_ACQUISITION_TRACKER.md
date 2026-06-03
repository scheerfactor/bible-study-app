# Commentary Acquisition Tracker

Father's Business Bible Study is expanding commentary depth by adding one reviewed source at a time. Scripture remains first. Commentary is secondary, collapsed where practical, and only imported when source, rights, and review status are documented.

## Sprint Rules

- Import small verified samples before any full collection.
- Never import copyrighted, modern edited, or unclear content without documented permission.
- Keep exact source URLs, rights notes, review notes, and chapter coverage with each entry.
- Mark doctrinal perspective plainly; do not hide useful historical resources solely for secondary differences.
- Do not generate doctrine automatically. Commentary summaries and samples must be reviewed before public display.

## Current Imported Coverage

| Author | Source | Rights status | Chapters imported | Chapters remaining | Review status |
| --- | --- | --- | --- | --- | --- |
| Matthew Henry | https://www.ccel.org/h/henry/mhc2/MHC00000.HTM | Public-domain original work. Old CCEL archive page states public-domain text with no rights reserved. | 33 public verified chapters: Genesis 1-5; Exodus 1-5; Amos 1-9; John 1-5; Romans 1-8; Luke 24. Full 1,189-chapter set is staged in Needs Review. | Review staged entries by book/chapter before promotion. | Full parser staged; public entries remain verified Phase 1 |
| H. A. Ironside | https://www.brethrenarchive.org/people/harry-a-ironside/pamphlets/addresses-on-the-gospel-of-john/ and related source paths | Mixed. Romans 1928 source is public domain in the U.S.; John/Luke samples are curated summaries until renewal and edition audit are complete. | 3 chapters: John 3; Romans 5; Luke 24 | Genesis 1 and Exodus 3 remain blocked until exact source and rights verification. | Verified samples only |
| Albert Barnes | https://sacred-texts.com/bib/cmt/barnes/ | Public-domain original work by publication date and author death; source file/terms need full import review. | 7 reviewed entries: John 1; John 5; Romans 1; Romans 5; Romans 8; Luke 24; Amos 9 | Whole-Bible source acquisition, segmentation, and quality review remain. | Verified samples; full import needs review |
| Jamieson-Fausset-Brown | https://www.ccel.org/j/jfb/jfb/old/JFB00.htm | Public-domain original work first published in 1871; CCEL electronic edition states public-domain status. | 31 public verified chapters: John 1-5; Romans 1-8; Amos 1-9; Luke 24; Psalms 1-5; Revelation 1-3. Full 1,189-chapter set is staged in Needs Review. | Continue reviewed batches of 25-50 chapters. | Full pipeline staged; reviewed batch 1 promoted |
| John Wesley | https://www.ccel.org/w/wesley/notes/index.html | CCEL work record lists Wesley's Notes on the Bible as Public Domain. | 7 reviewed entries: John 1; John 3; John 5; Romans 1; Romans 8; Luke 24; Amos 9 | Full source handling and Methodist perspective notes remain. | Verified samples; full import needs review |
| John Gill | https://www.biblestudytools.com/commentaries/gills-exposition-of-the-bible/ | Source page states the exposition is public domain and may be freely used and distributed. | 7 reviewed entries: John 1; John 3; John 5; Romans 1; Romans 8; Luke 24; Amos 9 | Need stable source file, segmentation plan, and quality review. | Verified samples; full import needs review |
| Adam Clarke | https://onlinebooks.library.upenn.edu/webbin/book/lookupid?key=ha102300285 | Public-domain by publication date; Online Books Page lists an 1843 edition. | 7 reviewed entries: John 1; John 5; Romans 1; Romans 5; Romans 8; Luke 24; Amos 9 | Need clean text source, edition review, and warning labels. | Verified samples; full import needs review |

## Tier 2 Acquisition Queue

| Author | Source | Rights status | Chapters imported | Chapters remaining | Review status |
| --- | --- | --- | --- | --- | --- |
| F. B. Meyer | Project Gutenberg / verified public-domain books already used in Library | Public-domain works available, but commentary-by-chapter mapping needs review. | 0 commentary entries | Identify passage-based exposition volumes and map to Bible references. | Needs review |
| J. C. Ryle | Public-domain Expository Thoughts source path needed | Public-domain likely for original works; exact source file and edition required. | 0 commentary entries | Choose Gospel volume, import small sample, validate references. | Needs review |
| Andrew Murray | Public-domain devotional works available; not a primary verse commentary set | Public-domain works available, but most fit Library/devotional rather than commentary. | 0 commentary entries | Decide whether to keep as Library only or passage-linked devotional notes. | Needs review |
| R. A. Torrey | Public-domain topical and teaching works available; not a primary whole-Bible commentary set | Public-domain works available, but commentary structure needs review. | 0 commentary entries | Identify passage-linked teaching notes before import. | Needs review |

## Recommended Next Acquisition Order

1. Validate the Phase 1 and Phase 2 reviewed sample files plus staged JFB data.
2. Continue JFB reviewed batches of 25-50 chapters and promote only verified rows.
3. Review Matthew Henry staged entries by book/chapter and promote only verified rows.
4. Evaluate Wesley Notes as the next complete parser target because the source structure appears simpler than several older multi-volume sets.
5. Keep Barnes, Gill, and Clarke in reviewed sample mode until stable full-text sources and import parsers are selected.
6. Add author perspective notes before larger comparative commentary display.

## Full Pipeline Files

- Pipeline guide: `COMMENTARY_IMPORT_PIPELINE.md`
- JFB source manifest: `data/commentary/jfb/source-manifest.json`
- JFB staging file: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- JFB coverage report: `data/commentary/reports/jamieson-fausset-brown-complete-commentary-coverage.json`
- JFB public reviewed batch 1: `data/imports/jfb-reviewed-batch-1-commentary.json`
- Matthew Henry source manifest: `data/commentary/matthew-henry/source-manifest.json`
- Matthew Henry staging file: `data/commentary/staging/matthew-henry-complete-commentary-needs-review.json`
- Matthew Henry coverage report: `data/commentary/reports/matthew-henry-complete-commentary-coverage.json`

The JFB and Matthew Henry staging files are not imported into the public app. They are review queues. Public display still comes only from reviewed imports in `data/imports/`.

## Phase 2 Batch

The Phase 2 batch file is `data/imports/commentary-acquisition-phase-2-reviewed-batch.json`.

It begins the next commentary layer with reviewed chapter-level entries for:

- John 1
- John 5
- Romans 1
- Romans 8
- Luke 24
- Amos 9

The batch intentionally does not claim to be a full commentary extraction. It is an acquisition bridge while exact full-source parsers and rights handling are reviewed.

## Dashboard Requirements

The app Commentary Coverage Dashboard should show:

- Total commentary entries
- Coverage by Bible book
- Coverage by author
- Missing Bible books
- Missing chapters in covered books
- Review/acquisition queue

## Do Not Import Yet

- Modern edited commentary editions without permission.
- Copyrighted commentary sets.
- Website formatting, markup, or enhanced editions unless the source terms allow reuse.
- Any commentary that has not passed rights and doctrinal review.
