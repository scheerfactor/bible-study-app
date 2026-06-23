# Bible Tools Completion Status

Generated from `npm run audit:study-data` on 2026-06-23.

## Current Verified Counts

| Tool | Current status | Current count | User-facing rule |
| --- | --- | ---: | --- |
| Webster's 1828 | Broadly useful | 57,562 entries, 50,292 normalized headwords | Show as available; keep reviewed overrides preferred. |
| Strong's lexicon | Starter data only | 225 verified entries | Do not call complete. |
| Strong's KJV word mapping | Expanded reviewed mapping coverage | 27,468 reviewed rows across 12 books and 63 chapters | Show only where reviewed mappings exist; definition cards appear only where lexicon entries exist. |
| TSK / cross references | Reviewed sample coverage | 1,320 public reviewed rows, 677 source verses | Show as reviewed cross references, not full TSK. |
| Commentaries | Broad public coverage | 7,304 public rows, 66 books covered | Continue completion by author and quality. |
| Study reference tools | Present | 9/9 core files present | Integrate from Passage Guide and Bible Reader. |

## What Is Complete Enough For Beta

- Webster lookup is large enough to be a core feature.
- Commentary coverage is broad enough to be a core feature, but author depth varies.
- TSK references are useful for focus passages and selected weak-book batches.
- Strong's word-to-number mapping is useful where reviewed mappings exist, especially John, Romans, Hosea, Daniel, Revelation, and selected anchor chapters.

## What Is Not Complete Yet

- Strong's is not full-Bible mapped.
- Strong's lexicon is not full Hebrew/Greek coverage.
- Some Strong's numbers now appear before their full lexicon definition card is imported.
- TSK is not a full public Treasury of Scripture Knowledge import.
- TSK display priority still needs better ranking when large batches are promoted.
- Some public-domain dictionary/reference imports are text resources but not yet fully structured lookup databases.

## Strong's Finish Plan

1. Keep the current CrossWire OSIS source in private/local review storage.
2. Generate staged mappings by Bible book, not by scattered samples.
3. Continue review and promotion by weakest or highest-use books. Current promoted focus includes:
   - John
   - Romans
   - Hosea
   - Daniel 7
   - Revelation 13
   - Genesis 1-3
   - Exodus 12
   - Psalms 22-23
   - Isaiah 53
4. Rebuild the public mapping index:

```bash
npm run build:strongs-mapping-index
npm run validate:strongs-mapping
```

5. Run strict lexicon validation only when expanding definition cards:

```bash
npm run validate:strongs-mapping -- --strict-lexicon
```

6. Continue expanding lexicon entries from a documented public-domain Strong's source, not copied modern datasets.
7. Store full indexes server-side when growth threatens Vercel bundle size.

## TSK Finish Plan

1. Keep current public reviewed files in `data/imports/`.
2. Continue using MetaV/OpenBible as staging sources only if attribution/license obligations are accepted.
3. Prefer a public-domain scan/OCR Treasury source for long-term unrestricted import.
4. Promote reviewed batches by weakest Bible books first. Current weak-book OpenBible batch added reviewed references for selected verses in:
   - Numbers
   - Deuteronomy
   - 1 Samuel
   - 1 Chronicles
   - Matthew
   - Acts
   - 2 Kings
   - Joshua
   - 2 Samuel
   - Ezekiel
   - Mark
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

1. Expand Strong's lexicon definition cards so more displayed Strong's numbers open complete word-study panels.
2. Continue full-book Strong's mapping promotion for Genesis, Exodus, Psalms, Isaiah, Daniel, Revelation, and the Gospels.
3. Promote larger TSK batches for weakest books while keeping source attribution and duplicate validation.
4. Add a Study Data Coverage badge to the Bible Reader and Passage Guide.
5. Continue commentary completion with Biblical Illustrator, Pulpit Commentary, Matthew Poole, and Ironside only where source and rights are clean.
