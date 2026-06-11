# Pending Work Not Deployed

This file documents work that remains in the local workspace but is intentionally left out of the Bible Coverage + Commentary Depth deployment.

## Required For This Sprint

These files should be deployed because the app code or public Library data depends on them:

- `src/app/page.tsx`
- `scripts/create-commentary-source-batch.mjs`
- `LIBRARY_TOTALS.md`
- Public commentary import JSON files referenced by the app page
- Verified public Library manifest and verified text files used by the public Library

## Left Uncommitted

These are useful research/import artifacts, but they are not needed for this production deploy:

- `KJV_BAPTIST_HISTORY_ACQUISITION_REVIEW.md`
- `REQUESTED_AUTHOR_RIGHTS_REVIEW.md`
- Raw commentary markdown/source folders under `commentaries/`
- Raw Amos research and source evidence under `library/amos/`
- Amos study-guide drafts under `study-guides/amos/`
- Bulk import candidate CSV/report files under `data/library/bulk-import-phase-*.csv`
- Bulk import candidate/review reports under `data/library/manifests/bulk-import-phase-*.json`
- Needs-review library queues under `data/library/needs-review/`
- Import helper scripts that are not needed by the deployed app
- Local permission-tracker changes not needed for this sprint

## Handling Notes

- Do not delete these files. They are preserved for future acquisition, review, cleanup, and import work.
- Do not deploy raw source folders until each resource has source, rights, edition, parser, and quality review.
- Keep candidate and needs-review files out of public production unless promoted through the review workflow.
