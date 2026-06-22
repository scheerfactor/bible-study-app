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

## KJV Word Mapping Fast Lane

The app can already display Strong's numbers beside KJV words when reviewed
mapping rows exist. The public mapping index is:

```text
data/strongs/kjv-strongs-mappings.reviewed.json
```

Current completion state is tracked by:

```bash
npm run audit:study-data
```

Use the CrossWire OSIS parser for local staging only:

```bash
npm run import:strongs-crosswire-osis -- --input=/path/to/kjv.xml --refs="John 3,Romans 8,Hosea 4" --output=data/strongs/mapping-staging/kjv-strongs-next.staging-needs-review.json
```

Review rows manually, then copy approved rows into a tracked file under:

```text
data/strongs/mapping-batches/
```

After promotion, rebuild and validate:

```bash
npm run build:strongs-mapping-index
npm run validate:strongs-mapping
```

Do not commit raw CrossWire, STEP, e-Sword, or other source exports. Raw source
files belong in local review storage, R2, or another private source bucket until
the rights path is fully approved.

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
