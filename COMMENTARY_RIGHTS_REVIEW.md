# Commentary Rights Review

## Phase 1 Selection

Selected collection: **Matthew Henry's Commentary on the Whole Bible**.

Ironside remains a future candidate, but Phase 1 uses Matthew Henry because the rights path is cleaner and the work covers the requested Old Testament and New Testament passages in one collection.

## Rights Basis

- Author: Matthew Henry
- Life dates: 1662-1714
- Original publication range: 1706-1721
- Public-domain basis: pre-1931 publication and author death more than 100 years ago
- Primary source record: https://en.wikisource.org/wiki/Matthew_Henry%27s_Commentary_on_the_Whole_Bible
- Working source index: https://www.ccel.org/ccel/henry/mhc.html

## Commercial-Use Notes

The underlying commentary is public domain. Digital transcriptions, site formatting, markup, scans, and packaged editions may carry separate terms. Future bulk imports should record the exact source file and avoid copying site-specific formatting unless the source license allows it.

## Doctrinal Review Notes

Matthew Henry is a historic devotional and practical commentary. It should be used with discernment and kept secondary to Scripture. In Father’s Business Bible Study, the display order remains:

1. Bible
2. Webster's 1828
3. TSK
4. People, Places, Types, and Prophecy connections
5. Commentary

## Phase 1 Import Scope

Curated Phase 1 entries are included for:

- Genesis 1-5
- Exodus 1-5
- John 1-5
- Romans 1-8
- Luke 24

The import file is `data/imports/matthew-henry-phase-1-commentary.json`.

## Future Import Recommendation

Before a full Matthew Henry import:

- Select one verified source file.
- Preserve source URL and rights metadata.
- Validate every entry against the local KJV reference index.
- Chunk long entries so the Bible reader is not overwhelmed.
- Keep commentary collapsed or secondary in the reader.
- Review summaries and excerpts for doctrinal clarity and readability.

## Phase 2 Selection

Second commentary voice: **H. A. Ironside Commentary Samples**.

Ironside is a better fit for the target audience as a teacher-friendly, KJV-friendly, dispensational/Bible-conference style voice. Matthew Henry remains the first commentary collection and is not removed.

## Phase 2 Source Review

Verified source paths found:

- `Addresses on the Gospel of John` by H. A. Ironside: https://www.brethrenarchive.org/people/harry-a-ironside/pamphlets/addresses-on-the-gospel-of-john/
- `Lectures on the Epistle to the Romans` by H. A. Ironside: https://www.brethrenarchive.org/media/364659/ironside-h-a-_-epistles-to-the-romans.pdf
- `Addresses on the Gospel of Luke` by H. A. Ironside: https://www.brethrenarchive.org/people/harry-a-ironside/pamphlets/addresses-on-the-gospel-of-luke/
- Ironside writings index for future source tracing: https://www.wholesomewords.org/etexts/ironside/writings.html

Requested but not imported:

- Genesis 1
- Exodus 3

Reason: no verified H. A. Ironside commentary source for Genesis 1 or Exodus 3 was found during Phase 2 review. Do not import modern "Ironside Bible" notes, unsourced excerpts, or secondary site snippets until the exact source and rights are verified.

## Phase 2 Rights Basis

- Romans sample: the source PDF identifies `Lectures on the Epistle to the Romans` by H. A. Ironside, Loizeaux Brothers, first edition 1928. The 1928 first edition is public domain in the United States as of 2026. Avoid later edition additions and scan formatting unless separately reviewed.
- John and Luke samples: source pages are verified at Plymouth Brethren Archive, but full-text import needs a copyright renewal, edition, and source-terms audit before commercial redistribution.
- Phase 2 app entries for John 3 and Luke 24 are curated summaries, not full-text transcriptions.

## Phase 2 Import Scope

Curated Phase 2 entries are included for:

- John 3
- Romans 5
- Luke 24

The import file is `data/imports/h-a-ironside-phase-2-commentary.json`.

The source manifest is `data/commentary/h-a-ironside/source-manifest.json`.

## Phase 2 Display Rules

- Show multiple commentary entries where available.
- Keep commentary collapsed by default in the Study Drawer and Full Study view.
- Display author, source, rights status, recommended use, and commentary text.
- Keep Scripture first, then Webster, TSK, people/places/types, and commentary.

## Full Ironside Import Recommendation

Before any larger Ironside import:

- Verify each exact source file and publication year.
- Check copyright renewal status for works first published after 1928.
- Avoid importing modern edited editions.
- Import a small sample first and validate references.
- Keep all entries tied to source-level rights metadata.
