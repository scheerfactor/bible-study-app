# Commentary Phase 7 Plan

## Goal

Increase public commentary coverage without flooding the app with unreviewed or unclear material. Scripture remains primary; commentary is secondary and labeled.

## Current Rule

No commentary entry becomes public unless it has:

- Author
- Work title
- Bible book and chapter or verse range
- Source URL
- Rights notes
- Review status
- Duplicate check
- Parser/quality check

## Priority 1: Finish Matthew Henry

Matthew Henry remains the safest first full-coverage target because the public-domain path and existing parser flow are already established.

### Batch Order

1. Finish staged chapters already in the review queue.
2. Promote in batches of 50 chapters or fewer.
3. Prioritize:
   - Matthew
   - Mark
   - Luke
   - John
   - Acts
   - Romans
   - Genesis
   - Exodus
   - Psalms
   - Proverbs
   - Revelation
   - Amos

### Review Checks

- Chapter reference resolves to a valid KJV book/chapter.
- Text belongs to Matthew Henry, not another author or editor note.
- Source URL is preserved.
- Entry is not duplicated by author/book/chapter.
- Long entries are readable in the app and listenable without freezing.

## Priority 2: Continue JFB

JFB should continue as the concise comparison voice.

### Batch Order

1. Gospels
2. Romans and Acts
3. Genesis and Exodus
4. Psalms and Proverbs
5. Revelation
6. Amos and minor prophets

### Review Notes

- Keep JFB concise and collapsed by default.
- Use it as a comparison commentary, not the primary devotional commentary.
- Promote only verified batches.

## Priority 3: Continue Barnes, Clarke, and Wesley

These should grow slowly as reviewed comparison voices:

- Barnes: clear explanatory teaching value.
- Clarke: historical and word-study value; use with discernment.
- Wesley: concise practical notes; use with doctrinal labels.

### First Expansion Targets

- John
- Romans
- Luke 24
- Acts
- Psalms
- Revelation
- Amos

## Priority 4: Track Pulpit Commentary Separately

The Pulpit Commentary is a large public-domain candidate, but it should not be merged into the normal import flow until a clean source and parser are proven.

### Requirements Before Import

- Exact volume source URL.
- Edition/public-domain review.
- Parser test on one chapter.
- Doctrinal and editorial warning label.
- Decision whether to expose as commentary, library volume, or both.

### Recommended Pilot

1. Choose one volume: John, Romans, or Matthew.
2. Stage one chapter only.
3. Review display, listening, and export behavior.

## Priority 5: Track The Biblical Illustrator Separately

The Biblical Illustrator is useful for teaching, illustrations, and homiletic material, but it can become noisy. It should be treated as a teaching-help commentary, not a main exegetical commentary.

### Requirements Before Import

- Exact volume source URL.
- Edition/public-domain review.
- Parser test on one chapter.
- Strong labels:
  - Historical value
  - Use with discernment
  - Teaching illustration source
- Decide whether entries should appear in Commentary, Teaching Workspace, or Illustration Library.

## Dashboard Expectations

The Commentary Dashboard should continue showing:

- Public commentary entry count
- Staged commentary entry count
- Verified count by author
- Coverage percentage by Bible book
- Missing chapters by author
- Review backlog count
- Duplicate warnings

## Validation Commands

Run these before any commentary promotion deploy:

```bash
npm run validate:commentary
npm run library:qa
npm run validate:strongs
npm run lint
npm run build
```

## Do Not Do In This Phase

- Do not import unclear modern commentary.
- Do not expose staged commentary publicly.
- Do not import Pulpit Commentary or Biblical Illustrator broadly until the pilot source is proven.
- Do not let commentary dominate Passage Guide, Full Study, or Teaching Workspace.
