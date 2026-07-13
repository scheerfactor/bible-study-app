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
| Why I Preach the Second Coming | Isaac Massey Haldeman | Project Gutenberg `https://www.gutenberg.org/ebooks/30573` | Project Gutenberg lists the ebook as public domain in the USA. | Not found in current title/author check | Imported 2026-07-04 as a verified public-domain Library resource. |

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

## Next 300+ Resource Strategy

The next large expansion should be broken into reviewable batches so the Library remains curated and useful.

### Batch A: Commentary And Bible Study Helps

Target size: 40-75 resources.

Priority:

- Pulpit Commentary volumes not yet represented as Library works
- Biblical Illustrator volumes not yet represented as Library works
- Preacher's Complete Homiletical Commentary volumes
- Lange commentary volumes
- B. H. Carroll English Bible interpretation volumes
- Broadus Gospel and preaching helps
- James M. Gray Bible survey and prophecy helps
- Kelly, Mackintosh, Gaebelein, Ironside, and Scofield only where source and edition are clean

Goal: every Bible book should surface at least a useful commentary shelf, a preaching-help shelf, and a best-next-resource suggestion.

### Batch B: Baptist History And Baptist Authors

Target size: 40-60 resources.

Priority:

- Benjamin Keach
- Thomas Crosby
- Hanserd Knollys
- John Gill
- John Rippon
- John Sutcliff
- Andrew Fuller
- Adoniram Judson
- William Carey
- B. H. Carroll
- John A. Broadus
- John Leadley Dagg
- Baptist histories already identified in the acquisition lists

Goal: make Baptist History a distinctive collection instead of a small shelf.

### Batch C: Prayer, Revival, Evangelism, And Christian Life

Target size: 50-80 resources.

Priority:

- E. M. Bounds
- R. A. Torrey
- Andrew Murray
- D. L. Moody
- George Whitefield public-domain sermons
- Spurgeon evangelistic works
- J. C. Ryle practical Christian living works
- public-domain revival histories and sermon collections

Goal: strengthen daily devotion, prayer meetings, evangelism, and sermon illustration use.

### Batch D: Missions, Biography, And Church History

Target size: 50-80 resources.

Priority:

- William Carey biographies and writings
- Adoniram Judson biographies
- Hudson Taylor and missionary biographies
- missionary gazetteers and mission histories
- Foxe, Wylie, Miller, and other public-domain church history works
- biographies useful for Sunday School and missions emphasis

Goal: give pastors and teachers trustworthy stories, timelines, and applications for missions and church history lessons.

### Batch E: KJV, English Bible History, Dictionaries, And Reference

Target size: 30-60 resources.

Priority:

- public-domain English Bible history
- public-domain KJV and Authorized Version history
- Noah Webster works beyond the 1828 dictionary where useful
- Bible word books
- pronunciation helps
- Bible names and place reference works
- map and chart sources with public-domain status documented

Goal: strengthen KJV study without importing modern copyrighted KJV defense works unless permission is granted.

### Batch F: Audio And Sermon Candidates

Target size: 25-50 metadata records first.

Priority:

- LibriVox audiobooks matched to existing Library cards
- Spurgeon sermon audio series from LibriVox
- Ryle, Torrey, Murray, Bounds, Moody, and missions audiobooks
- public-domain Bible audio pilots only when recording rights are clear
- modern sermon/audio ministries only with written permission

Goal: build listening depth without duplicating books or hosting unclear audio.

## Next Practical Batch

Recommended first batch:

1. Attach audiobook metadata for `How to Pray`.
2. Add audiobook metadata for `Around the Wicket Gate`.
3. Add audiobook metadata for `With Christ in the School of Prayer`.
4. Add sermon-audio metadata for `Spurgeon's Sermons May 1858`.
5. Continue one small verified book import at a time after duplicate and source checks.

This gives one book, three audiobooks, and one sermon-series pilot without bloating the app or duplicating visible resource cards.

## What Not To Add Yet

- Modern copyrighted study Bibles without written permission.
- Modern KJV defense books without written permission.
- Dramatized Bible audio/video unless production rights are clear.
- SermonAudio, YouTube, or Internet Archive mirrors of modern preachers unless rights are documented.
- Store/paid Way of Life resources unless permission is granted.
- Any audio, video, transcript, or cover image whose rights are unclear.
