# Bible Tools Bulk Import Plan

Goal: make TSK and Strong's imports fast without letting unclear data into the
public app.

## Fastest Safe TSK Path

Use OpenBible/TSK reference pairs for reviewed batches while the full
public-domain TSK path remains under review.

1. Download the OpenBible cross-reference zip into a local review folder.
2. Parse reference pairs only.
3. Do not import ESV quotations or rendered website text.
4. Stage large batches as `Needs Review`.
5. Promote small reviewed batches into public JSON.
6. Keep OpenBible attribution and rights notes with every row.

Commands already available:

```bash
npm run prepare:tsk-openbible -- --input=/path/to/cross_references.txt --output=data/imports/tsk-openbible-next-staging-needs-review.json --limit=500 --min-votes=25
npm run validate:tsk -- data/imports/tsk-openbible-next-staging-needs-review.json
```

Do not run a full public import until the display order, attribution display,
and quality review workflow are complete.

## Fastest Safe Strong's Path

Use a rights-cleared KJV-to-Strong mapping source, not e-Sword module files.

1. Choose a source that allows redistribution/commercial app use.
2. Record it in `data/study-tools/source-candidates.json`.
3. Convert the source into reviewed batch files under
   `data/strongs/mapping-batches/`.
4. Validate against the local KJV verse text and verified Strong's lexicon.
5. Build optimized reviewed chapter shards.
6. Promote only reviewed rows.
7. Store full indexes outside the browser bundle when the dataset gets large.

Commands now available:

```bash
npm run validate:strongs-mapping
npm run build:strongs-mapping-index
npm run build:strongs-chapter-shards
```

The app reads generated `data/strongs/mappings-by-chapter/<book>-<chapter>.json`
shards from content storage for fast chapter lookup. Do not edit generated
shards by hand; rebuild them from the reviewed batch folder.

## e-Sword KJV+ Note

The e-Sword KJV+ experience is the right kind of reader workflow: KJV words can
show Strong's numbers beside them. But e-Sword module data should not be copied
or imported unless written permission and redistribution terms are documented.

The app should reproduce the workflow with rights-safe data:

- normal Bible reading stays clean
- optional Strong's overlay shows numbers beside words
- tapping a word opens a plain-English Strong's card
- sermon/teaching users can send word studies to notes

## Storage Direction

Small reviewed samples can stay in Git.

Full Bible tool indexes should move to server-side lookup/storage:

- KJV text and small metadata: Git/Vercel
- full Strong's mapping index: Supabase Postgres or R2-backed server lookup
- full TSK index: Supabase Postgres or R2-backed server lookup
- generated search indexes: server-side cache

This prevents Bible tool growth from pushing the Vercel bundle toward its size
limits.
