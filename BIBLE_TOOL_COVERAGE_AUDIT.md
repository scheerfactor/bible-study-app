# Bible Tool Coverage Audit

Generated: 2026-07-04T20:00:32.473Z

This audit measures Bible-wide readiness for the study tools: Webster 1828 lookup, Strong's KJV word mappings, TSK cross references, and Nave's Topical Bible. It is intentionally conservative: rough OCR or unreviewed data should stay visible as a review need, not as finished polish.

## Current Coverage

- Bible text: 66 books, 1189 chapters, 31102 verses.
- KJV words measured: 792,215 tokens, 12,449 unique words, 12,376 meaningful unique words after common-word filtering.
- Webster 1828: 7,520/12,376 meaningful KJV words have a lookup candidate (60.8%).
- Combined word/topic lookup: 10,368/12,376 meaningful KJV words have Webster, Easton, or Nave help (83.8%).
- Strong's lexicon: 14,288 entries available; reviewed KJV mappings cover 366/1189 chapters and 10,503 source verses.
- Strong's KJV word mapping: 6,948/12,376 meaningful KJV words appear in reviewed mapping batches (56.1%).
- TSK: 6,110 public rows cover 1185/1189 chapters (99.7%).
- Nave: 4,674 cleaned topic records, 3,862 with extracted Scripture references.

## What This Means

- Webster is broad enough for most Bible-word lookup, but some high-use entries still need OCR cleanup before the reader feels polished.
- Strong's dictionaries are broad, but full word-by-word KJV mapping is not complete across every Bible verse yet.
- TSK is reviewed and clean where present, but still needs expansion by weakest Bible books and source verses.
- Nave is useful for topic discovery now, with records still marked for spot review before quoting.

## Fast Clean Completion Path

1. Finish coverage audits first, then import by weakest gaps instead of guessing.
2. For Webster, add reviewed overrides for the most-used missing or messy KJV words first.
3. For Strong's, continue importing reviewed CrossWire KJV mapping batches by whole Bible books, while keeping rights and attribution notes attached.
4. For TSK, generate reviewed batches from books with the lowest chapter coverage.
5. For Nave, expose only cleaned topic records with references; keep rough OCR hidden until reviewed.

## Top Webster Words Needing Definition Review

| Word | Count | Sample References |
| --- | ---: | --- |
| israel | 2576 | Genesis 32:28; Genesis 32:32; Genesis 33:20; Genesis 34:7; Genesis 35:10 |
| david | 1064 | Ruth 4:17; Ruth 4:22; 1 Samuel 16:13; 1 Samuel 16:19; 1 Samuel 16:20 |
| jesus | 984 | Matthew 1:1; Matthew 1:16; Matthew 1:18; Matthew 1:21; Matthew 1:25 |
| moses | 847 | Exodus 2:10; Exodus 2:11; Exodus 2:14; Exodus 2:15; Exodus 2:15 |
| judah | 826 | Genesis 29:35; Genesis 35:23; Genesis 37:26; Genesis 38:1; Genesis 38:2 |
| jerusalem | 814 | Joshua 10:1; Joshua 10:3; Joshua 10:5; Joshua 10:23; Joshua 12:10 |
| egypt | 611 | Genesis 12:10; Genesis 12:11; Genesis 12:14; Genesis 13:1; Genesis 13:10 |
| how | 543 | Genesis 26:9; Genesis 27:20; Genesis 28:17; Genesis 30:29; Genesis 30:29 |
| years | 539 | Genesis 1:14; Genesis 5:3; Genesis 5:4; Genesis 5:5; Genesis 5:6 |
| saul | 420 | Genesis 36:37; Genesis 36:38; 1 Samuel 9:2; 1 Samuel 9:3; 1 Samuel 9:3 |
| altar | 378 | Genesis 8:20; Genesis 8:20; Genesis 12:7; Genesis 12:8; Genesis 13:4 |
| jacob | 377 | Genesis 25:26; Genesis 25:27; Genesis 25:28; Genesis 25:29; Genesis 25:30 |
| year | 369 | Genesis 7:11; Genesis 8:13; Genesis 14:4; Genesis 14:5; Genesis 17:21 |
| woman | 367 | Genesis 2:22; Genesis 2:23; Genesis 3:1; Genesis 3:2; Genesis 3:4 |
| congregation | 364 | Exodus 12:3; Exodus 12:6; Exodus 12:19; Exodus 12:47; Exodus 16:1 |
| aaron | 350 | Exodus 4:14; Exodus 4:27; Exodus 4:28; Exodus 4:29; Exodus 4:30 |
| solomon | 304 | 2 Samuel 5:14; 2 Samuel 12:24; 1 Kings 1:10; 1 Kings 1:11; 1 Kings 1:12 |
| babylon | 294 | 2 Kings 17:24; 2 Kings 17:30; 2 Kings 20:12; 2 Kings 20:14; 2 Kings 20:17 |
| pharaoh | 279 | Genesis 12:15; Genesis 12:15; Genesis 12:15; Genesis 12:17; Genesis 12:18 |
| power | 272 | Genesis 31:6; Genesis 31:29; Genesis 32:28; Genesis 49:3; Exodus 9:16 |
| philistines | 254 | Genesis 21:32; Genesis 21:34; Genesis 26:1; Genesis 26:8; Genesis 26:14 |
| abraham | 250 | Genesis 17:5; Genesis 17:9; Genesis 17:15; Genesis 17:17; Genesis 17:18 |
| joseph | 250 | Genesis 30:24; Genesis 30:25; Genesis 33:2; Genesis 33:7; Genesis 35:24 |
| inheritance | 239 | Genesis 31:14; Genesis 48:6; Exodus 15:17; Exodus 34:9; Leviticus 25:46 |
| wine | 231 | Genesis 9:21; Genesis 9:24; Genesis 14:18; Genesis 19:32; Genesis 19:33 |
| ark | 230 | Genesis 6:14; Genesis 6:14; Genesis 6:15; Genesis 6:16; Genesis 6:16 |
| beth | 225 | Genesis 12:8; Genesis 12:8; Genesis 13:3; Genesis 13:3; Genesis 28:19 |
| joshua | 216 | Exodus 17:9; Exodus 17:10; Exodus 17:13; Exodus 17:14; Exodus 24:13 |
| tree | 201 | Genesis 1:11; Genesis 1:12; Genesis 1:29; Genesis 1:29; Genesis 2:9 |
| jordan | 197 | Genesis 13:10; Genesis 13:11; Genesis 32:10; Genesis 50:10; Genesis 50:11 |

## Top KJV Words Still Without Any Study Lookup

| Word | Count | Sample References |
| --- | ---: | --- |
| true | 81 | Genesis 42:11; Genesis 42:19; Genesis 42:31; Genesis 42:33; Genesis 42:34 |
| sware | 78 | Genesis 21:31; Genesis 24:7; Genesis 24:9; Genesis 25:33; Genesis 26:3 |
| greater | 77 | Genesis 1:16; Genesis 4:13; Genesis 39:9; Genesis 41:40; Genesis 48:19 |
| precious | 76 | Genesis 24:53; Deuteronomy 33:13; Deuteronomy 33:14; Deuteronomy 33:14; Deuteronomy 33:15 |
| branches | 75 | Genesis 40:10; Genesis 40:12; Genesis 49:22; Exodus 25:31; Exodus 25:32 |
| moved | 75 | Genesis 1:2; Genesis 7:21; Deuteronomy 32:21; Joshua 10:21; Joshua 15:18 |
| womb | 71 | Genesis 25:23; Genesis 25:24; Genesis 29:31; Genesis 30:2; Genesis 30:22 |
| favour | 70 | Genesis 18:3; Genesis 30:27; Genesis 39:21; Exodus 3:21; Exodus 11:3 |
| since | 70 | Genesis 30:30; Genesis 44:28; Genesis 46:30; Exodus 4:10; Exodus 5:23 |
| worshipped | 70 | Genesis 24:26; Genesis 24:48; Genesis 24:52; Exodus 4:31; Exodus 12:27 |
| abundance | 68 | Deuteronomy 28:47; Deuteronomy 33:19; 1 Samuel 1:16; 2 Samuel 12:30; 1 Kings 1:19 |
| afterward | 66 | Genesis 10:18; Genesis 15:14; Genesis 32:20; Genesis 38:30; Exodus 5:1 |
| thereon | 66 | Genesis 35:14; Genesis 35:14; Exodus 17:12; Exodus 20:24; Exodus 20:26 |
| soon | 65 | Genesis 18:33; Genesis 27:30; Genesis 44:3; Exodus 2:18; Exodus 9:29 |
| asses | 64 | Genesis 12:16; Genesis 12:16; Genesis 24:35; Genesis 30:43; Genesis 32:5 |
| howbeit | 64 | Judges 4:17; Judges 11:28; Judges 16:22; Judges 18:29; Judges 21:18 |
| smitten | 63 | Exodus 7:25; Exodus 9:31; Exodus 9:32; Exodus 22:2; Numbers 14:42 |
| always | 62 | Genesis 6:3; Exodus 27:20; Exodus 28:38; Deuteronomy 5:29; Deuteronomy 6:24 |
| abram | 61 | Genesis 11:26; Genesis 11:27; Genesis 11:29; Genesis 11:29; Genesis 11:31 |
| ran | 61 | Genesis 18:2; Genesis 18:7; Genesis 24:17; Genesis 24:20; Genesis 24:28 |
| syrians | 61 | 2 Samuel 8:5; 2 Samuel 8:5; 2 Samuel 8:6; 2 Samuel 8:13; 2 Samuel 10:6 |
| horsemen | 59 | Genesis 50:9; Exodus 14:9; Exodus 14:17; Exodus 14:18; Exodus 14:23 |
| lieth | 59 | Genesis 4:7; Genesis 49:25; Exodus 22:19; Leviticus 6:3; Leviticus 14:47 |
| raise | 59 | Genesis 38:8; Exodus 23:1; Deuteronomy 18:15; Deuteronomy 18:18; Deuteronomy 25:7 |
| weight | 58 | Genesis 24:22; Genesis 24:22; Genesis 43:21; Exodus 30:34; Leviticus 19:35 |
| dealt | 57 | Genesis 16:6; Genesis 33:11; Genesis 43:6; Exodus 1:20; Exodus 14:11 |
| raiment | 57 | Genesis 24:53; Genesis 27:15; Genesis 27:27; Genesis 28:20; Genesis 41:14 |
| dost | 56 | Genesis 32:29; Genesis 44:4; Deuteronomy 9:5; Deuteronomy 24:10; Deuteronomy 24:11 |
| redeem | 56 | Exodus 6:6; Exodus 13:13; Exodus 13:13; Exodus 13:13; Exodus 13:15 |
| graven | 55 | Exodus 20:4; Exodus 32:16; Exodus 39:6; Exodus 39:6; Leviticus 26:1 |

## Top Webster Entries Needing OCR Cleanup

| Word | Webster Headword | Count | Review Status |
| --- | --- | ---: | --- |
| lord | LORD | 7964 | ocr_full_import_needs_spot_review |
| all | ALL | 5620 | ocr_full_import_needs_spot_review |
| god | GOD | 4472 | ocr_full_import_needs_spot_review |
| which | WHICH | 4413 | ocr_full_import_needs_spot_review |
| will | WILL | 3837 | ocr_full_import_needs_spot_review |
| when | WHEN | 2834 | ocr_full_import_needs_spot_review |
| this | THI'S | 2785 | ocr_full_import_needs_spot_review |
| out | OUT | 2775 | ocr_full_import_needs_spot_review |
| man | MAN | 2736 | ocr_full_import_needs_spot_review |
| king | KING | 2540 | ocr_full_import_needs_spot_review |
| son | SON | 2392 | ocr_full_import_needs_spot_review |
| then | THEN | 2168 | ocr_full_import_needs_spot_review |
| people | PEOPLE | 2143 | ocr_full_import_needs_spot_review |
| came | CAME | 2093 | ocr_full_import_needs_spot_review |
| house | HOUSE | 2023 | ocr_full_import_needs_spot_review |
| into | IN'TO | 2015 | ocr_full_import_needs_spot_review |
| come | COME | 1971 | ocr_full_import_needs_spot_review |
| children | CHIL'DREN | 1822 | ocr_full_import_needs_spot_review |
| before | BEFO'RE | 1796 | ocr_full_import_needs_spot_review |
| day | DAY | 1739 | ocr_full_import_needs_spot_review |
| land | LAND | 1717 | ocr_full_import_needs_spot_review |
| men | MEN | 1677 | ocr_full_import_needs_spot_review |
| against | AGAINST | 1667 | ocr_full_import_needs_spot_review |
| let | LET | 1511 | ocr_full_import_needs_spot_review |
| hand | HAND | 1468 | ocr_full_import_needs_spot_review |
| made | MADE | 1406 | ocr_full_import_needs_spot_review |
| went | WENT | 1400 | ocr_full_import_needs_spot_review |
| even | E'VEN | 1393 | ocr_full_import_needs_spot_review |
| now | NOW | 1356 | ocr_full_import_needs_spot_review |
| behold | BEHO'LD | 1326 | ocr_full_import_needs_spot_review |

## Weakest Strong's Mapping Books

| Book | Chapters Mapped | Total Chapters | Chapter Coverage | Mapped Verses | Rows |
| --- | ---: | ---: | ---: | ---: | ---: |
| Numbers | 0 | 36 | 0% | 0 | 0 |
| Deuteronomy | 0 | 34 | 0% | 0 | 0 |
| Joshua | 0 | 24 | 0% | 0 | 0 |
| Judges | 0 | 21 | 0% | 0 | 0 |
| Ruth | 0 | 4 | 0% | 0 | 0 |
| 1 Samuel | 0 | 31 | 0% | 0 | 0 |
| 2 Samuel | 0 | 24 | 0% | 0 | 0 |
| 1 Kings | 0 | 22 | 0% | 0 | 0 |
| 2 Kings | 0 | 25 | 0% | 0 | 0 |
| 1 Chronicles | 0 | 29 | 0% | 0 | 0 |
| 2 Chronicles | 0 | 36 | 0% | 0 | 0 |
| Ezra | 0 | 10 | 0% | 0 | 0 |
| Nehemiah | 0 | 13 | 0% | 0 | 0 |
| Esther | 0 | 10 | 0% | 0 | 0 |
| Job | 0 | 42 | 0% | 0 | 0 |
| Proverbs | 0 | 31 | 0% | 0 | 0 |
| Ecclesiastes | 0 | 12 | 0% | 0 | 0 |
| Solomon's Song | 0 | 8 | 0% | 0 | 0 |
| Jeremiah | 0 | 52 | 0% | 0 | 0 |
| Lamentations | 0 | 5 | 0% | 0 | 0 |

## Weakest TSK Books

| Book | Chapters With TSK | Total Chapters | Chapter Coverage | Source Verses | Rows |
| --- | ---: | ---: | ---: | ---: | ---: |
| Genesis | 48 | 50 | 96% | 65 | 193 |
| Numbers | 35 | 36 | 97.2% | 68 | 142 |
| Exodus | 39 | 40 | 97.5% | 49 | 119 |
| Habakkuk | 3 | 3 | 100% | 9 | 12 |
| Nahum | 3 | 3 | 100% | 8 | 14 |
| Titus | 3 | 3 | 100% | 7 | 14 |
| Jonah | 4 | 4 | 100% | 9 | 15 |
| 2 Timothy | 4 | 4 | 100% | 10 | 15 |
| Ruth | 4 | 4 | 100% | 8 | 17 |
| 1 John | 5 | 5 | 100% | 10 | 21 |
| Micah | 7 | 7 | 100% | 8 | 22 |
| Jude | 1 | 1 | 100% | 12 | 23 |
| Obadiah | 1 | 1 | 100% | 12 | 24 |
| 1 Timothy | 6 | 6 | 100% | 12 | 24 |
| Philemon | 1 | 1 | 100% | 12 | 24 |
| 2 John | 1 | 1 | 100% | 12 | 24 |
| 3 John | 1 | 1 | 100% | 12 | 24 |
| Haggai | 2 | 2 | 100% | 13 | 25 |
| Esther | 10 | 10 | 100% | 11 | 28 |
| Ezra | 10 | 10 | 100% | 11 | 31 |

## Top KJV Words Without Reviewed Strong's Mapping Yet

| Word | Count | Sample References |
| --- | ---: | --- |
| joshua | 216 | Exodus 17:9; Exodus 17:10; Exodus 17:13; Exodus 17:14; Exodus 24:13 |
| joab | 145 | 1 Samuel 26:6; 2 Samuel 2:13; 2 Samuel 2:14; 2 Samuel 2:14; 2 Samuel 2:18 |
| jonathan | 121 | Judges 18:30; 1 Samuel 13:2; 1 Samuel 13:3; 1 Samuel 13:16; 1 Samuel 13:22 |
| suburbs | 115 | Leviticus 25:34; Numbers 35:2; Numbers 35:3; Numbers 35:4; Numbers 35:5 |
| absalom | 108 | 2 Samuel 3:3; 2 Samuel 13:1; 2 Samuel 13:4; 2 Samuel 13:20; 2 Samuel 13:20 |
| bullock | 107 | Exodus 29:1; Exodus 29:3; Exodus 29:10; Exodus 29:10; Exodus 29:11 |
| ahab | 94 | 1 Kings 16:28; 1 Kings 16:29; 1 Kings 16:29; 1 Kings 16:30; 1 Kings 16:33 |
| jehoshaphat | 85 | 2 Samuel 8:16; 2 Samuel 20:24; 1 Kings 4:3; 1 Kings 4:17; 1 Kings 15:24 |
| atonement | 81 | Exodus 29:33; Exodus 29:36; Exodus 29:36; Exodus 29:37; Exodus 30:10 |
| skin | 77 | Exodus 22:27; Exodus 29:14; Exodus 34:29; Exodus 34:30; Exodus 34:35 |
| lebanon | 71 | Deuteronomy 1:7; Deuteronomy 3:25; Deuteronomy 11:24; Joshua 1:4; Joshua 9:1 |
| elijah | 69 | 1 Kings 17:1; 1 Kings 17:13; 1 Kings 17:15; 1 Kings 17:16; 1 Kings 17:18 |
| acts | 66 | Deuteronomy 11:3; Deuteronomy 11:7; Judges 5:11; Judges 5:11; 1 Samuel 12:7 |
| abner | 63 | 1 Samuel 14:50; 1 Samuel 14:51; 1 Samuel 17:55; 1 Samuel 17:55; 1 Samuel 17:55 |
| zedekiah | 62 | 1 Kings 22:11; 1 Kings 22:24; 2 Kings 24:17; 2 Kings 24:18; 2 Kings 24:20 |
| mordecai | 60 | Ezra 2:2; Nehemiah 7:7; Esther 2:5; Esther 2:7; Esther 2:10 |
| jehu | 59 | 1 Kings 16:1; 1 Kings 16:7; 1 Kings 16:12; 1 Kings 19:16; 1 Kings 19:17 |
| elisha | 58 | 1 Kings 19:16; 1 Kings 19:17; 1 Kings 19:19; 2 Kings 2:1; 2 Kings 2:2 |
| esther | 56 | Esther 2:7; Esther 2:8; Esther 2:10; Esther 2:11; Esther 2:15 |
| sockets | 54 | Exodus 26:19; Exodus 26:19; Exodus 26:19; Exodus 26:21; Exodus 26:21 |
| haman | 53 | Esther 3:1; Esther 3:2; Esther 3:4; Esther 3:5; Esther 3:5 |
| josiah | 53 | 1 Kings 13:2; 2 Kings 21:24; 2 Kings 21:26; 2 Kings 22:1; 2 Kings 22:3 |
| zadok | 53 | 2 Samuel 8:17; 2 Samuel 15:24; 2 Samuel 15:25; 2 Samuel 15:27; 2 Samuel 15:29 |
| ephod | 52 | Exodus 25:7; Exodus 28:4; Exodus 28:6; Exodus 28:8; Exodus 28:12 |
| jehoiada | 52 | 2 Samuel 8:18; 2 Samuel 20:23; 2 Samuel 23:20; 2 Samuel 23:22; 1 Kings 1:8 |
| cedar | 51 | Leviticus 14:4; Leviticus 14:6; Leviticus 14:49; Leviticus 14:51; Leviticus 14:52 |
| blue | 50 | Exodus 25:4; Exodus 26:1; Exodus 26:4; Exodus 26:31; Exodus 26:36 |
| rehoboam | 50 | 1 Kings 11:43; 1 Kings 12:1; 1 Kings 12:3; 1 Kings 12:6; 1 Kings 12:12 |
| beauty | 49 | Exodus 28:2; Exodus 28:40; 2 Samuel 1:19; 2 Samuel 14:25; 1 Chronicles 16:29 |
| gibeah | 48 | Joshua 15:57; Judges 19:12; Judges 19:13; Judges 19:14; Judges 19:15 |

## Top KJV Words Without Exact Nave Topic Yet

| Word | Count | Sample References |
| --- | ---: | --- |
| all | 5620 | Genesis 1:26; Genesis 1:29; Genesis 2:1; Genesis 2:2; Genesis 2:3 |
| which | 4413 | Genesis 1:7; Genesis 1:7; Genesis 1:21; Genesis 1:29; Genesis 1:29 |
| said | 3999 | Genesis 1:3; Genesis 1:6; Genesis 1:9; Genesis 1:11; Genesis 1:14 |
| thee | 3827 | Genesis 3:11; Genesis 3:11; Genesis 3:15; Genesis 3:16; Genesis 3:17 |
| when | 2834 | Genesis 2:4; Genesis 3:6; Genesis 4:8; Genesis 4:12; Genesis 5:2 |
| this | 2785 | Genesis 2:23; Genesis 3:13; Genesis 3:14; Genesis 4:14; Genesis 5:1 |
| out | 2775 | Genesis 2:9; Genesis 2:10; Genesis 2:19; Genesis 2:23; Genesis 3:19 |
| upon | 2747 | Genesis 1:2; Genesis 1:2; Genesis 1:11; Genesis 1:15; Genesis 1:17 |
| there | 2299 | Genesis 1:3; Genesis 1:3; Genesis 1:6; Genesis 1:14; Genesis 1:30 |
| hath | 2263 | Genesis 1:20; Genesis 3:1; Genesis 3:3; Genesis 4:11; Genesis 4:25 |
| then | 2168 | Genesis 3:5; Genesis 4:26; Genesis 8:9; Genesis 12:6; Genesis 13:7 |
| came | 2093 | Genesis 4:3; Genesis 4:8; Genesis 6:1; Genesis 6:4; Genesis 7:10 |
| into | 2015 | Genesis 2:7; Genesis 2:10; Genesis 2:15; Genesis 6:18; Genesis 6:19 |
| come | 1971 | Genesis 4:14; Genesis 6:13; Genesis 6:18; Genesis 6:20; Genesis 7:1 |
| one | 1969 | Genesis 1:9; Genesis 2:21; Genesis 2:24; Genesis 3:6; Genesis 3:22 |
| before | 1796 | Genesis 2:5; Genesis 2:5; Genesis 6:11; Genesis 6:13; Genesis 7:1 |
| also | 1769 | Genesis 1:16; Genesis 2:9; Genesis 3:6; Genesis 3:18; Genesis 3:21 |
| men | 1677 | Genesis 4:26; Genesis 6:1; Genesis 6:2; Genesis 6:4; Genesis 6:4 |
| against | 1667 | Genesis 4:8; Genesis 14:15; Genesis 15:10; Genesis 16:12; Genesis 16:12 |
| shalt | 1617 | Genesis 2:17; Genesis 2:17; Genesis 3:14; Genesis 3:14; Genesis 3:15 |
| saying | 1445 | Genesis 1:22; Genesis 2:16; Genesis 3:17; Genesis 5:29; Genesis 8:15 |
| made | 1406 | Genesis 1:7; Genesis 1:16; Genesis 1:16; Genesis 1:25; Genesis 1:31 |
| went | 1400 | Genesis 2:6; Genesis 2:10; Genesis 4:16; Genesis 7:7; Genesis 7:9 |
| even | 1393 | Genesis 6:17; Genesis 9:3; Genesis 10:9; Genesis 10:19; Genesis 10:21 |
| now | 1356 | Genesis 2:23; Genesis 3:1; Genesis 3:22; Genesis 4:11; Genesis 10:1 |
| behold | 1326 | Genesis 1:29; Genesis 1:31; Genesis 3:22; Genesis 4:14; Genesis 6:12 |
| saith | 1262 | Genesis 22:16; Genesis 32:4; Genesis 41:55; Genesis 44:7; Genesis 45:9 |
| every | 1238 | Genesis 1:21; Genesis 1:21; Genesis 1:25; Genesis 1:26; Genesis 1:28 |
| therefore | 1237 | Genesis 2:24; Genesis 3:23; Genesis 4:15; Genesis 11:9; Genesis 12:12 |
| these | 1225 | Genesis 2:4; Genesis 6:9; Genesis 9:19; Genesis 10:1; Genesis 10:5 |

## Safety Rules

- Do not expose unreviewed OCR as finished dictionary prose.
- Do not mark Strong's verse mapping complete until every book has reviewed mapping rows.
- Do not import broad TSK or Strong's dumps without source, license, attribution, and parser validation.
- Keep Nave topic records as discovery/search aids until topic text has been spot-reviewed.

