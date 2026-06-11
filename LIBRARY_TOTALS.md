# Library Totals

Updated during the Bible Coverage + Commentary Depth sprint. Counts are generated from the public Library manifest, public commentary import files, and the current QA commands.

## Running Totals

- Verified public Library resources: 1,261
- Public commentary entries shown in the app: 5,167
- Commentary validation rows checked, including staging/review files: 7,545
- Commentary authors represented publicly: 22+
- Library authors represented: 422+
- Public Library duplicate title/author groups: 0

## Latest Neglected Subjects Sprint

Imported 25 verified public-domain resources from Project Gutenberg and skipped 10 duplicate title/source rows automatically.

Strengthened areas:

- Apologetics and evidences
- Creation/evolution response
- False religion and discernment
- Home and family
- Pastoral ministry
- Sunday School teaching
- Baptist and religious-liberty history
- Academic church history

## Latest Bible Coverage + Commentary Depth Sprint

Added 120 verified public commentary entries for Exodus:

- Matthew Poole, Exodus 1-40
- The Pulpit Commentary, Exodus 1-40
- The Biblical Illustrator, Exodus 1-40

These entries were generated from source pages that state public-domain status, preserve chapter source URLs, and include rights/source notes in each row.

## Library By Category

| Category | Resources |
| --- | ---: |
| Commentaries | 252 |
| Missions | 243 |
| Christian Living | 212 |
| Preaching & Teaching | 163 |
| Bible study helps | 128 |
| Prayer | 79 |
| Baptist History | 50 |
| Evangelism | 46 |
| Bible Handbooks | 19 |
| KJV / Textual Issues | 16 |
| Biographies | 12 |
| Classics | 12 |
| Dictionaries | 11 |
| Christian life | 7 |
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
| Spurgeon Collection | 84 |
| F. B. Meyer Collection | 72 |
| Missions Periodicals | 62 |
| Ryle Collection | 54 |
| Missions | 50 |
| Torrey Collection | 46 |
| Bible Doctrine | 44 |
| Gaebelein Collection | 44 |
| Baptist History | 31 |
| Christian Living | 29 |
| Alexander Maclaren Collection | 26 |
| William Kelly Collection | 23 |
| G. Campbell Morgan Collection | 22 |
| Bible Study Essentials | 20 |
| Andrew Murray Collection | 19 |
| Commentaries | 19 |
| Prayer | 19 |
| Bounds Collection | 18 |
| Moody Collection | 16 |
| Bible Handbooks | 15 |
| Bible study helps | 15 |
| Prayer Classics | 15 |
| Revival & Evangelism | 13 |
| Darby Collection | 11 |
| R. A. Torrey Collection | 10 |
| False Religion & Discernment | 7 |
| Creation & Evolution Response | 4 |
| Apologetics & Evidences | 5 |
| Home & Family | 2 |
| Evangelism | 8 |

## Major Author Shelves

| Author | Resources |
| --- | ---: |
| C. H. Spurgeon | 85+ combined normalized author matches |
| F. B. Meyer | 69+ combined normalized author matches |
| R. A. Torrey | 50+ combined normalized author matches |
| J. C. Ryle | 50+ combined normalized author matches |
| D. L. Moody | 14+ |
| William Kelly | 26+ combined normalized author matches |
| Arno C. Gaebelein | 38+ combined normalized author matches |
| H. A. Ironside | 10+ |
| Andrew Murray | 27+ |
| Edward M. Bounds | 13+ |
| J. N. Darby | 11+ |
| Clarence Larkin | 7+ |
| F. W. Grant | 5+ |

## Commentary By Author

| Author | Public Entries |
| --- | ---: |
| Jamieson-Fausset-Brown | 1,189 |
| Matthew Henry | 1,189 |
| Adam Clarke | 771 |
| Albert Barnes | 771 |
| Joseph S. Exell / Biblical Illustrator | 287 |
| Matthew Poole | 278 |
| Joseph S. Exell and H. D. M. Spence-Jones / Pulpit Commentary | 278 |
| C. H. Spurgeon / Treasury of David | 150 |
| John Wesley | 86 |
| H. A. Ironside | 62 |
| Amos public-domain specialist/sample voices | 9 each |

## Commentary Status

- Matthew Henry and JFB each cover all 66 Bible books at public chapter level.
- Barnes and Adam Clarke have broad public coverage across the current reviewed batches.
- Wesley remains New Testament oriented.
- Gill and Ironside remain sample-only until cleaner source/edition review is complete.
- Pulpit Commentary, Biblical Illustrator, and Matthew Poole now have focused public verified batches where source, edition notes, rights basis, and parser output were documented. Continue importing only in reviewed batches.

## Latest QA Snapshot

- `npm run library:qa`: 1,261 public resources verified, complete, and file-backed.
- `npm run library:validate`: manifest validation passed.
- `npm run validate:commentary`: 89 commentary/review files validated, 7,545 rows checked.

## Next Growth Rule

Grow the Library from verified source records, not broad keyword searches. The next push toward 2,500+ resources should be staged in 50-100 item batches with exact source URLs, duplicate checks, OCR quality labels, and subject shelves so the Library stays enjoyable instead of overwhelming.
