# Public-Domain Content Acquisition Queue

This queue is for the next content pass after the permission emails. It is not an import batch.

## Rules

- Import only after source, edition, rights status, parser quality, and duplicate status are checked.
- Prefer attaching audio to an existing work card instead of creating duplicate audiobook cards.
- Preserve source URLs and rights evidence for every resource.
- Keep commentary and study helps secondary to Scripture.
- Do not import YouTube mirrors, unclear scans, or modern copyrighted sermons without permission.

## Immediate Book Candidate

| Title | Author | Source | Rights Evidence | Duplicate Status | Next Action |
| --- | --- | --- | --- | --- | --- |
| Why I Preach the Second Coming | Isaac Massey Haldeman | Project Gutenberg `https://www.gutenberg.org/ebooks/30573` | Project Gutenberg lists the ebook as public domain in the USA. | Not found in current title/author check | Add to the next small import batch after doctrinal/source review. |

## Immediate Audio Candidates

These should become listen options on existing works where possible.

| Title | Author | Source | Runtime / Size Note | Existing Library Match | Next Action |
| --- | --- | --- | --- | --- | --- |
| How to Pray | R. A. Torrey | LibriVox `https://librivox.org/how-to-pray-by-reuben-archer-torrey/` | 2:39:48 / 75 MB zip | Text likely already present or closely matched | Attach audiobook metadata to existing work if matched. |
| With Christ in the School of Prayer | Andrew Murray | LibriVox `https://librivox.org/with-christ-in-the-school-of-prayer-by-andrew-murray/` | 7:40:11 / 215.7 MB zip | Found in existing library check | Attach audiobook metadata to existing work. |
| Around the Wicket Gate | C. H. Spurgeon | LibriVox `https://librivox.org/around-the-wicket-gate-by-charles-h-spurgeon/` | 2:08:32 / 60 MB zip | Found in existing library check | Attach audiobook metadata to existing work. |
| C. H. Spurgeon's Prayers | C. H. Spurgeon | LibriVox `https://librivox.org/prayers-by-charles-h-spurgeon/` | Needs file review | Found in existing library check | Attach to Prayer and Spurgeon collection. |
| Practical Religion | J. C. Ryle | LibriVox `https://librivox.org/practical-religion-by-j-c-ryle/` | 19:19:05 / 544 MB zip | Found in existing library check | Treat as larger audiobook test after small pilots. |
| Old Paths | J. C. Ryle | LibriVox `https://librivox.org/old-paths-by-j-c-ryle/` | Needs file review | Found in existing library check | Attach to Ryle collection. |
| Spurgeon's Sermons May 1858 | C. H. Spurgeon | LibriVox `https://librivox.org/spurgeons-sermons-may-1858-by-charles-spurgeon/` | Sermon-series audio | Needs sermon-series matching, not a duplicate book card | Add as sermon audio candidate, preserving sermon titles. |
| The Autobiography of Charles H. Spurgeon, Volume 1 | C. H. Spurgeon | LibriVox `https://librivox.org/the-autobiography-of-charles-h-spurgeon-volume-1-by-charles-h-spurgeon/` | Needs file review | Check for text work/volume grouping | Attach to Spurgeon author page and preacher path. |

LibriVox catalog pages state that recordings are public domain in the USA. Still verify the exact item, edition, and metadata before rehosting files in R2.

## Commentary Candidates

Do not start with broad new commentary sets until the existing review backlog is checked. The next clean path is:

1. Continue promoted public-domain Pulpit Commentary chapters where source metadata is already present.
2. Continue Biblical Illustrator chapters already staged or source-reviewed.
3. Continue Matthew Poole only where source/edition quality is documented.
4. Keep modern or unclear sources in review only.

## Next Practical Batch

Recommended first batch:

1. Add `Why I Preach the Second Coming` as a small book import candidate.
2. Add audiobook metadata for `How to Pray`.
3. Add audiobook metadata for `Around the Wicket Gate`.
4. Add audiobook metadata for `With Christ in the School of Prayer`.
5. Add sermon-audio metadata for `Spurgeon's Sermons May 1858`.

This gives one book, three audiobooks, and one sermon-series pilot without bloating the app or duplicating visible resource cards.
