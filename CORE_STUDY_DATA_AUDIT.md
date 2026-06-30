# Core Study Data Audit

Generated: 2026-06-30T01:36:59.843Z

## Summary

- Bible text: 66 books, 1189 chapters, 31102 verses.
- Library: 1355 verified resources.
- Public commentary rows: 7725.
- Public commentary chapter coverage: 1189/1189 (100%).
- Commentary authors represented in public imports: 24.
- Webster 1828 entries: 57575 (50303 normalized headwords; 14 reviewed overlay).
- Strong's lexicon entries: 14288; reviewed KJV word mappings: 221052 rows from 16 batch files across 35 books and 366 chapters (broad import).
- Public TSK rows: 5560; staged TSK rows: 50; source verses covered: 1927; chapters covered: 924; books covered: 66 (reviewed samples only).
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
| Psalms | 45 | 150 | 30% | 75 | 419 |
| Ezekiel | 30 | 48 | 62.5% | 75 | 222 |
| Isaiah | 43 | 66 | 65.2% | 76 | 235 |
| Joel | 2 | 3 | 66.7% | 26 | 45 |
| 2 Samuel | 16 | 24 | 66.7% | 36 | 78 |
| 2 Kings | 17 | 25 | 68% | 35 | 87 |
| Job | 29 | 42 | 69% | 53 | 169 |
| Exodus | 28 | 40 | 70% | 38 | 97 |
| Joshua | 17 | 24 | 70.8% | 35 | 92 |
| Luke | 17 | 24 | 70.8% | 41 | 115 |
| Malachi | 3 | 4 | 75% | 25 | 59 |
| John | 16 | 21 | 76.2% | 38 | 113 |

## Thinnest Commentary Books

| Book | Chapters Covered | Total Chapters | Coverage | Authors | Rows/Chapter |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2 Chronicles | 36 | 36 | 100% | 6 | 2.9 |
| Job | 42 | 42 | 100% | 6 | 2.9 |
| 1 Chronicles | 29 | 29 | 100% | 6 | 3.1 |
| Ecclesiastes | 12 | 12 | 100% | 6 | 5.1 |
| Nehemiah | 13 | 13 | 100% | 7 | 6.1 |
| Esther | 10 | 10 | 100% | 7 | 6.1 |
| Ezra | 10 | 10 | 100% | 7 | 6.1 |
| Isaiah | 66 | 66 | 100% | 8 | 4.2 |
| Ezekiel | 48 | 48 | 100% | 8 | 4.8 |
| 1 Corinthians | 16 | 16 | 100% | 8 | 5.0 |
| Exodus | 40 | 40 | 100% | 8 | 7.0 |
| Numbers | 36 | 36 | 100% | 8 | 7.0 |

## Recommendations

- Strong's should stay labeled as starter data until a full rights-safe dataset is imported, reviewed, mapped, and validated.
- TSK is still sample/reviewed coverage, not a full TSK import. Build the next reviewed batches from the weakest-book table.
- Webster is large enough to be useful, but OCR quality remains the main cleanup need. Favor reviewed entries first in user-facing displays.
- Continue commentary expansion by thinnest books first rather than by raw count.
- Public-domain audio should be piloted through the media intake workflow before becoming public.

