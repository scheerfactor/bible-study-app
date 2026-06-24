import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = join(repoRoot, "data", "strongs", "kjv-strongs-mappings.reviewed.json");
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

async function main() {
  const mappings = JSON.parse(await readFile(sourcePath, "utf8"));
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
    source_path: "data/strongs/kjv-strongs-mappings.reviewed.json",
    chapters: manifestFiles.length,
    rows: totalRows,
    skipped_rows: skipped,
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
