# Bible Tool Coverage Audit

Generated: 2026-07-16T07:00:55.866Z

This audit measures Bible-wide readiness for the study tools: Webster 1828 lookup, Strong's KJV word mappings, TSK cross references, and Nave's Topical Bible. It is intentionally conservative: rough OCR or unreviewed data should stay visible as a review need, not as finished polish.

## Current Coverage

- Bible text: 66 books, 1189 chapters, 31102 verses.
- KJV words measured: 791,438 tokens, 12,524 unique words, 12,454 meaningful unique words after common-word filtering.
- Webster 1828: 7,968/12,454 meaningful KJV words have a lookup candidate (64%).
- Combined word/topic lookup: 10,922/12,454 meaningful KJV words have Webster, Easton, or Nave help (87.7%).
- Strong's lexicon: 14,296 entries available; reviewed KJV mappings cover 1189/1189 chapters and 31,051 source verses.
- Strong's KJV word mapping: 12,076/12,454 meaningful KJV words appear in reviewed mapping batches (97%).
- Combined word-study help: 12,454/12,454 meaningful KJV words have Webster, Easton, Nave, or reviewed Strong's help (100%).
- TSK: 6,994 public rows cover 1189/1189 chapters (100%).
- TSK remaining chapter gaps: None.
- Nave: 4,674 cleaned topic records, 3,862 with extracted Scripture references.

## What This Means

- Webster is broad enough for most Bible-word lookup, but some high-use entries still need OCR cleanup before the reader feels polished.
- Strong's is chapter-complete; remaining work is rare lexicon edge cases and display polish.
- TSK is chapter-complete; the next work is deepening verse-level coverage and ranking the strongest references first.
- Nave is useful for topic discovery now, with records still marked for spot review before quoting.

## Fast Clean Completion Path

1. Finish coverage audits first, then import by weakest gaps instead of guessing.
2. For Webster, add reviewed overrides for the most-used missing or messy KJV words first.
3. For Strong's, review the few rare unmapped words and missing lexicon cards instead of another broad import.
4. For TSK, deepen verse-level coverage and rank the strongest references first now that every Bible chapter has at least one reviewed reference.
5. For Nave, expose only cleaned topic records with references; keep rough OCR hidden until reviewed.

## Top Webster Words Needing Definition Review

| Word | Count | Sample References |
| --- | ---: | --- |
| israel | 2575 | Genesis 32:28; Genesis 32:32; Genesis 34:7; Genesis 35:10; Genesis 35:10 |
| david | 1064 | Ruth 4:17; Ruth 4:22; 1 Samuel 16:13; 1 Samuel 16:19; 1 Samuel 16:20 |
| jesus | 983 | Matthew 1:1; Matthew 1:16; Matthew 1:18; Matthew 1:21; Matthew 1:25 |
| moses | 847 | Exodus 2:10; Exodus 2:11; Exodus 2:14; Exodus 2:15; Exodus 2:15 |
| judah | 816 | Genesis 29:35; Genesis 35:23; Genesis 37:26; Genesis 38:1; Genesis 38:2 |
| jerusalem | 814 | Joshua 10:1; Joshua 10:3; Joshua 10:5; Joshua 10:23; Joshua 12:10 |
| egypt | 611 | Genesis 12:10; Genesis 12:11; Genesis 12:14; Genesis 13:1; Genesis 13:10 |
| saul | 420 | Genesis 36:37; Genesis 36:38; 1 Samuel 9:2; 1 Samuel 9:3; 1 Samuel 9:3 |
| jacob | 377 | Genesis 25:26; Genesis 25:27; Genesis 25:28; Genesis 25:29; Genesis 25:30 |
| aaron | 350 | Exodus 4:14; Exodus 4:27; Exodus 4:28; Exodus 4:29; Exodus 4:30 |
| solomon | 304 | 2 Samuel 5:14; 2 Samuel 12:24; 1 Kings 1:10; 1 Kings 1:11; 1 Kings 1:12 |
| babylon | 294 | 2 Kings 17:24; 2 Kings 17:30; 2 Kings 20:12; 2 Kings 20:14; 2 Kings 20:17 |
| pharaoh | 273 | Genesis 12:15; Genesis 12:15; Genesis 12:15; Genesis 12:17; Genesis 12:18 |
| philistines | 254 | Genesis 21:32; Genesis 21:34; Genesis 26:1; Genesis 26:8; Genesis 26:14 |
| abraham | 250 | Genesis 17:5; Genesis 17:9; Genesis 17:15; Genesis 17:17; Genesis 17:18 |
| joseph | 250 | Genesis 30:24; Genesis 30:25; Genesis 33:2; Genesis 33:7; Genesis 35:24 |
| joshua | 216 | Exodus 17:9; Exodus 17:10; Exodus 17:13; Exodus 17:14; Exodus 24:13 |
| jordan | 197 | Genesis 13:10; Genesis 13:11; Genesis 32:10; Genesis 50:10; Genesis 50:11 |
| ephraim | 176 | Genesis 41:52; Genesis 46:20; Genesis 48:1; Genesis 48:5; Genesis 48:13 |
| moab | 168 | Genesis 19:37; Genesis 36:35; Exodus 15:15; Numbers 21:11; Numbers 21:13 |
| paul | 162 | Acts 13:9; Acts 13:13; Acts 13:16; Acts 13:43; Acts 13:45 |
| peter | 162 | Matthew 4:18; Matthew 8:14; Matthew 10:2; Matthew 14:28; Matthew 14:29 |
| jeremiah | 147 | 2 Kings 23:31; 2 Kings 24:18; 1 Chronicles 5:24; 1 Chronicles 12:4; 1 Chronicles 12:10 |
| manasseh | 147 | Genesis 41:51; Genesis 46:20; Genesis 48:1; Genesis 48:5; Genesis 48:13 |
| joab | 145 | 1 Samuel 26:6; 2 Samuel 2:13; 2 Samuel 2:14; 2 Samuel 2:14; 2 Samuel 2:18 |
| samuel | 142 | 1 Samuel 1:20; 1 Samuel 2:18; 1 Samuel 2:21; 1 Samuel 2:26; 1 Samuel 3:1 |
| john | 133 | Matthew 3:1; Matthew 3:4; Matthew 3:13; Matthew 3:14; Matthew 4:12 |
| isaac | 132 | Genesis 17:19; Genesis 17:21; Genesis 21:3; Genesis 21:4; Genesis 21:5 |
| hezekiah | 128 | 2 Kings 16:20; 2 Kings 18:1; 2 Kings 18:9; 2 Kings 18:10; 2 Kings 18:13 |
| samaria | 124 | 1 Kings 13:32; 1 Kings 16:24; 1 Kings 16:24; 1 Kings 16:28; 1 Kings 16:29 |

## Top KJV Words Still Without Any Study Lookup

| Word | Count | Sample References |
| --- | ---: | --- |
| forasmuch | 43 | Genesis 41:39; Numbers 10:31; Deuteronomy 12:12; Deuteronomy 17:16; Joshua 17:14 |
| seest | 36 | Genesis 13:15; Genesis 16:13; Genesis 31:43; Exodus 10:28; Deuteronomy 4:19 |
| members | 32 | Job 17:7; Psalms 139:16; Matthew 5:29; Matthew 5:30; Romans 6:13 |
| putteth | 30 | Exodus 30:33; Numbers 22:38; Deuteronomy 25:11; Deuteronomy 27:15; 1 Kings 20:11 |
| hittite | 26 | Genesis 23:10; Genesis 25:9; Genesis 26:34; Genesis 26:34; Genesis 36:2 |
| forsook | 24 | Deuteronomy 32:15; Judges 2:12; Judges 2:13; Judges 10:6; 1 Samuel 31:7 |
| fulfil | 24 | Genesis 29:27; Exodus 5:13; Exodus 23:26; 1 Kings 2:27; 1 Chronicles 22:13 |
| marvellous | 24 | 1 Chronicles 16:12; 1 Chronicles 16:24; Job 5:9; Job 10:16; Psalms 9:1 |
| mizpeh | 23 | Joshua 11:3; Joshua 11:8; Joshua 15:38; Joshua 18:26; Judges 10:17 |
| defence | 22 | Numbers 14:9; 2 Chronicles 11:5; Job 22:25; Psalms 7:10; Psalms 31:2 |
| jubile | 22 | Leviticus 25:9; Leviticus 25:10; Leviticus 25:11; Leviticus 25:12; Leviticus 25:13 |
| setteth | 22 | Numbers 1:51; Numbers 4:5; Deuteronomy 24:15; Deuteronomy 27:16; 2 Samuel 22:34 |
| sinneth | 22 | Numbers 15:28; Numbers 15:28; Numbers 15:29; Deuteronomy 19:15; 1 Kings 8:46 |
| higher | 21 | Numbers 24:7; 1 Samuel 9:2; 1 Samuel 10:23; 2 Kings 15:35; Nehemiah 4:13 |
| husbandmen | 21 | 2 Kings 25:12; 2 Chronicles 26:10; Jeremiah 31:24; Jeremiah 52:16; Joel 1:11 |
| magnified | 21 | Genesis 19:19; Joshua 4:14; 2 Samuel 7:26; 1 Chronicles 17:24; 1 Chronicles 29:25 |
| committeth | 19 | Leviticus 20:10; Leviticus 20:10; Psalms 10:14; Proverbs 6:32; Ezekiel 8:6 |
| denied | 19 | Genesis 18:15; 1 Kings 20:7; Job 31:28; Matthew 26:70; Matthew 26:72 |
| spent | 19 | Genesis 21:15; Genesis 47:18; Leviticus 26:20; Judges 19:11; 1 Samuel 9:7 |
| bade | 18 | Genesis 43:17; Exodus 16:24; Numbers 14:10; Joshua 11:9; Ruth 3:6 |
| basons | 18 | Exodus 24:6; Exodus 27:3; Exodus 38:3; Numbers 4:14; 2 Samuel 17:28 |
| intreated | 18 | Genesis 25:21; Genesis 25:21; Exodus 8:30; Exodus 10:18; Judges 13:8 |
| bondmen | 17 | Genesis 43:18; Genesis 44:9; Leviticus 25:42; Leviticus 25:44; Leviticus 25:44 |
| crieth | 17 | Genesis 4:10; Exodus 22:27; Job 24:12; Psalms 72:12; Psalms 84:2 |
| divisions | 17 | Joshua 11:23; Joshua 12:7; Joshua 18:10; Judges 5:15; Judges 5:16 |
| threshingfloor | 17 | Genesis 50:10; Numbers 15:20; Numbers 18:27; Numbers 18:30; Ruth 3:2 |
| musick | 16 | 1 Samuel 18:6; 1 Chronicles 15:16; 2 Chronicles 5:13; 2 Chronicles 7:6; 2 Chronicles 23:13 |
| overthrown | 16 | Exodus 15:7; Judges 9:40; 2 Samuel 17:9; 2 Chronicles 14:13; Job 19:6 |
| soever | 16 | Leviticus 15:9; Leviticus 17:3; Leviticus 22:4; Deuteronomy 12:32; 2 Samuel 15:35 |
| intreat | 15 | Genesis 23:8; Exodus 8:8; Exodus 8:9; Exodus 8:28; Exodus 8:29 |

## Final Words Without Dictionary Or Strong's Help

| Word | Count | Sample References |
| --- | ---: | --- |
| None | 0 |  |

## Top Webster Entries Needing OCR Cleanup

| Word | Webster Headword | Count | Review Status |
| --- | --- | ---: | --- |
| plain | PLAIN | 75 | ocr_full_import_needs_spot_review |
| excellency | EX'CELLENCY | 26 | ocr_full_import_needs_spot_review |
| robe | ROBE | 26 | ocr_full_import_needs_spot_review |
| plains | PLAIN | 25 | ocr_full_import_needs_spot_review |
| centurion | CENTU'RION | 21 | ocr_full_import_needs_spot_review |
| shewbread | SHEW'-BREAD | 18 | ocr_full_import_needs_spot_review |
| selfsame | SELF'-SAME | 15 | ocr_full_import_needs_spot_review |
| vexation | VEXA'TION | 14 | ocr_full_import_needs_spot_review |
| hyssop | HYSSOP | 12 | ocr_full_import_needs_spot_review |
| bag | BAG | 11 | ocr_full_import_needs_spot_review |
| pollute | POLLU'TE | 11 | ocr_full_import_needs_spot_review |
| robes | ROBE | 11 | ocr_full_import_needs_spot_review |
| astonied | ASTO'NIED | 10 | ocr_full_import_needs_spot_review |
| nails | NAIL | 10 | ocr_full_import_needs_spot_review |
| resist | RESIST | 10 | ocr_full_import_needs_spot_review |
| saddled | SAD'DLE | 10 | ocr_full_import_needs_spot_review |
| satisfy | SATISFY | 10 | ocr_full_import_needs_spot_review |
| scales | SCALE | 10 | ocr_full_import_needs_spot_review |
| settle | SET'TLE | 10 | ocr_full_import_needs_spot_review |
| slumber | SLUMBER | 10 | ocr_full_import_needs_spot_review |
| stairs | STAIR | 10 | ocr_full_import_needs_spot_review |
| tail | TAIL | 10 | ocr_full_import_needs_spot_review |
| threshing | THRESH | 10 | ocr_full_import_needs_spot_review |
| treasuries | TREASURY | 10 | ocr_full_import_needs_spot_review |
| withstand | WITHSTAND' | 10 | ocr_full_import_needs_spot_review |
| avenger | AVENG'ER | 9 | ocr_full_import_needs_spot_review |
| babes | BABE | 9 | ocr_full_import_needs_spot_review |
| behaved | BEHA'VE | 9 | ocr_full_import_needs_spot_review |
| bestow | BESTOW | 9 | ocr_full_import_needs_spot_review |
| booths | BOOTH | 9 | ocr_full_import_needs_spot_review |

## Weakest Strong's Mapping Books

| Book | Chapters Mapped | Total Chapters | Chapter Coverage | Mapped Verses | Rows |
| --- | ---: | ---: | ---: | ---: | ---: |
| 3 John | 1 | 1 | 100% | 14 | 281 |
| 2 John | 1 | 1 | 100% | 13 | 294 |
| Philemon | 1 | 1 | 100% | 25 | 419 |
| Jude | 1 | 1 | 100% | 25 | 597 |
| Obadiah | 1 | 1 | 100% | 21 | 612 |
| Titus | 3 | 3 | 100% | 46 | 874 |
| 2 Thessalonians | 3 | 3 | 100% | 47 | 994 |
| Haggai | 2 | 2 | 100% | 38 | 1045 |
| Nahum | 3 | 3 | 100% | 47 | 1174 |
| Jonah | 4 | 4 | 100% | 48 | 1252 |
| Habakkuk | 3 | 3 | 100% | 56 | 1352 |
| 2 Peter | 3 | 3 | 100% | 61 | 1505 |
| Zephaniah | 3 | 3 | 100% | 53 | 1523 |
| 2 Timothy | 4 | 4 | 100% | 81 | 1578 |
| Malachi | 4 | 4 | 100% | 55 | 1663 |
| 1 Thessalonians | 5 | 5 | 100% | 89 | 1784 |
| Colossians | 4 | 4 | 100% | 95 | 1840 |
| Joel | 3 | 3 | 100% | 73 | 1953 |
| Philippians | 4 | 4 | 100% | 104 | 2053 |
| 1 Timothy | 6 | 6 | 100% | 112 | 2132 |

## Weakest TSK Books

| Book | Chapters With TSK | Total Chapters | Chapter Coverage | Source Verses | Rows |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2 John | 1 | 1 | 100% | 12 | 24 |
| 3 John | 1 | 1 | 100% | 12 | 24 |
| Haggai | 2 | 2 | 100% | 13 | 25 |
| Esther | 10 | 10 | 100% | 11 | 28 |
| Ezra | 10 | 10 | 100% | 11 | 31 |
| Zephaniah | 3 | 3 | 100% | 14 | 32 |
| 2 Thessalonians | 3 | 3 | 100% | 14 | 32 |
| 2 Peter | 3 | 3 | 100% | 14 | 33 |
| 1 Thessalonians | 5 | 5 | 100% | 15 | 34 |
| Philippians | 4 | 4 | 100% | 15 | 35 |
| Ecclesiastes | 12 | 12 | 100% | 13 | 36 |
| Colossians | 4 | 4 | 100% | 15 | 36 |
| 1 Peter | 5 | 5 | 100% | 16 | 38 |
| Lamentations | 5 | 5 | 100% | 16 | 39 |
| James | 5 | 5 | 100% | 16 | 39 |
| Galatians | 6 | 6 | 100% | 17 | 42 |
| Ephesians | 6 | 6 | 100% | 17 | 42 |
| Joel | 3 | 3 | 100% | 27 | 47 |
| Solomon's Song | 8 | 8 | 100% | 19 | 48 |
| Obadiah | 1 | 1 | 100% | 21 | 51 |

## Top KJV Words Without Reviewed Strong's Mapping Yet

| Word | Count | Sample References |
| --- | ---: | --- |
| bethel | 66 | Genesis 12:8; Genesis 12:8; Genesis 13:3; Genesis 13:3; Genesis 28:19 |
| beersheba | 34 | Genesis 21:14; Genesis 21:31; Genesis 21:32; Genesis 21:33; Genesis 22:19 |
| benhadad | 27 | 1 Kings 15:18; 1 Kings 15:20; 1 Kings 20:1; 1 Kings 20:2; 1 Kings 20:5 |
| namely | 23 | Leviticus 1:10; Numbers 1:32; Numbers 9:15; Numbers 13:11; Numbers 31:8 |
| bethshemesh | 21 | Joshua 15:10; Joshua 19:22; Joshua 19:38; Joshua 21:16; Judges 1:33 |
| obededom | 20 | 2 Samuel 6:10; 2 Samuel 6:11; 2 Samuel 6:11; 2 Samuel 6:12; 2 Samuel 6:12 |
| ramothgilead | 19 | 1 Kings 4:13; 1 Kings 22:4; 1 Kings 22:6; 1 Kings 22:12; 1 Kings 22:15 |
| kirjathjearim | 18 | Joshua 9:17; Joshua 15:9; Joshua 15:60; Joshua 18:14; Joshua 18:15 |
| abednego | 15 | Daniel 1:7; Daniel 2:49; Daniel 3:12; Daniel 3:13; Daniel 3:14 |
| nebuzaradan | 15 | 2 Kings 25:8; 2 Kings 25:11; 2 Kings 25:20; Jeremiah 39:9; Jeremiah 39:10 |
| bethhoron | 14 | Joshua 10:10; Joshua 10:11; Joshua 16:3; Joshua 16:5; Joshua 18:13 |
| ishbosheth | 12 | 2 Samuel 2:8; 2 Samuel 2:10; 2 Samuel 2:12; 2 Samuel 2:15; 2 Samuel 3:7 |
| jabeshgilead | 12 | Judges 21:8; Judges 21:9; Judges 21:10; Judges 21:12; Judges 21:14 |
| bathsheba | 10 | 2 Samuel 11:3; 2 Samuel 12:24; 1 Kings 1:11; 1 Kings 1:15; 1 Kings 1:16 |
| bethlehemjudah | 10 | Judges 17:7; Judges 17:8; Judges 17:9; Judges 19:1; Judges 19:2 |
| kadeshbarnea | 10 | Numbers 32:8; Numbers 34:4; Deuteronomy 1:2; Deuteronomy 1:19; Deuteronomy 2:14 |
| padanaram | 10 | Genesis 25:20; Genesis 28:2; Genesis 28:5; Genesis 28:6; Genesis 28:7 |
| bethaven | 7 | Joshua 7:2; Joshua 18:12; 1 Samuel 13:5; 1 Samuel 14:23; Hosea 4:15 |
| baalpeor | 6 | Numbers 25:3; Numbers 25:5; Deuteronomy 4:3; Deuteronomy 4:3; Psalms 106:28 |
| bethshean | 6 | Joshua 17:11; Joshua 17:16; Judges 1:27; 1 Kings 4:12; 1 Kings 4:12 |
| ebedmelech | 6 | Jeremiah 38:7; Jeremiah 38:8; Jeremiah 38:10; Jeremiah 38:11; Jeremiah 38:12 |
| engedi | 6 | Joshua 15:62; 1 Samuel 23:29; 1 Samuel 24:1; 2 Chronicles 20:2; Solomon's Song 1:14 |
| kirjatharba | 6 | Genesis 23:2; Joshua 14:15; Joshua 15:54; Joshua 20:7; Judges 1:10 |
| pahathmoab | 6 | Ezra 2:6; Ezra 8:4; Ezra 10:30; Nehemiah 3:11; Nehemiah 7:11 |
| baalhanan | 5 | Genesis 36:38; Genesis 36:39; 1 Chronicles 1:49; 1 Chronicles 1:50; 1 Chronicles 27:28 |
| galilaeans | 5 | Luke 13:1; Luke 13:2; Luke 13:2; John 4:45; Acts 2:7 |
| kibrothhattaavah | 5 | Numbers 11:34; Numbers 11:35; Numbers 33:16; Numbers 33:17; Deuteronomy 9:22 |
| tendeth | 5 | Proverbs 10:16; Proverbs 11:19; Proverbs 11:24; Proverbs 14:23; Proverbs 19:23 |
| baalperazim | 4 | 2 Samuel 5:20; 2 Samuel 5:20; 1 Chronicles 14:11; 1 Chronicles 14:11 |
| baalzebub | 4 | 2 Kings 1:2; 2 Kings 1:3; 2 Kings 1:6; 2 Kings 1:16 |

## Top KJV Words Without Exact Nave Topic Yet

| Word | Count | Sample References |
| --- | ---: | --- |
| all | 5620 | Genesis 1:26; Genesis 1:29; Genesis 2:1; Genesis 2:2; Genesis 2:3 |
| which | 4413 | Genesis 1:7; Genesis 1:7; Genesis 1:21; Genesis 1:29; Genesis 1:29 |
| said | 3999 | Genesis 1:3; Genesis 1:6; Genesis 1:9; Genesis 1:11; Genesis 1:14 |
| thee | 3826 | Genesis 3:11; Genesis 3:11; Genesis 3:15; Genesis 3:16; Genesis 3:17 |
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

