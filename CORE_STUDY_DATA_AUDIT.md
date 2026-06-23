# Core Study Data Audit

Generated: 2026-06-23T22:34:45.465Z

## Summary

- Bible text: 66 books, 1189 chapters, 31102 verses.
- Library: 1306 verified resources.
- Public commentary rows: 7304.
- Public commentary chapter coverage: 1189/1189 (100%).
- Commentary authors represented in public imports: 23.
- Webster 1828 entries: 57562 (50292 normalized headwords; 1 reviewed overlay).
- Strong's lexicon entries: 225; reviewed KJV word mappings: 47010 rows from 8 batch files across 13 books and 104 chapters (starter data only).
- Public TSK rows: 1958; staged TSK rows: 50; source verses covered: 937; chapters covered: 159; books covered: 66 (reviewed samples only).
- Study tool files present: 9/9.
- Public-domain audio candidates: 43.

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
| Deuteronomy | 1 | 34 | 2.9% | 24 | 61 |
| Leviticus | 1 | 27 | 3.7% | 12 | 23 |
| Luke | 1 | 24 | 4.2% | 6 | 12 |
| 1 Kings | 1 | 22 | 4.5% | 1 | 1 |
| Judges | 1 | 21 | 4.8% | 1 | 1 |
| Job | 2 | 42 | 4.8% | 2 | 2 |
| Psalms | 8 | 150 | 5.3% | 32 | 81 |
| 2 Chronicles | 2 | 36 | 5.6% | 2 | 3 |
| 1 Corinthians | 1 | 16 | 6.3% | 1 | 1 |
| Mark | 1 | 16 | 6.3% | 12 | 23 |
| 1 Samuel | 2 | 31 | 6.5% | 21 | 46 |
| Acts | 2 | 28 | 7.1% | 21 | 54 |

## Thinnest Commentary Books

| Book | Chapters Covered | Total Chapters | Coverage | Authors | Rows/Chapter |
| --- | ---: | ---: | ---: | ---: | ---: |
| 2 Chronicles | 36 | 36 | 100% | 5 | 2.8 |
| Job | 42 | 42 | 100% | 5 | 2.9 |
| 1 Chronicles | 29 | 29 | 100% | 5 | 3.0 |
| Ecclesiastes | 12 | 12 | 100% | 5 | 5.0 |
| Esther | 10 | 10 | 100% | 5 | 5.0 |
| Ezra | 10 | 10 | 100% | 5 | 5.0 |
| Nehemiah | 13 | 13 | 100% | 5 | 5.0 |
| Isaiah | 66 | 66 | 100% | 7 | 4.2 |
| Jeremiah | 52 | 52 | 100% | 7 | 4.6 |
| Ezekiel | 48 | 48 | 100% | 7 | 4.8 |
| 1 Corinthians | 16 | 16 | 100% | 7 | 4.9 |
| 1 John | 5 | 5 | 100% | 7 | 7.0 |

## Recommendations

- Strong's should stay labeled as starter data until a full rights-safe dataset is imported, reviewed, mapped, and validated.
- TSK is still sample/reviewed coverage, not a full TSK import. Build the next reviewed batches from the weakest-book table.
- Webster is large enough to be useful, but OCR quality remains the main cleanup need. Favor reviewed entries first in user-facing displays.
- Continue commentary expansion by thinnest books first rather than by raw count.
- Public-domain audio should be piloted through the media intake workflow before becoming public.

