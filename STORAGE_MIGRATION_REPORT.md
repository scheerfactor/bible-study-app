# Storage Migration Report

Generated: 2026-06-23T23:20:35.290Z

## Path Strategy

Mirror current repository-relative paths in object storage during the transition. This lets the existing app fetch the same relative paths from `CONTENT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_CONTENT_BASE_URL`.

## Inventory Summary

| Area | Files | Present | Missing | Size |
| --- | ---: | ---: | ---: | ---: |
| Library text | 1,306 | 1,306 | 0 | 703.46 MB |
| Commentary batches | 125 | 125 | 0 | 321.85 MB |
| Dictionary files | 1 | 1 | 0 | 34.28 MB |
| Library manifests | 1 | 1 | 0 | 2.55 MB |
| Study tool files | 9 | 9 | 0 | 26.41 MB |
| Strong's indexes | 2 | 2 | 0 | 39.33 MB |
| TSK/cross-reference batches | 8 | 8 | 0 | 1.38 MB |
| Total public content | 1,452 | 1,452 | 0 | 1.10 GB |

Commentary entries represented in public batch files: 7,296

## Next Commands

```bash
npm run storage:plan
npm run storage:upload:r2 -- --dry-run
npm run storage:upload:r2 -- --kind=strongs_index --dry-run
npm run storage:upload:r2 -- --kind=tsk_cross_reference_batch --dry-run
```

When R2 credentials and a public base URL are configured:

```bash
npm run storage:upload:r2 -- --execute
npm run storage:upload:r2 -- --kind=strongs_index --execute
npm run storage:upload:r2 -- --kind=tsk_cross_reference_batch --execute
```

If using Wrangler instead of S3 credentials:

```bash
npm run storage:upload:wrangler -- --kind=strongs_index --execute
npm run storage:upload:wrangler -- --kind=tsk_cross_reference_batch --execute
```

Required environment variables:

```text
CONTENT_PUBLIC_BASE_URL
NEXT_PUBLIC_CONTENT_BASE_URL
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_PUBLIC_CONTENT
```

## Safety Notes

- Do not delete Git-backed content until production has been verified against object storage.
- Do not import the next large content batch until the reader, dictionary, study tools, and commentary batches load from object storage.
- Keep rights and review metadata in Git/Supabase; object storage should hold large public content bodies and assets.
