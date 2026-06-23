# Bible Tools Completion Status

Generated from `npm run audit:study-data` on 2026-06-23.

## Current Verified Counts

| Tool | Current status | Current count | User-facing rule |
| --- | --- | ---: | --- |
| Webster's 1828 | Broadly useful | 57,562 entries, 50,292 normalized headwords | Show as available; keep reviewed overrides preferred. |
| Strong's lexicon | Starter data only | 225 verified entries | Do not call complete. |
| Strong's KJV word mapping | Starter data only | 1,295 reviewed rows across 8 books and 21 chapters | Show only where reviewed mappings exist. |
| TSK / cross references | Reviewed sample coverage | 930 public reviewed rows, 490 source verses | Show as reviewed cross references, not full TSK. |
| Commentaries | Broad public coverage | 7,304 public rows, 66 books covered | Continue completion by author and quality. |
| Study reference tools | Present | 9/9 core files present | Integrate from Passage Guide and Bible Reader. |

## What Is Complete Enough For Beta

- Webster lookup is large enough to be a core feature.
- Commentary coverage is broad enough to be a core feature, but author depth varies.
- TSK references are useful for focus passages and selected weak-book batches.
- Strong's is useful where reviewed mappings exist, especially John, Romans, Hosea, Daniel, and Revelation focus passages.

## What Is Not Complete Yet

- Strong's is not full-Bible mapped.
- Strong's lexicon is not full Hebrew/Greek coverage.
- TSK is not a full public Treasury of Scripture Knowledge import.
- TSK display priority still needs better ranking when large batches are promoted.
- Some public-domain dictionary/reference imports are text resources but not yet fully structured lookup databases.

## Strong's Finish Plan

1. Keep the current CrossWire OSIS source in private/local review storage.
2. Generate staged mappings by Bible book, not by scattered samples.
3. Review and promote in batches:
   - John
   - Romans
   - Hosea
   - Daniel
   - Revelation
   - Genesis
   - Exodus
   - Psalms
4. Rebuild the public mapping index:

```bash
npm run build:strongs-mapping-index
npm run validate:strongs-mapping
```

5. Continue expanding lexicon entries from a documented public-domain Strong's source, not copied modern datasets.
6. Store full indexes server-side when growth threatens Vercel bundle size.

## TSK Finish Plan

1. Keep current public reviewed files in `data/imports/`.
2. Continue using MetaV/OpenBible as staging sources only if attribution/license obligations are accepted.
3. Prefer a public-domain scan/OCR Treasury source for long-term unrestricted import.
4. Promote reviewed batches by weakest Bible books first:
   - Numbers
   - Deuteronomy
   - 1 Samuel
   - 1 Chronicles
   - Matthew
   - Acts
   - Leviticus
   - 2 Kings
   - Joshua
   - 2 Samuel
   - Ezekiel
5. Validate every promoted file:

```bash
npm run validate:tsk -- data/imports/<reviewed-tsk-file>.json
```

6. Do not scrape rendered Bible study websites.
7. Do not import Bible quotation text from non-KJV or copyrighted Bible editions.

## Bible Reader Improvement Rule

The Bible Reader should show one simple study status line:

- Commentary entries available
- Cross references available
- Strong's mapped words available
- Webster lookup available

If a tool is incomplete for that chapter, say "starter coverage" or "reviewed entries only" instead of implying full coverage.

## Next Best Work

1. Build a full-book Strong's mapping promotion workflow.
2. Promote a TSK batch for the weakest books.
3. Add a Study Data Coverage badge to the Bible Reader and Passage Guide.
4. Continue commentary completion with Biblical Illustrator, Pulpit Commentary, Matthew Poole, and Ironside only where source and rights are clean.
