# Core Study Data Audit

Generated: 2026-06-29T02:00:36.685Z

## Summary

- Bible text: 66 books, 1189 chapters, 31102 verses.
- Library: 1313 verified resources.
- Public commentary rows: 7633.
- Public commentary chapter coverage: 1189/1189 (100%).
- Commentary authors represented in public imports: 24.
- Webster 1828 entries: 57562 (50292 normalized headwords; 1 reviewed overlay).
- Strong's lexicon entries: 14288; reviewed KJV word mappings: 221052 rows from 16 batch files across 35 books and 366 chapters (broad import).
- Public TSK rows: 5068; staged TSK rows: 50; source verses covered: 1672; chapters covered: 669; books covered: 66 (reviewed samples only).
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
| Psalms | 21 | 150 | 14% | 51 | 371 |
| Isaiah | 19 | 66 | 28.8% | 52 | 187 |
| Genesis | 17 | 50 | 34% | 34 | 132 |
| Jeremiah | 18 | 52 | 34.6% | 47 | 170 |
| Ezekiel | 18 | 48 | 37.5% | 63 | 198 |
| Exodus | 16 | 40 | 40% | 26 | 73 |
| Job | 17 | 42 | 40.5% | 41 | 150 |
| Numbers | 16 | 36 | 44.4% | 49 | 106 |
| Deuteronomy | 16 | 34 | 47.1% | 44 | 213 |
| 2 Chronicles | 17 | 36 | 47.2% | 31 | 102 |
| Haggai | 1 | 2 | 50% | 12 | 23 |
| 1 Samuel | 16 | 31 | 51.6% | 41 | 183 |

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

