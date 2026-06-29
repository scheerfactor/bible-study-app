# Core Study Data Audit

Generated: 2026-06-29T10:17:24.878Z

## Summary

- Bible text: 66 books, 1189 chapters, 31102 verses.
- Library: 1313 verified resources.
- Public commentary rows: 7633.
- Public commentary chapter coverage: 1189/1189 (100%).
- Commentary authors represented in public imports: 24.
- Webster 1828 entries: 57562 (50292 normalized headwords; 1 reviewed overlay).
- Strong's lexicon entries: 14288; reviewed KJV word mappings: 221052 rows from 16 batch files across 35 books and 366 chapters (broad import).
- Public TSK rows: 5331; staged TSK rows: 50; source verses covered: 1809; chapters covered: 806; books covered: 66 (reviewed samples only).
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
| Psalms | 33 | 150 | 22% | 63 | 395 |
| Isaiah | 31 | 66 | 47% | 64 | 211 |
| Haggai | 1 | 2 | 50% | 12 | 23 |
| Proverbs | 17 | 31 | 54.8% | 20 | 52 |
| 1 Chronicles | 16 | 29 | 55.2% | 42 | 89 |
| Amos | 5 | 9 | 55.6% | 28 | 64 |
| Romans | 9 | 16 | 56.3% | 25 | 58 |
| Acts | 16 | 28 | 57.1% | 39 | 197 |
| Jeremiah | 30 | 52 | 57.7% | 59 | 193 |
| Genesis | 29 | 50 | 58% | 46 | 155 |
| Leviticus | 16 | 27 | 59.3% | 34 | 152 |
| Matthew | 17 | 28 | 60.7% | 35 | 93 |

## Thinnest Commentary Books

| Book | Chapters Covered | Total Chapters | Coverage | Authors | Rows/Chapter |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2 Chronicles | 36 | 36 | 100% | 6 | 2.9 |
| Job | 42 | 42 | 100% | 6 | 2.9 |
| 1 Chronicles | 29 | 29 | 100% | 6 | 3.1 |
| Nehemiah | 13 | 13 | 100% | 6 | 5.1 |
| Ecclesiastes | 12 | 12 | 100% | 6 | 5.1 |
| Esther | 10 | 10 | 100% | 6 | 5.1 |
| Ezra | 10 | 10 | 100% | 6 | 5.1 |
| Isaiah | 66 | 66 | 100% | 8 | 4.2 |
| Jeremiah | 52 | 52 | 100% | 8 | 4.6 |
| Ezekiel | 48 | 48 | 100% | 8 | 4.8 |
| 1 Corinthians | 16 | 16 | 100% | 8 | 5.0 |
| Exodus | 40 | 40 | 100% | 8 | 7.0 |

## Recommendations

- Strong's should stay labeled as starter data until a full rights-safe dataset is imported, reviewed, mapped, and validated.
- TSK is still sample/reviewed coverage, not a full TSK import. Build the next reviewed batches from the weakest-book table.
- Webster is large enough to be useful, but OCR quality remains the main cleanup need. Favor reviewed entries first in user-facing displays.
- Continue commentary expansion by thinnest books first rather than by raw count.
- Public-domain audio should be piloted through the media intake workflow before becoming public.

