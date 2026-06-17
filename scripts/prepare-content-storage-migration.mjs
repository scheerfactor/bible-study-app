import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defaultLibraryManifest, readLibraryManifest } from "./library-utils.mjs";

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
    storage_path: sourcePath,
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

async function commentaryFiles() {
  const importsDir = join(repoRoot, "data", "imports");
  const fileNames = (await readdir(importsDir)).filter((fileName) => fileName.endsWith("commentary.json")).sort();
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

async function main() {
  const libraryManifest = await readLibraryManifest(defaultLibraryManifest);
  const libraryItems = await Promise.all(
    libraryManifest.map((entry) =>
      existingInventoryFile("library_text", entry.file_path, {
        title: entry.title,
        author: entry.author,
        category: entry.category,
        source_url: entry.source_url,
      }),
    ),
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

  const items = [...libraryItems, ...commentaryItems, ...dictionaryItems, ...libraryManifestItems, ...studyToolItems];
  const summaries = {
    library_text: summarize(libraryItems),
    commentary_batch: summarize(commentaryItems),
    dictionary: summarize(dictionaryItems),
    library_manifest: summarize(libraryManifestItems),
    study_tool: summarize(studyToolItems),
    all_public_content: summarize(items),
  };

  const commentaryEntries = commentaryItems.reduce((sum, item) => sum + Number(item.entries ?? 0), 0);
  const inventory = {
    generated_at: new Date().toISOString(),
    storage_base_env: "CONTENT_PUBLIC_BASE_URL / NEXT_PUBLIC_CONTENT_BASE_URL",
    path_strategy: "Mirror current repository-relative paths in object storage during the transition.",
    commentary_entries: commentaryEntries,
    summaries,
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
${tableRow("Total public content", summaries.all_public_content)}

Commentary entries represented in public batch files: ${commentaryEntries.toLocaleString()}

## Next Commands

\`\`\`bash
npm run storage:plan
npm run storage:upload:r2 -- --dry-run
\`\`\`

When R2 credentials and a public base URL are configured:

\`\`\`bash
npm run storage:upload:r2 -- --execute
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
