# Bible Dictionary Resource Indexes

Generated: 2026-06-29T22:17:16.344Z

This build creates source-backed lookup indexes for the public-domain Bible reference tools already in the app.

## Summary

- Study words indexed: 79
- Easton normalized entries: 3883
- Easton exact study-word matches: 38/79
- Smith study-word evidence matches: 79/79
- Nave study-word evidence matches: 78/79

## Output Files

- `data/generated/eastons-bible-dictionary.entries.json`
- `data/generated/bible-reference-study-word-index.json`
- `data/reports/bible-dictionary-indexes.json`

## Review Notes

- Easton is parsed into normalized entries because its headword structure is reliable.
- Smith and Nave remain evidence indexes for now. Their OCR text should be cleaned before treating article/topic splits as finished.
- All entries keep source files, rights status, and review status so these can be safely wired into the Bible Tools Hub later.

## Smith Missing Study Words

- None

## Nave Missing Study Words

- intercede
