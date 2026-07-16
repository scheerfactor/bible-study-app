# Core Study Data Audit

Generated: 2026-07-16T12:34:40.093Z

## Summary

- Bible text: 66 books, 1189 chapters, 31102 verses.
- Library: 2235 verified resources.
- Public commentary rows: 12851.
- Public commentary chapter coverage: 1189/1189 (100%).
- Commentary authors represented in public imports: 71.
- Webster 1828 entries: 60742 (51268 normalized headwords; 2314 reviewed overlay).
- Strong's lexicon entries: 14296; reviewed KJV word mappings: 729289 rows from 66 batch files across 66 books and 1189 chapters (broad import).
- Public TSK rows: 6994; staged TSK rows: 50; source verses covered: 2563; chapters covered: 1189; books covered: 66 (reviewed samples only).
- Study tool files present: 9/9.
- Public-domain audio candidates: 50.

## Webster Normalization Checks

| Word | Normalized | Entry Present |
| --- | --- | --- |
| believeth | believe | yes |
| loved | love | yes |
| death | death | yes |
| doeth | do | yes |
| believe | believe | yes |
| love | love | yes |

## Strong's Focus Word Checks

| Word | Covered |
| --- | --- |
| believe | yes |
| faith | yes |
| love | yes |
| spirit | yes |
| flesh | yes |
| law | yes |
| beast | yes |
| kingdom | yes |
| worship | yes |

## Weakest Strong's Mapping Books

| Book | Chapters Mapped | Total Chapters | Chapter Coverage | Mapped Verses | Mapping Rows |
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

## TSK Focus Reference Checks

| Reference | Covered |
| --- | --- |
| John 3:16 | yes |
| Romans 8:28 | yes |
| Amos 5:24 | yes |
| Daniel 7:13 | yes |
| Revelation 13:1 | yes |

## Weakest TSK Books

| Book | Chapters With References | Total Chapters | Chapter Coverage | Source Verses | Rows |
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

## Thinnest Commentary Books

| Book | Chapters Covered | Total Chapters | Coverage | Authors | Rows/Chapter |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2 Kings | 25 | 25 | 100% | 11 | 10.0 |
| 2 Samuel | 24 | 24 | 100% | 11 | 10.0 |
| Joshua | 24 | 24 | 100% | 11 | 10.0 |
| 1 Kings | 22 | 22 | 100% | 11 | 10.0 |
| Judges | 21 | 21 | 100% | 11 | 10.0 |
| Genesis | 50 | 50 | 100% | 11 | 10.1 |
| Ecclesiastes | 12 | 12 | 100% | 11 | 10.1 |
| Exodus | 40 | 40 | 100% | 11 | 10.1 |
| Ruth | 4 | 4 | 100% | 11 | 10.3 |
| Isaiah | 66 | 66 | 100% | 12 | 10.1 |
| 2 Chronicles | 36 | 36 | 100% | 12 | 10.1 |
| Numbers | 36 | 36 | 100% | 12 | 10.1 |

## Recommendations

- Strong's should stay labeled as starter data until a full rights-safe dataset is imported, reviewed, mapped, and validated.
- TSK is still sample/reviewed coverage, not a full TSK import. Build the next reviewed batches from the weakest-book table.
- Webster is large enough to be useful, but OCR quality remains the main cleanup need. Favor reviewed entries first in user-facing displays.
- Continue commentary expansion by thinnest books first rather than by raw count.
- Public-domain audio should be piloted through the media intake workflow before becoming public.

