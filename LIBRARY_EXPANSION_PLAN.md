# Library Expansion Plan

Father's Business Bible Study should grow the Library carefully: public-domain first, rights documented, doctrinal review visible, and resources curated instead of dumped into the app.

## Public-Domain Imports Approved Now

These resources are approved for shared Library import because source and rights metadata are documented in `data/library/manifests/curated-public-domain-resources.json`.

- John Bunyan: The Pilgrim's Progress, The Holy War, Grace Abounding to the Chief of Sinners, Life and Death of Mr. Badman, The Riches of Bunyan, An Exhortation to Peace and Unity, The Jerusalem Sinner Saved, The Heavenly Footman, The Pharisee and the Publican, Miscellaneous Pieces.
- E. M. Bounds: Power Through Prayer, Preacher and Prayer, Purpose in Prayer, Prayer and Praying Men, The Reality of Prayer, Essentials of Prayer.
- Andrew Murray: Holy in Christ, Humility, Jesus Himself, Lord Teach Us To Pray, The Master's Indwelling, The Ministry of Intercession, Money, Absolute Surrender.
- R. A. Torrey: How to Bring Men to Christ, How to Succeed in the Christian Life, The Person and Work of the Holy Spirit, The Fundamental Doctrines of the Christian Faith.
- C. H. Spurgeon: Around the Wicket Gate, Gleanings among the Sheaves, Talks to Farmers, The Art of Illustration.
- J. C. Ryle: Practical Religion, The Cross, A Sketch of the Life and Labors of George Whitefield.
- D. L. Moody: The Way to God, The Overcoming Life, Moody's Stories, Moody's Anecdotes and Illustrations, Secret Power, That Gospel Sermon on the Blessed Hope, Wondrous Love, Sovereign Grace, Weighed and Wanting, Pleasure & Profit in Bible Study, Prevailing Prayer, Bible Characters.
- J. Hudson Taylor: A Retrospect, Separation and Service, Union and Communion, A Ribband of Blue, Unfailing Springs.
- F. B. Meyer: Love to the Uttermost, John the Baptist.
- Prayer and missions: The Life of Trust, Answers to Prayer, George Muller of Bristol, The Preaching Tours and Missionary Labours of George Muller, George Muller's Narrative Parts 1-4, The Life of Adoniram Judson, The Ministry of the Spirit, The Biography of Robert Murray M'Cheyne, The Wonders of Prayer.
- Study helps: Easton's Bible Dictionary, Smith's Comprehensive Dictionary of the Bible, Nave's Topical Bible.

Batch 2 brings the verified shared Library to 71 resources. The app should continue toward 75-100 resources only by adding clearly sourced public-domain texts or reviewed source manifests.

Phase 3 brings the verified shared Library to 201 resources by adding 73 additional Project Gutenberg-backed texts through `data/library/bulk-import-phase-3.csv`. This batch focuses on public-domain commentary volumes, missions and missionary biographies, Baptist history, dictionaries/reference works, prayer, preaching/teaching, and Bible study helps. Seven candidates were skipped by duplicate title or source detection and were not added again.

Phase 3 added meaningful growth in:

- Commentaries and expository works, including Expositor's Bible volumes, Preacher's Complete Homiletic Commentary volumes, and selected public-domain New Testament/Old Testament studies.
- Missions and biographies, including Mary Slessor, David Brainerd, the Judsons, Robert Moffat, Henry Martyn, Hudson Taylor-related work, and other missionary-history resources.
- Baptist history, including Roger Williams and public-domain Baptist history/reference works.
- Dictionaries and reference works, including Richard Watson's Biblical and Theological Dictionary and Greenfield's Greek-English Lexicon to the New Testament.
- Prayer and preaching resources, including Quiet Talks on Prayer, Prayers of the Early Church, and selected sermon collections.

Phase 4 brings the verified shared Library to 316 resources by adding 115 additional Project Gutenberg-backed texts through `data/library/bulk-import-phase-4.csv`. This batch focuses on Bible reference, dictionaries, handbooks, surveys, Baptist history, missions biographies, prayer, preaching/teaching, Bible doctrine, and KJV/textual-issues background. One duplicate Baptist Magazine row was skipped by duplicate-title protection and was not imported again.

Phase 4 added meaningful growth in:

- Bible dictionaries/reference and Bible study helps, including Bible atlas, names and places, church dictionaries, Bible history, and Old/New Testament survey material.
- Baptist history and doctrine, including Baptist periodical material, Baptist church manual/history resources, and Baptist author works.
- Missions and missionary biographies, including China, Korea, Japan, India, Syria, Native American missions, Labrador, and missionary school/history resources.
- Prayer classics and prayer testimony, including answered-prayer, model-prayer, and prayer-history resources with discernment labels where needed.
- KJV/textual-issues background, including public-domain New Testament textual criticism and Scripture study works marked for careful historical use.

Phase 5 brings the verified shared Library to 670 resources by adding 130 additional Project Gutenberg-backed texts through `data/library/bulk-import-phase-6.csv`. This batch focuses on Bible tools, geography/history, preaching and teaching helps, Protestant and Baptist-adjacent church history, missions biographies, missionary periodicals, and public-domain study background. The importer reported zero failed downloads, zero skipped rows, zero duplicate titles, zero duplicate source URLs, zero duplicate checksums, and zero rights metadata warnings.

Phase 5 added meaningful growth in:

- Bible tools and study helps, including biblical geography, Bible animals, Bible object lessons, teacher training, and Scripture-history resources.
- Missions and missionary history, including China, Africa, Labrador, Burma, London Missionary Society material, and American Missionary volumes.
- Baptist and church history background, including early American sermon material, Baptist chapel history, Reformation sources, Protestant martyr history, and historical church sourcebooks.
- Preaching and teaching helps, including sermon collections, post-Reformation preacher studies, object lessons, and public-domain teaching resources.
- Historical/theological works marked for careful use where doctrinal perspective differs from the target audience.

## Public-Domain Growth Targets

The next Library growth should stay public-domain first, with rights metadata, doctrinal review metadata, and file-backed resources checked before deploy.

### 300 Resources

- Add another 75-100 verified Project Gutenberg, CCEL, Internet Archive, or similarly clear public-domain resources.
- Prioritize Bible dictionaries/reference, public-domain commentary volumes, prayer, missions, Baptist history, evangelism, and preaching/teaching.
- Keep batches small enough to validate quickly: 25, then 50, then 100 only after QA stays clean.

### 500 Resources

- Expand author shelves and reading paths after the 300-resource foundation remains fast.
- Add more public-domain commentary, Bible survey, Bible handbook, missionary biography, and Baptist history works.
- Move any unusually large text files toward the storage strategy if the Git/Vercel bundle becomes too heavy.

### 1,000 Resources

- Use Supabase Storage or Cloudflare R2 for large books and future media.
- Keep searchable metadata in Supabase Postgres or a dedicated search index.
- Add stronger admin review reports for duplicates, rights warnings, doctrinal notes, shelf counts, and missing files.
- Keep premium/licensed content separate from public-domain imports until written rights are documented.

## Needs-Review Candidates

Do not import these globally until exact source, edition, rights, quality, and doctrinal labels are documented.

- William Kelly.
- F. W. Grant.
- Arno C. Gaebelein.
- J. N. Darby.
- Clarence Larkin.
- John Gill.
- Adam Clarke.
- Albert Barnes.
- John Wesley.
- The Biblical Illustrator.
- The Pulpit Commentary.

## Permission-Needed Resources

- Premium and permission tracking lives in `data/library/manifests/permission-tracker.json` and `data/library/manifests/premium-resource-placeholders.json`.
- John Phillips, J. Vernon McGee, Mark Cahill, David Cloud / Way of Life, S. M. Davis, and modern commentaries/books are admin-only planning placeholders until written permission or license terms are documented.
- David Cloud / Way of Life: permission needed for global app import. Keep as permission-request or personal-use-only placeholder unless written permission exists.
- Halley's Bible Handbook: permission or licensed edition required.
- Unger's Bible Handbook: permission or licensed edition required.
- Modern KJV defense and textual-issue books: permission and doctrinal review required.

## Personal-Use-Only Imports

Future personal imports may allow a signed-in user to upload TXT, EPUB, PDF, or DOCX for private study.

- Personal uploads must be private to that user.
- Do not publish personal uploads to the shared Library.
- Mark user uploads as personal-use-only.
- Keep personal content out of chapter recommendations unless the user explicitly attaches it privately.

## Commentary Priority List

1. Matthew Henry: continue verified public-domain chapter imports from CCEL/Wikisource, with source URLs and rights notes. Phase 4 adds Acts 1-25 as a reviewed public batch.
2. JFB: continue verified public-domain chapter imports from the staged CCEL source. Phase 4 adds Genesis 1-25 as a reviewed public batch.
3. Barnes, Clarke, Wesley: expand only where exact source pages and public-domain statements remain clear.
4. H. A. Ironside: import only exact editions with verified rights/source status.
5. John Gill: keep blocked for expansion until a cleaner original public-domain source is verified.
6. Kelly, Gaebelein, Grant, Darby, The Biblical Illustrator, and The Pulpit Commentary: keep as next-batch candidates until exact editions, source URLs, rights status, and doctrinal labels are verified.

## Amos Prep Priority

- Keep Amos 1-4 Bible-centered as the first teaching-prep workflow, while making Amos 5-9 available for full-book context.
- Keep Matthew Henry collapsed by default and secondary to Scripture.
- Add commentary only from verified public-domain source text.
- Export Amos 1-4 teaching notes with source URL and rights notes.
- Next content improvements: reviewed maps/places for Tekoa, Bethel, Samaria, Damascus, Gaza, Tyre, Edom, Ammon, Moab; then concise Amos 5-9 chapter study notes.

## Import Rules

- Import only resources with documented source URL, rights status, public-domain status, and commercial-use notes.
- Keep required license or Project Gutenberg notices where applicable.
- Do not import resources marked `needs review`, `permission needed`, `personal use only`, or `do not import`.
- Do not import false religion, cult literature, or resources rejected by doctrinal review.
- Add labels such as `Devotional classic`, `Historical value`, `Baptist history`, `Use with discernment`, and `Not all doctrine endorsed` where appropriate.
- Add metadata first, then text file, then validate before deploying.

## App Growth Order

1. Metadata and rights review.
2. Searchable Library listing.
3. Reader quality and listen controls.
4. Chapter recommendations.
5. Teaching export connections.
6. Future storage move for large files and audio.
