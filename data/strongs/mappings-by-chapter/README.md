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

The app API loads `data/strongs/mappings-by-chapter/<book>-<chapter>.json` from content storage for verse and chapter lookups. If a shard is missing, that chapter returns no Strong's mapping rows until it is reviewed, generated, and uploaded.

The reviewed source of truth is `data/strongs/mapping-batches/*.json`. The older full combined mapping index is intentionally not required by the runtime.
