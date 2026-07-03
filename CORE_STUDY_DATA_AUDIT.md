# Core Study Data Audit

Generated: 2026-07-03T12:38:39.485Z

## Summary

- Bible text: 66 books, 1189 chapters, 31102 verses.
- Library: 1379 verified resources.
- Public commentary rows: 10922.
- Public commentary chapter coverage: 1189/1189 (100%).
- Commentary authors represented in public imports: 24.
- Webster 1828 entries: 57575 (50303 normalized headwords; 14 reviewed overlay).
- Strong's lexicon entries: 14288; reviewed KJV word mappings: 221052 rows from 16 batch files across 35 books and 366 chapters (broad import).
- Public TSK rows: 5924; staged TSK rows: 50; source verses covered: 2112; chapters covered: 1109; books covered: 66 (reviewed samples only).
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
| Psalms | 81 | 150 | 54% | 111 | 491 |
| 1 Samuel | 28 | 31 | 90.3% | 53 | 207 |
| Proverbs | 29 | 31 | 93.5% | 32 | 75 |
| Genesis | 48 | 50 | 96% | 65 | 193 |
| 1 Chronicles | 28 | 29 | 96.6% | 54 | 113 |
| Numbers | 35 | 36 | 97.2% | 68 | 142 |
| Exodus | 39 | 40 | 97.5% | 49 | 119 |
| Job | 41 | 42 | 97.6% | 65 | 190 |
| Habakkuk | 3 | 3 | 100% | 4 | 7 |
| Nahum | 3 | 3 | 100% | 4 | 10 |
| 2 Timothy | 4 | 4 | 100% | 6 | 10 |
| Titus | 3 | 3 | 100% | 3 | 10 |

## Thinnest Commentary Books

| Book | Chapters Covered | Total Chapters | Coverage | Authors | Rows/Chapter |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2 Chronicles | 36 | 36 | 100% | 8 | 7.0 |
| 1 Chronicles | 29 | 29 | 100% | 8 | 7.0 |
| Matthew | 28 | 28 | 100% | 9 | 8.0 |
| 1 Corinthians | 16 | 16 | 100% | 9 | 8.1 |
| 2 Corinthians | 13 | 13 | 100% | 9 | 8.1 |
| Hebrews | 13 | 13 | 100% | 9 | 8.1 |
| Nehemiah | 13 | 13 | 100% | 9 | 8.1 |
| Esther | 10 | 10 | 100% | 9 | 8.1 |
| Ezra | 10 | 10 | 100% | 9 | 8.1 |
| 1 Timothy | 6 | 6 | 100% | 9 | 8.2 |
| Ephesians | 6 | 6 | 100% | 9 | 8.2 |
| Galatians | 6 | 6 | 100% | 9 | 8.2 |

## Recommendations

- Strong's should stay labeled as starter data until a full rights-safe dataset is imported, reviewed, mapped, and validated.
- TSK is still sample/reviewed coverage, not a full TSK import. Build the next reviewed batches from the weakest-book table.
- Webster is large enough to be useful, but OCR quality remains the main cleanup need. Favor reviewed entries first in user-facing displays.
- Continue commentary expansion by thinnest books first rather than by raw count.
- Public-domain audio should be piloted through the media intake workflow before becoming public.

