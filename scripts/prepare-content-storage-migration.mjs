import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defaultLibraryManifest, libraryContentPath, readLibraryManifest } from "./library-utils.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outputJsonPath = join(repoRoot, "data", "storage", "public-content-storage-inventory.json");
const outputReportPath = join(repoRoot, "STORAGE_MIGRATION_REPORT.md");

const dictionaryFiles = [
  "data/generated/websters-1828.entries.json",
];

const libraryManifestFiles = [
  defaultLibraryManifest,
];

const studyToolFiles = [
  "data/library/verified/eastons-bible-dictionary.txt",
  "data/library/verified/smiths-comprehensive-dictionary-of-the-bible.txt",
  "data/library/verified/naves-topical-bible.txt",
  "data/library/verified/bible-atlas-a-manual-of-biblical-geography-and-history-jesse-lyman-hurlbut-and-john-heyl-vincent.txt",
  "data/library/verified/biblical-geography-and-history-kent-charles-foster.txt",
  "data/library/verified/studies-in-old-testament-history-jesse-lyman-hurlbut.txt",
  "data/library/verified/the-bible-period-by-period-a-manual-for-the-study-of-the-bible-by-periods-josiah-blake-tidwell.txt",
  "data/library/verified/bible-animals-being-a-description-of-every-living-creature-mentioned-in-the-scripture-from-the-ape-to-the-cora.txt",
  "data/library/verified/a-class-book-of-biblical-history-and-geography-with-numerous-maps-osborn-h-s-henry-stafford.txt",
];

const strongsFiles = [
  "data/strongs/sample-verified-strongs.json",
  "data/strongs/lexicon-batches/index.json",
];

const bibleMapMediaFiles = [
  "public/media/bible-maps/hurlbut/assyrian-empire.jpg",
  "public/media/bible-maps/hurlbut/babylonian-empire.jpg",
  "public/media/bible-maps/hurlbut/division-solomons-empire.jpg",
  "public/media/bible-maps/hurlbut/empire-david-solomon.jpg",
  "public/media/bible-maps/hurlbut/exodus-wilderness-sinai.jpg",
  "public/media/bible-maps/hurlbut/herods-temple-sacred-enclosure.jpg",
  "public/media/bible-maps/hurlbut/journeys-of-the-patriarchs.jpg",
  "public/media/bible-maps/hurlbut/map-assets.json",
  "public/media/bible-maps/hurlbut/palestine-among-tribes.jpg",
  "public/media/bible-maps/hurlbut/palestine-ministry-of-jesus.jpg",
  "public/media/bible-maps/hurlbut/passion-week-life-of-christ.jpg",
  "public/media/bible-maps/hurlbut/pauls-first-missionary-journey.jpg",
  "public/media/bible-maps/hurlbut/pauls-second-missionary-journey.jpg",
  "public/media/bible-maps/hurlbut/pauls-third-missionary-journey.jpg",
  "public/media/bible-maps/hurlbut/pauls-voyage-to-rome.jpg",
  "public/media/bible-maps/hurlbut/persian-empire.jpg",
  "public/media/bible-maps/hurlbut/physical-map-palestine.jpg",
  "public/media/bible-maps/hurlbut/roman-empire-new-testament.jpg",
  "public/media/bible-maps/hurlbut/seven-churches-asia.jpg",
  "public/media/bible-maps/hurlbut/table-of-nations.jpg",
  "public/media/bible-maps/hurlbut/temple-time-of-christ.jpg",
];

function relativePath(...parts) {
  return parts.join("/").replace(/^\/+/, "");
}

function humanBytes(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

function checksum(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function contentTypeFor(filePath) {
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".txt")) return "text/plain; charset=utf-8";
  if (filePath.endsWith(".md")) return "text/markdown; charset=utf-8";
  if (filePath.endsWith(".webp")) return "image/webp";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

async function inventoryFile(kind, sourcePath, extra = {}) {
  const absolutePath = join(repoRoot, sourcePath);
  const [buffer, stats] = await Promise.all([readFile(absolutePath), stat(absolutePath)]);

  return {
    kind,
    source_path: sourcePath,
    storage_path: extra.storage_path ?? sourcePath,
    content_type: contentTypeFor(sourcePath),
    size_bytes: stats.size,
    checksum_sha256: checksum(buffer),
    ...extra,
  };
}

async function existingInventoryFile(kind, sourcePath, extra = {}) {
  try {
    return await inventoryFile(kind, sourcePath, extra);
  } catch (error) {
    return {
      kind,
      source_path: sourcePath,
      storage_path: sourcePath,
      missing: true,
      error: error instanceof Error ? error.message : String(error),
      ...extra,
    };
  }
}

function storageBackedInventoryFile(kind, entry, extra = {}) {
  const storagePath = libraryContentPath(entry);
  return {
    kind,
    source_path: entry.content_local_path ?? entry.file_path,
    storage_path: storagePath,
    content_type: contentTypeFor(storagePath),
    size_bytes: Number(entry.file_size_bytes ?? 0),
    checksum_sha256: entry.checksum_sha256,
    storage_backed: true,
    ...extra,
  };
}

async function commentaryFiles() {
  const importsDir = join(repoRoot, "data", "imports");
  const fileNames = (await readdir(importsDir)).filter((fileName) => fileName.endsWith("commentary.json")).sort();
  return fileNames.map((fileName) => relativePath("data", "imports", fileName));
}

async function tskFiles() {
  const importsDir = join(repoRoot, "data", "imports");
  const fileNames = (await readdir(importsDir))
    .filter((fileName) => fileName.includes("tsk") && fileName.endsWith(".json") && !fileName.includes("needs-review"))
    .sort();
  return fileNames.map((fileName) => relativePath("data", "imports", fileName));
}

function summarize(items) {
  const present = items.filter((item) => !item.missing);
  const missing = items.filter((item) => item.missing);
  const totalBytes = present.reduce((sum, item) => sum + item.size_bytes, 0);
  return {
    files: items.length,
    present: present.length,
    missing: missing.length,
    total_bytes: totalBytes,
    total_size: humanBytes(totalBytes),
  };
}

function tableRow(label, summary) {
  return `| ${label} | ${summary.files.toLocaleString()} | ${summary.present.toLocaleString()} | ${summary.missing.toLocaleString()} | ${summary.total_size} |`;
}

function topLargestRows(items, limit = 25) {
  return items
    .filter((item) => !item.missing)
    .sort((a, b) => b.size_bytes - a.size_bytes)
    .slice(0, limit)
    .map((item) => {
      const label = item.title ?? item.batch_name ?? item.source_path;
      return `| ${humanBytes(item.size_bytes)} | ${item.kind} | ${label.replaceAll("|", "\\|")} | \`${item.source_path}\` |`;
    })
    .join("\n");
}

async function main() {
  const libraryManifest = await readLibraryManifest(defaultLibraryManifest);
  const libraryItems = await Promise.all(
    libraryManifest.map((entry) => {
      const extra = {
        storage_path: libraryContentPath(entry),
        title: entry.title,
        author: entry.author,
        category: entry.category,
        source_url: entry.source_url,
      };
      if (entry.content_storage_status === "uploaded" && entry.import_status === "imported_storage" && !entry.content_local_path) {
        return storageBackedInventoryFile("library_text", entry, extra);
      }
      return existingInventoryFile("library_text", entry.content_local_path ?? entry.file_path, extra);
    }),
  );

  const commentaryPaths = await commentaryFiles();
  const commentaryItems = await Promise.all(
    commentaryPaths.map(async (filePath) => {
      const item = await existingInventoryFile("commentary_batch", filePath, { batch_name: basename(filePath) });
      if (!item.missing) {
        const raw = await readFile(join(repoRoot, filePath), "utf8");
        item.entries = JSON.parse(raw).length;
      }
      return item;
    }),
  );

  const dictionaryItems = await Promise.all(dictionaryFiles.map((filePath) => existingInventoryFile("dictionary", filePath)));
  const libraryManifestItems = await Promise.all(
    libraryManifestFiles.map((filePath) => existingInventoryFile("library_manifest", filePath)),
  );
  const studyToolItems = await Promise.all(studyToolFiles.map((filePath) => existingInventoryFile("study_tool", filePath)));
  const strongsItems = await Promise.all(strongsFiles.map((filePath) => existingInventoryFile("strongs_index", filePath)));
  const bibleMapMediaItems = await Promise.all(
    bibleMapMediaFiles.map((filePath) => existingInventoryFile("bible_map_media", filePath)),
  );
  const tskPaths = await tskFiles();
  const tskItems = await Promise.all(tskPaths.map((filePath) => existingInventoryFile("tsk_cross_reference_batch", filePath)));

  const items = [
    ...libraryItems,
    ...commentaryItems,
    ...dictionaryItems,
    ...libraryManifestItems,
    ...studyToolItems,
    ...strongsItems,
    ...bibleMapMediaItems,
    ...tskItems,
  ];
  const summaries = {
    library_text: summarize(libraryItems),
    commentary_batch: summarize(commentaryItems),
    dictionary: summarize(dictionaryItems),
    library_manifest: summarize(libraryManifestItems),
    study_tool: summarize(studyToolItems),
    strongs_index: summarize(strongsItems),
    bible_map_media: summarize(bibleMapMediaItems),
    tsk_cross_reference_batch: summarize(tskItems),
    all_public_content: summarize(items),
  };

  const commentaryEntries = commentaryItems.reduce((sum, item) => sum + Number(item.entries ?? 0), 0);
  const largeLibraryTextItems = libraryItems
    .filter((item) => !item.missing && item.size_bytes >= 1024 * 1024)
    .sort((a, b) => b.size_bytes - a.size_bytes);
  const storageBackedLibraryItems = libraryItems.filter((item) => item.storage_backed);
  const largePublicContentItems = items
    .filter((item) => !item.missing && item.size_bytes >= 1024 * 1024)
    .sort((a, b) => b.size_bytes - a.size_bytes);
  const inventory = {
    generated_at: new Date().toISOString(),
    storage_base_env: "CONTENT_PUBLIC_BASE_URL / NEXT_PUBLIC_CONTENT_BASE_URL",
    path_strategy: "Mirror current repository-relative paths in object storage during the transition.",
    commentary_entries: commentaryEntries,
    summaries,
    large_file_summary: {
      library_text_files_over_1mb: largeLibraryTextItems.length,
      library_text_bytes_over_1mb: largeLibraryTextItems.reduce((sum, item) => sum + item.size_bytes, 0),
      public_content_files_over_1mb: largePublicContentItems.length,
      public_content_bytes_over_1mb: largePublicContentItems.reduce((sum, item) => sum + item.size_bytes, 0),
      storage_backed_library_files: storageBackedLibraryItems.length,
      storage_backed_library_bytes: storageBackedLibraryItems.reduce((sum, item) => sum + item.size_bytes, 0),
    },
    items,
  };

  await mkdir(dirname(outputJsonPath), { recursive: true });
  await writeFile(outputJsonPath, `${JSON.stringify(inventory, null, 2)}\n`);

  const report = `# Storage Migration Report

Generated: ${inventory.generated_at}

## Path Strategy

Mirror current repository-relative paths in object storage during the transition. This lets the existing app fetch the same relative paths from \`CONTENT_PUBLIC_BASE_URL\` and \`NEXT_PUBLIC_CONTENT_BASE_URL\`.

## Inventory Summary

| Area | Files | Present | Missing | Size |
| --- | ---: | ---: | ---: | ---: |
${tableRow("Library text", summaries.library_text)}
${tableRow("Commentary batches", summaries.commentary_batch)}
${tableRow("Dictionary files", summaries.dictionary)}
${tableRow("Library manifests", summaries.library_manifest)}
${tableRow("Study tool files", summaries.study_tool)}
${tableRow("Strong's indexes", summaries.strongs_index)}
${tableRow("Bible map media", summaries.bible_map_media)}
${tableRow("TSK/cross-reference batches", summaries.tsk_cross_reference_batch)}
${tableRow("Total public content", summaries.all_public_content)}

Commentary entries represented in public batch files: ${commentaryEntries.toLocaleString()}

Storage-backed library text already uploaded to object storage: ${storageBackedLibraryItems.length.toLocaleString()} files (${humanBytes(inventory.large_file_summary.storage_backed_library_bytes)}).

## Biggest Storage Pressure

Large library text files over 1 MB: ${largeLibraryTextItems.length.toLocaleString()} files (${humanBytes(inventory.large_file_summary.library_text_bytes_over_1mb)}).

Large public content files over 1 MB: ${largePublicContentItems.length.toLocaleString()} files (${humanBytes(inventory.large_file_summary.public_content_bytes_over_1mb)}).

These are the best first candidates for R2 because moving them out of the deploy bundle gives the largest size relief while keeping metadata, rights notes, and indexes in Git.

| Size | Kind | Resource | Path |
| ---: | --- | --- | --- |
${topLargestRows(largePublicContentItems, 25)}

## Recommended Migration Order

1. Upload all \`library_text\` objects to R2 first. This removes the biggest pressure while preserving Library metadata in Git.
2. Upload \`commentary_batch\` objects next, especially Pulpit Commentary, Biblical Illustrator, Poole, and other large set files.
3. Upload dictionaries and study tools after the reader is confirmed to load external text quickly.
4. Keep manifests, rights metadata, import reports, author profiles, and validation scripts in Git.
5. After production is verified against R2, stop committing new full-text files to \`data/library/verified\`; commit metadata plus storage paths instead.

## Next Commands

\`\`\`bash
npm run storage:plan
npm run storage:upload:r2 -- --dry-run
npm run storage:upload:r2 -- --kind=strongs_index --dry-run
npm run storage:upload:r2 -- --kind=tsk_cross_reference_batch --dry-run
\`\`\`

When R2 credentials and a public base URL are configured:

\`\`\`bash
npm run storage:upload:r2 -- --execute
npm run storage:upload:r2 -- --kind=strongs_index --execute
npm run storage:upload:r2 -- --kind=tsk_cross_reference_batch --execute
\`\`\`

If using Wrangler instead of S3 credentials:

\`\`\`bash
npm run storage:upload:wrangler -- --kind=strongs_index --execute
npm run storage:upload:wrangler -- --kind=tsk_cross_reference_batch --execute
\`\`\`

Required environment variables:

\`\`\`text
CONTENT_PUBLIC_BASE_URL
NEXT_PUBLIC_CONTENT_BASE_URL
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_PUBLIC_CONTENT
\`\`\`

## Safety Notes

- Do not delete Git-backed content until production has been verified against object storage.
- Do not import the next large content batch until the reader, dictionary, study tools, and commentary batches load from object storage.
- Keep rights and review metadata in Git/Supabase; object storage should hold large public content bodies and assets.
`;

  await writeFile(outputReportPath, report);
  console.log(`Storage inventory written: ${outputJsonPath}`);
  console.log(`Storage report written: ${outputReportPath}`);
  console.table(summaries);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
