# Strong's Chapter Mapping Shards

This directory is generated and intentionally not committed, except for this README.

Generate local chapter shards:

```bash
npm run build:strongs-chapter-shards
```

Upload generated shards to Cloudflare R2:

```bash
npm run storage:upload:strongs-shards -- --execute
```

The app API first tries to load `data/strongs/mappings-by-chapter/<book>-<chapter>.json` from content storage. If a shard is missing, it falls back to the full reviewed mapping index.
