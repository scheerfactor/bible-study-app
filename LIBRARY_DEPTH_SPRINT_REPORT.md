# Library Depth + Commentary Expansion Sprint Report

## Goal

Turn the Library into a deeper Bible study collection without sacrificing rights safety, duplicate control, or usability.

## Current Verified Public Library

- Verified resources: 779
- Library authors: 351
- Major public author collections:
  - C. H. Spurgeon: 27 resources
  - F. B. Meyer: 17 resources
  - R. A. Torrey: 15 resources
  - D. L. Moody: 11 resources
  - William Kelly: 11 resources
  - Arno C. Gaebelein: 10 resources
  - H. A. Ironside: 9 resources
  - Andrew Murray: 8 resources
  - J. C. Ryle: 6 resources
  - Edward M. Bounds: 6 resources
  - J. N. Darby: 5 resources
  - Clarence Larkin: 5 resources
  - F. W. Grant: 2 resources

## Duplicate Audit

The current manifest has no duplicate title/author groups.

Bulk import dry-runs found that the remaining prepared CSV rows are mostly already imported or duplicate by source URL. The only import-ready row in the checked batches, `Prayer and Praying Men` by `E. M. Bounds`, is already represented publicly as `Prayer and Praying Men` by `Edward M. Bounds`, so it was not imported again.

## Commentary Snapshot

- Public commentary entries: 4,016
- Validated commentary/review rows: 6,394
- Public commentary authors:
  - Jamieson-Fausset-Brown: 1,189 entries
  - Matthew Henry: 1,189 entries
  - Adam Clarke: 771 entries
  - Albert Barnes: 771 entries
  - John Wesley: 86 entries
  - John Gill: 7 entries
  - H. A. Ironside: 3 entries

## Commentary Candidates Held For Review

These are still valuable, but should not be public-imported until source, edition, rights, and parser quality are documented:

- The Pulpit Commentary
- The Biblical Illustrator
- Matthew Poole
- H. A. Ironside expansion beyond exact verified editions
- William Kelly chapter-level commentary entries
- J. N. Darby commentary/synopsis entries
- F. W. Grant commentary entries
- Arno C. Gaebelein commentary entries

## Library Discovery Improvements

This sprint added or strengthened:

- Audience labels on public Library cards and detail pages.
- Smarter related-resource ranking by author, collection, category, audience, topic, and reading depth.
- Recommended next resource reasoning on book detail pages.
- Hover/focus preview on cover cards with reading time and recommended use.

## Next Rights-Safe Acquisition Focus

1. Build fresh exact-source candidate rows for the weakest flagship authors:
   - F. W. Grant
   - J. N. Darby
   - J. C. Ryle
   - Edward M. Bounds
   - H. A. Ironside
2. Prefer exact Project Gutenberg or clearly public-domain Archive/CCEL source records.
3. Avoid broad search rows unless a specific title, edition, and source URL are already chosen.
4. For Pulpit Commentary, Biblical Illustrator, and Matthew Poole, stage one pilot chapter first. Do not bulk import.

## QA Requirements Before Deploy

Run:

```bash
npm run library:qa
npm run library:validate
npm run validate:commentary
npm run validate:strongs
npm run lint
npm run build
```

Browser QA:

- Library search
- Author search
- Resource detail page
- Related resources
- Bible Coverage dashboard
- Commentary dashboard
- Mobile 390px layout
