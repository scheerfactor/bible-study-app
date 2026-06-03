# Library Import Workflow

Goal: add trusted public-domain resources quickly without letting copyrighted, unclear, or unreviewed material into the public Library.

## 1. Add Sources

Add rows to:

```text
data/library/bulk-import-sources.csv
```

Required columns:

```text
title,author,source_url,category,collection,rights_status,doctrinal_status,warning_label,recommended_use
```

Use trusted source pages first:

- Project Gutenberg
- CCEL
- Internet Archive items with clear public-domain status

The starter CSV intentionally contains already-imported examples. That makes the first dry run safe and proves duplicate protection. Replace or append fresh rows when preparing a real batch.

## 2. Batch Size

Start small:

```bash
npm run library:bulk-import -- --dry-run --batch-size=10
```

Then grow only after clean reports:

```bash
npm run library:bulk-import -- --dry-run --batch-size=25
npm run library:bulk-import -- --dry-run --batch-size=50
npm run library:bulk-import -- --dry-run --batch-size=100
```

## 3. Review Rules

Only rows with both of these values can be publicly imported:

```text
rights_status=Verified
doctrinal_status=Reviewed
```

Anything else is routed into review reporting:

- Needs Review
- Permission Needed
- Personal Use Only
- Do Not Import

David Cloud / Way of Life resources must stay Permission Needed unless written permission exists. User-purchased books must stay personal-use-only and must not be published globally.

## 4. Dry Run

Always dry-run first:

```bash
npm run library:bulk-import -- --dry-run --batch-size=10
```

Check the report for:

- missing metadata
- possible rights issues
- duplicate title + author
- duplicate source URL
- unavailable TXT download path

## 5. Import

When the dry run is clean:

```bash
npm run library:bulk-import -- --batch-size=10
```

The importer will:

- read the CSV
- infer Project Gutenberg TXT download URLs when possible
- download trusted TXT sources
- remove Project Gutenberg boilerplate when markers are present
- calculate checksum, word count, file size, and reading time
- create manifest entries
- generate fallback cover metadata
- skip duplicates
- write a report to `data/library/manifests/bulk-import-report.json`

## 6. Fix Failed Imports

If a row fails:

1. Confirm the source page is trusted.
2. Confirm the resource is public domain in the United States.
3. Use a direct TXT/Markdown source where possible.
4. Fix missing title, author, category, collection, warning, and recommended-use fields.
5. Re-run dry-run.

If the rights are not clear, set:

```text
rights_status=Needs Review
```

or:

```text
rights_status=Permission Needed
```

## 7. QA

Run all checks before committing:

```bash
npm run library:qa
npm run library:validate
npm run lint
npm run build
```

`library:qa` verifies:

- all files exist
- all public resources are verified
- no permission-needed resources are public
- duplicate source/title/checksum protection
- shelf counts
- key author-page resource counts

## 8. Deploy Safely

After QA passes:

```bash
git status --short
git add data/library scripts package.json LIBRARY_IMPORT_WORKFLOW.md
git commit -m "Add bulk library import automation"
git push origin main
```

Then deploy to production and test:

- Library count
- Search
- Resource detail
- Reader
- Listen controls
- Mobile layout
- No console errors
