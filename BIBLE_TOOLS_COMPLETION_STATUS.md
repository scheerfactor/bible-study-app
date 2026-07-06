# Bible Tools Completion Status

Generated from the latest study-data and Strong's coverage audits on 2026-07-06.

## Current Verified Counts

| Tool | Current status | Current count | User-facing rule |
| --- | --- | ---: | --- |
| Webster's 1828 | Broadly useful, cleanup still needed | 57,561 base entries, 58 reviewed overrides, 50,292 normalized headwords | Show as available; prefer reviewed overrides and keep messy OCR definitions marked for cleanup. |
| Strong's lexicon | Full mapped-number coverage | 14,289 entries checked; 0 missing mapped lexicon numbers | Show as available where KJV Strong's mapping exists; continue display polish and source notes. |
| Strong's KJV word mapping | Full Bible chapter coverage | 724,963 reviewed rows across 1,189/1,189 chapters and 66/66 books | Safe to describe as reviewed full-Bible chapter coverage, while still noting that KJV-to-original-language alignment is a reviewed study aid. |
| TSK / cross references | Chapter-complete | 6,118 public rows covering 1,189/1,189 chapters | Show as reviewed cross references; next work is deeper verse-level coverage and ranking strongest references first. |
| Commentaries | Broad public coverage | 13,789 public rows checked by validation; 66 books covered | Continue completion by author, parsing quality, and chapter/verse usefulness. |
| Study reference tools | Present | 9/9 core files present | Integrate from Passage Guide and Bible Reader. |

## What Is Complete Enough For Beta

- Webster lookup is large enough to be a core feature.
- Commentary coverage is broad enough to be a core feature, but author depth varies.
- Strong's word-to-number mapping is available across every Bible chapter, with complete lexicon-card coverage for the mapped Strong's numbers.
- TSK references are now chapter-complete across the Bible.
- Nave, Easton, Smith, Webster, and related tools are useful for discovery, but structured lookup polish should continue.

## What Is Not Complete Yet

- TSK display priority still needs better ranking when large batches are promoted.
- Webster has broad coverage, but 4,246 entries have high or medium cleanup flags and the most-used messy entries need reviewed overrides.
- Some public-domain dictionary/reference imports are text resources but are not yet fully structured lookup databases.
- Nave is useful for topic discovery, but rough OCR records should remain hidden or marked for review before quotation.

## Strong's Finish Plan

1. Keep the current CrossWire OSIS source and generated reviewed mappings documented.
2. Rebuild the public mapping index whenever mapping batches change:

```bash
npm run build:strongs-mapping-index
npm run validate:strongs-mapping
```

3. Run strict lexicon validation only when expanding or changing lexicon cards:

```bash
npm run validate:strongs-mapping -- --strict-lexicon
```

4. Improve the user-facing word panel: clearer glosses, roots, word families, first occurrence, key occurrences, and sermon/teaching value.
5. Store full indexes server-side or in object storage if growth threatens Vercel bundle size.

## TSK Finish Plan

1. Keep current public reviewed files in `data/imports/`.
2. Continue using MetaV/OpenBible as staging sources only if attribution/license obligations are accepted.
3. Prefer a public-domain scan/OCR Treasury source for long-term unrestricted import.
4. Deepen verse-level references and rank strongest references first now that chapter coverage is complete.
5. Continue spot-checking public-domain TSK source tradition and attribution notes before promoting larger batches.
6. Validate every promoted file:

```bash
npm run validate:tsk -- data/imports/<reviewed-tsk-file>.json
```

7. Do not scrape rendered Bible study websites.
8. Do not import Bible quotation text from non-KJV or copyrighted Bible editions.

## Bible Reader Improvement Rule

The Bible Reader should show one simple study status line:

- Commentary entries available
- Cross references available
- Strong's mapped words available
- Webster lookup available

If a tool is incomplete for that chapter, say "starter coverage" or "reviewed entries only" instead of implying full coverage.

## Next Best Work

1. Add reviewed Webster overrides for the highest-use messy theology and Bible-study words: atonement, faith, grace, judgment, repentance, justification, righteousness, mercy, and prophecy.
2. Improve the Study Data Coverage badge in the Bible Reader and Passage Guide so users see what is complete without hunting.
3. Deepen TSK verse-level coverage and ranking now that every chapter has coverage.
4. Continue commentary completion with Biblical Illustrator, Pulpit Commentary, Matthew Poole, and Ironside only where source and rights are clean.
5. Keep large commentary scans out of the app bundle when they threaten Vercel size; prefer indexed records, R2 storage, and structured excerpts.
