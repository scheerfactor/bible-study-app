# Bible Tool Coverage Audit

Generated: 2026-07-13T16:22:15.604Z

This audit measures Bible-wide readiness for the study tools: Webster 1828 lookup, Strong's KJV word mappings, TSK cross references, and Nave's Topical Bible. It is intentionally conservative: rough OCR or unreviewed data should stay visible as a review need, not as finished polish.

## Current Coverage

- Bible text: 66 books, 1189 chapters, 31102 verses.
- KJV words measured: 791,438 tokens, 12,524 unique words, 12,454 meaningful unique words after common-word filtering.
- Webster 1828: 7,740/12,454 meaningful KJV words have a lookup candidate (62.1%).
- Combined word/topic lookup: 10,738/12,454 meaningful KJV words have Webster, Easton, or Nave help (86.2%).
- Strong's lexicon: 14,296 entries available; reviewed KJV mappings cover 1189/1189 chapters and 31,013 source verses.
- Strong's KJV word mapping: 12,053/12,454 meaningful KJV words appear in reviewed mapping batches (96.8%).
- Combined word-study help: 12,454/12,454 meaningful KJV words have Webster, Easton, Nave, or reviewed Strong's help (100%).
- TSK: 6,118 public rows cover 1189/1189 chapters (100%).
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
| how | 543 | Genesis 26:9; Genesis 27:20; Genesis 28:17; Genesis 30:29; Genesis 30:29 |
| years | 539 | Genesis 1:14; Genesis 5:3; Genesis 5:4; Genesis 5:5; Genesis 5:6 |
| saul | 420 | Genesis 36:37; Genesis 36:38; 1 Samuel 9:2; 1 Samuel 9:3; 1 Samuel 9:3 |
| jacob | 377 | Genesis 25:26; Genesis 25:27; Genesis 25:28; Genesis 25:29; Genesis 25:30 |
| year | 369 | Genesis 7:11; Genesis 8:13; Genesis 14:4; Genesis 14:5; Genesis 17:21 |
| woman | 367 | Genesis 2:22; Genesis 2:23; Genesis 3:1; Genesis 3:2; Genesis 3:4 |
| aaron | 350 | Exodus 4:14; Exodus 4:27; Exodus 4:28; Exodus 4:29; Exodus 4:30 |
| solomon | 304 | 2 Samuel 5:14; 2 Samuel 12:24; 1 Kings 1:10; 1 Kings 1:11; 1 Kings 1:12 |
| babylon | 294 | 2 Kings 17:24; 2 Kings 17:30; 2 Kings 20:12; 2 Kings 20:14; 2 Kings 20:17 |
| pharaoh | 273 | Genesis 12:15; Genesis 12:15; Genesis 12:15; Genesis 12:17; Genesis 12:18 |
| power | 272 | Genesis 31:6; Genesis 31:29; Genesis 32:28; Genesis 49:3; Exodus 9:16 |
| philistines | 254 | Genesis 21:32; Genesis 21:34; Genesis 26:1; Genesis 26:8; Genesis 26:14 |
| abraham | 250 | Genesis 17:5; Genesis 17:9; Genesis 17:15; Genesis 17:17; Genesis 17:18 |
| joseph | 250 | Genesis 30:24; Genesis 30:25; Genesis 33:2; Genesis 33:7; Genesis 35:24 |
| wine | 231 | Genesis 9:21; Genesis 9:24; Genesis 14:18; Genesis 19:32; Genesis 19:33 |
| joshua | 216 | Exodus 17:9; Exodus 17:10; Exodus 17:13; Exodus 17:14; Exodus 24:13 |
| tree | 201 | Genesis 1:11; Genesis 1:12; Genesis 1:29; Genesis 1:29; Genesis 2:9 |
| jordan | 197 | Genesis 13:10; Genesis 13:11; Genesis 32:10; Genesis 50:10; Genesis 50:11 |
| book | 188 | Genesis 5:1; Exodus 17:14; Exodus 24:7; Exodus 32:32; Exodus 32:33 |
| ephraim | 176 | Genesis 41:52; Genesis 46:20; Genesis 48:1; Genesis 48:5; Genesis 48:13 |
| moab | 168 | Genesis 19:37; Genesis 36:35; Exodus 15:15; Numbers 21:11; Numbers 21:13 |
| darkness | 162 | Genesis 1:2; Genesis 1:4; Genesis 1:5; Genesis 1:18; Genesis 15:12 |
| paul | 162 | Acts 13:9; Acts 13:13; Acts 13:16; Acts 13:43; Acts 13:45 |

## Top KJV Words Still Without Any Study Lookup

| Word | Count | Sample References |
| --- | ---: | --- |
| compassed | 44 | Genesis 19:4; Deuteronomy 2:1; Deuteronomy 2:3; Joshua 6:11; Joshua 6:14 |
| forasmuch | 43 | Genesis 41:39; Numbers 10:31; Deuteronomy 12:12; Deuteronomy 17:16; Joshua 17:14 |
| straightway | 42 | 1 Samuel 9:13; 1 Samuel 28:20; Proverbs 7:22; Daniel 10:17; Matthew 3:16 |
| either | 41 | Genesis 31:24; Genesis 31:29; Leviticus 10:1; Leviticus 13:49; Leviticus 13:51 |
| eastward | 40 | Genesis 2:8; Genesis 13:14; Genesis 25:6; Exodus 27:13; Exodus 38:13 |
| compass | 39 | Exodus 27:5; Exodus 38:4; Numbers 21:4; Numbers 34:5; Joshua 6:3 |
| defile | 39 | Leviticus 11:44; Leviticus 15:31; Leviticus 18:20; Leviticus 18:23; Leviticus 18:24 |
| prevailed | 37 | Genesis 7:18; Genesis 7:19; Genesis 7:24; Genesis 30:8; Genesis 32:25 |
| fourscore | 36 | Genesis 16:16; Genesis 35:28; Exodus 7:7; Exodus 7:7; Numbers 2:9 |
| notwithstanding | 36 | Exodus 16:20; Exodus 21:21; Leviticus 25:32; Leviticus 27:28; Numbers 26:11 |
| seest | 36 | Genesis 13:15; Genesis 16:13; Genesis 31:43; Exodus 10:28; Deuteronomy 4:19 |
| fruitful | 35 | Genesis 1:22; Genesis 1:28; Genesis 8:17; Genesis 9:1; Genesis 9:7 |
| whereas | 33 | Genesis 31:37; Deuteronomy 19:6; Deuteronomy 28:62; 1 Samuel 24:17; 2 Samuel 7:6 |
| members | 32 | Job 17:7; Psalms 139:16; Matthew 5:29; Matthew 5:30; Romans 6:13 |
| hungry | 30 | 1 Samuel 2:5; 2 Samuel 17:29; 2 Kings 7:12; Job 5:5; Job 22:7 |
| putteth | 30 | Exodus 30:33; Numbers 22:38; Deuteronomy 25:11; Deuteronomy 27:15; 1 Kings 20:11 |
| continued | 29 | Genesis 40:4; Judges 5:17; Ruth 1:2; Ruth 2:7; 1 Samuel 1:12 |
| prevail | 29 | Genesis 7:20; Numbers 22:6; Judges 16:5; 1 Samuel 2:9; 1 Samuel 17:9 |
| drawn | 28 | Numbers 22:23; Numbers 22:31; Deuteronomy 21:3; Deuteronomy 30:17; Joshua 5:13 |
| thief | 28 | Exodus 22:2; Exodus 22:7; Exodus 22:8; Deuteronomy 24:7; Job 24:14 |
| egyptian | 27 | Genesis 16:1; Genesis 16:3; Genesis 21:9; Genesis 25:12; Genesis 39:1 |
| fishes | 27 | Genesis 9:2; 1 Kings 4:33; Job 12:8; Ecclesiastes 9:12; Ezekiel 38:20 |
| whereunto | 27 | Numbers 36:3; Numbers 36:4; Deuteronomy 4:26; 2 Chronicles 8:11; Esther 10:2 |
| accomplished | 26 | 2 Chronicles 36:22; Esther 2:12; Job 15:32; Proverbs 13:19; Isaiah 40:2 |
| hittite | 26 | Genesis 23:10; Genesis 25:9; Genesis 26:34; Genesis 26:34; Genesis 36:2 |
| accept | 25 | Genesis 32:20; Exodus 22:11; Leviticus 26:41; Leviticus 26:43; Deuteronomy 33:11 |
| gotten | 25 | Genesis 4:1; Genesis 12:5; Genesis 31:1; Genesis 31:18; Genesis 31:18 |
| somewhat | 25 | Leviticus 4:13; Leviticus 4:22; Leviticus 4:27; Leviticus 13:6; Leviticus 13:19 |
| forsook | 24 | Deuteronomy 32:15; Judges 2:12; Judges 2:13; Judges 10:6; 1 Samuel 31:7 |
| fulfil | 24 | Genesis 29:27; Exodus 5:13; Exodus 23:26; 1 Kings 2:27; 1 Chronicles 22:13 |

## Final Words Without Dictionary Or Strong's Help

| Word | Count | Sample References |
| --- | ---: | --- |
| None | 0 |  |

## Top Webster Entries Needing OCR Cleanup

| Word | Webster Headword | Count | Review Status |
| --- | --- | ---: | --- |
| lamb | LAMB | 107 | ocr_full_import_needs_spot_review |
| lambs | LAMB | 81 | ocr_full_import_needs_spot_review |
| plain | PLAIN | 75 | ocr_full_import_needs_spot_review |
| dan | DAN | 72 | ocr_full_import_needs_spot_review |
| arm | ARM | 67 | ocr_full_import_needs_spot_review |
| endureth | ENDU'RE | 59 | ocr_full_import_needs_spot_review |
| officers | OF'FICER | 58 | ocr_full_import_needs_spot_review |
| fowls | FOWL | 55 | ocr_full_import_needs_spot_review |
| wonders | WONDER | 55 | ocr_full_import_needs_spot_review |
| sockets | SOCK'ET | 54 | ocr_full_import_needs_spot_review |
| instruments | IN'STRUMENT | 51 | ocr_full_import_needs_spot_review |
| camels | CAM'EL | 50 | ocr_full_import_needs_spot_review |
| thorns | THORN | 50 | ocr_full_import_needs_spot_review |
| sinners | SIN'NER | 48 | ocr_full_import_needs_spot_review |
| bands | BAND | 46 | ocr_full_import_needs_spot_review |
| towns | TOWN | 45 | ocr_full_import_needs_spot_review |
| rings | RING | 44 | ocr_full_import_needs_spot_review |
| justified | JUST'IFY | 43 | ocr_full_import_needs_spot_review |
| talked | TALK | 42 | ocr_full_import_needs_spot_review |
| boards | BOARD | 41 | ocr_full_import_needs_spot_review |
| candlestick | CAN'DLE-STICK | 41 | ocr_full_import_needs_spot_review |
| bars | B'AR | 38 | ocr_full_import_needs_spot_review |
| singers | SING'ER | 38 | ocr_full_import_needs_spot_review |
| steps | STEP | 38 | ocr_full_import_needs_spot_review |
| chains | CHAIN | 37 | ocr_full_import_needs_spot_review |
| crucified | CRU'CIFY | 37 | ocr_full_import_needs_spot_review |
| grapes | GRAPE | 37 | ocr_full_import_needs_spot_review |
| tears | TEAR | 36 | ocr_full_import_needs_spot_review |
| means | MEAN | 35 | ocr_full_import_needs_spot_review |
| overlaid | OVERLA'ID | 35 | ocr_full_import_needs_spot_review |

## Weakest Strong's Mapping Books

| Book | Chapters Mapped | Total Chapters | Chapter Coverage | Mapped Verses | Rows |
| --- | ---: | ---: | ---: | ---: | ---: |
| 3 John | 1 | 1 | 100% | 14 | 281 |
| 2 John | 1 | 1 | 100% | 13 | 294 |
| Philemon | 1 | 1 | 100% | 25 | 419 |
| Hosea | 14 | 14 | 100% | 159 | 481 |
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

## Weakest TSK Books

| Book | Chapters With TSK | Total Chapters | Chapter Coverage | Source Verses | Rows |
| --- | ---: | ---: | ---: | ---: | ---: |
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
| Zephaniah | 3 | 3 | 100% | 14 | 32 |
| 2 Thessalonians | 3 | 3 | 100% | 14 | 32 |
| 2 Peter | 3 | 3 | 100% | 14 | 33 |

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

