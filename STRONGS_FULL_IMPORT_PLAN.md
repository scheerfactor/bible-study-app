# Strong's Full Import Foundation

## Purpose

Father's Business Bible Study should make Strong's useful without making Bible study feel scholar-only. The first version should show a Strong's number, original word, simple meaning, Webster connection, first occurrence, and key verses.

## Rights Rules

- Do not import a full Strong's dataset until the selected source has documented rights.
- The original Strong's Exhaustive Concordance is public domain in the United States, but modern digital datasets can have separate licenses.
- Every imported entry needs source URL, rights status, review status, and attribution notes.
- Staged entries stay hidden until marked `Verified`.

## Import Structure

- Source manifest: `data/strongs/source-manifest.json`
- Verified sample: `data/strongs/sample-verified-strongs.json`
- Import script: `scripts/import-strongs-entries.mjs`
- Validation script: `scripts/validate-strongs-entries.mjs`
- Search endpoint: `/api/strongs?query=G4100`

## Import Workflow

1. Add a source to the manifest with rights notes.
2. Place reviewed JSON entries in `data/strongs/`.
3. Run `npm run validate:strongs`.
4. Run `npm run import:strongs -- --dry-run`.
5. After Supabase schema is live and a service role key is available locally, run `npm run import:strongs`.
6. Keep entries as `Needs Review` unless review is complete.

## Future Fields

- KJV word-to-Strong mapping
- Root explorer
- Related words
- Hebrew/Greek display
- Webster's 1828 linked headword
- First occurrence
- Key verses
- Simple warning notes where a word has a range of meanings

## Plain-English Display Rule

Strong's should support Bible reading, not replace it. The interface should avoid unnecessary grammar terms and should never imply that a user must know Greek or Hebrew to understand the KJV.
