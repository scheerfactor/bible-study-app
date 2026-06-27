import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const batchesDir = join(repoRoot, "data", "strongs", "mapping-batches");
const outDir = join(repoRoot, "data", "strongs", "mappings-by-chapter");

function slugForBook(book) {
  return String(book)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseVerseRef(ref) {
  const match = String(ref).match(/^(.+) (\d+):(\d+)$/);
  if (!match) return null;
  return {
    book: match[1],
    chapter: Number(match[2]),
    verse: Number(match[3]),
  };
}

function checksum(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function cleanGeneratedJson() {
  await mkdir(outDir, { recursive: true });
  const files = await readdir(outDir);
  await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map((file) => rm(join(outDir, file), { force: true })),
  );
}

async function readReviewedMappings() {
  const entries = await readdir(batchesDir, { withFileTypes: true }).catch(() => []);
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => join(batchesDir, entry.name))
    .sort();

  const rows = [];
  const seen = new Set();
  let duplicateRowsSkipped = 0;

  for (const file of files) {
    const batchRows = JSON.parse(await readFile(file, "utf8"));
    if (!Array.isArray(batchRows)) {
      throw new Error(`${file} must contain a JSON array.`);
    }

    for (const row of batchRows) {
      if (row.review_status !== "Verified") continue;
      const key = `${row.verse_ref}|${row.token_index}|${row.strongs_number}`;
      if (seen.has(key)) {
        duplicateRowsSkipped += 1;
        continue;
      }
      seen.add(key);
      rows.push(row);
    }
  }

  return { rows, batchFileCount: files.length, duplicateRowsSkipped };
}

async function main() {
  const { rows: mappings, batchFileCount, duplicateRowsSkipped } = await readReviewedMappings();
  const groups = new Map();
  let skipped = 0;

  for (const mapping of mappings) {
    const parsed = parseVerseRef(mapping.verse_ref);
    if (!parsed) {
      skipped += 1;
      continue;
    }

    const key = `${parsed.book} ${parsed.chapter}`;
    const existing = groups.get(key) ?? {
      book: parsed.book,
      chapter: parsed.chapter,
      rows: [],
    };
    existing.rows.push({ ...mapping, __verse: parsed.verse });
    groups.set(key, existing);
  }

  await cleanGeneratedJson();

  const manifestFiles = [];
  let totalRows = 0;

  for (const group of [...groups.values()].sort((a, b) => a.book.localeCompare(b.book) || a.chapter - b.chapter)) {
    const slug = slugForBook(group.book);
    const fileName = `${slug}-${group.chapter}.json`;
    const storagePath = `data/strongs/mappings-by-chapter/${fileName}`;
    const rows = group.rows
      .sort((a, b) => a.__verse - b.__verse || a.token_index - b.token_index)
      .map((entry) => {
        const row = { ...entry };
        delete row.__verse;
        return row;
      });
    const body = `${JSON.stringify(rows, null, 2)}\n`;
    await writeFile(join(outDir, fileName), body, "utf8");
    totalRows += rows.length;
    manifestFiles.push({
      book: group.book,
      chapter: group.chapter,
      rows: rows.length,
      storage_path: storagePath,
      checksum_sha256: checksum(body),
    });
  }

  const manifest = {
    generated_at: new Date().toISOString(),
    source_path: "data/strongs/mapping-batches/*.json",
    source_batch_files: batchFileCount,
    chapters: manifestFiles.length,
    rows: totalRows,
    skipped_rows: skipped,
    duplicate_rows_skipped: duplicateRowsSkipped,
    files: manifestFiles,
  };
  await writeFile(join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`Strong's chapter shards generated: ${manifestFiles.length} chapters, ${totalRows} rows, ${skipped} skipped.`);
  console.log(`Output: ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
