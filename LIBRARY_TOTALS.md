# Library Totals

Updated during the Library Depth + Commentary Expansion sprint. Counts are generated from the public Library manifest, public commentary import files, and the current QA commands.

## Running Totals

- Verified public Library resources: 779
- Public commentary entries: 4,016
- Commentary validation rows checked, including staging/review files: 6,394
- Commentary authors represented publicly: 7
- Library authors represented: 351
- Public Library duplicate title/author groups: 0

## Library By Category

| Category | Resources |
| --- | ---: |
| Missions | 236 |
| Commentaries | 148 |
| Preaching & Teaching | 97 |
| Christian Living | 95 |
| Bible study helps | 49 |
| Prayer | 40 |
| Baptist History | 31 |
| Bible Handbooks | 19 |
| Biographies | 12 |
| Evangelism | 12 |
| Dictionaries | 11 |
| Christian life | 7 |
| KJV / Textual Issues | 6 |
| Classics | 5 |
| Surveys | 4 |
| Fiction/classics | 2 |
| Preaching/teaching | 2 |
| Topical Bible | 2 |
| Baptist history | 1 |

## Library By Collection

| Collection | Resources |
| --- | ---: |
| Missions Biographies | 128 |
| Commentary | 93 |
| Preaching & Teaching | 87 |
| Missions Periodicals | 62 |
| Missions | 45 |
| Bible Doctrine | 44 |
| Baptist History | 31 |
| Christian Living | 29 |
| Spurgeon Collection | 23 |
| Bible Study Essentials | 20 |
| Commentaries | 19 |
| Prayer | 19 |
| Bible Handbooks | 15 |
| Bible study helps | 15 |
| F. B. Meyer Collection | 15 |
| Prayer Classics | 15 |
| Gaebelein Collection | 10 |
| Evangelism | 8 |
| Biographies | 7 |
| Christian life | 7 |
| William Kelly Collection | 7 |
| Dictionaries | 6 |
| KJV / Textual Issues | 6 |
| R. A. Torrey Collection | 6 |
| Bible Dictionaries | 5 |
| Classics | 5 |
| Darby Collection | 5 |
| Torrey Collection | 5 |
| Bible Surveys | 4 |
| H. A. Ironside Collection | 4 |
| Larkin | 4 |
| William Kelly | 4 |

## Major Author Shelves

| Author | Resources |
| --- | ---: |
| C. H. Spurgeon | 27 |
| F. B. Meyer | 17 |
| R. A. Torrey | 15 |
| D. L. Moody | 11 |
| William Kelly | 11 |
| Arno C. Gaebelein | 10 |
| H. A. Ironside | 9 |
| Andrew Murray | 8 |
| J. C. Ryle | 6 |
| Edward M. Bounds | 6 |
| J. N. Darby | 5 |
| Clarence Larkin | 5 |
| F. W. Grant | 2 |

## Commentary By Author

| Author | Public Entries |
| --- | ---: |
| Jamieson-Fausset-Brown | 1,189 |
| Matthew Henry | 1,189 |
| Adam Clarke | 771 |
| Albert Barnes | 771 |
| John Wesley | 86 |
| John Gill | 7 |
| H. A. Ironside | 3 |

## Commentary Status

- Matthew Henry and JFB each cover all 66 Bible books at public chapter level.
- Barnes and Adam Clarke have broad public coverage across the current reviewed batches.
- Wesley remains New Testament oriented.
- Gill and Ironside remain sample-only until cleaner source/edition review is complete.
- Pulpit Commentary, Biblical Illustrator, and Matthew Poole remain needs-review candidates. No text from those sets should be public until an exact source, edition, rights basis, and parser pilot are documented.

## Latest QA Snapshot

- `npm run library:qa`: 779 public resources verified, complete, and file-backed.
- `npm run library:validate`: manifest validation passed.
- `npm run validate:commentary`: 73 commentary/review files validated, 6,394 rows checked.

## Next Growth Rule

Grow the Library from verified source records, not broad keyword searches. The importer dry-run showed remaining prepared CSV rows are mostly duplicates or duplicate-equivalent works, so future growth should start from a fresh reviewed acquisition list with exact source URLs and no title/author/source/checksum duplicates.
