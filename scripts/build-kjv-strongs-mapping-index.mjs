#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const batchesDir = path.resolve(process.cwd(), "data/strongs/mapping-batches");
const outputPath = path.resolve(process.cwd(), "data/strongs/kjv-strongs-mappings.reviewed.json");

async function readJsonFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function main() {
  const entries = await fs.readdir(batchesDir, { withFileTypes: true }).catch(() => []);
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(batchesDir, entry.name))
    .sort();

  const combined = [];
  const seen = new Set();
  const duplicates = [];

  for (const file of files) {
    const rows = await readJsonFile(file);
    if (!Array.isArray(rows)) {
      throw new Error(`${path.relative(process.cwd(), file)} must contain a JSON array.`);
    }

    for (const row of rows) {
      if (row.review_status !== "Verified") continue;
      const key = `${row.verse_ref}|${row.token_index}|${row.strongs_number}`;
      if (seen.has(key)) {
        duplicates.push(key);
        continue;
      }
      seen.add(key);
      combined.push(row);
    }
  }

  combined.sort((a, b) =>
    String(a.verse_ref).localeCompare(String(b.verse_ref), undefined, { numeric: true }) ||
    Number(a.token_index) - Number(b.token_index) ||
    String(a.strongs_number).localeCompare(String(b.strongs_number), undefined, { numeric: true }),
  );

  await fs.writeFile(outputPath, `${JSON.stringify(combined, null, 2)}\n`);

  console.log("KJV Strong's mapping index built");
  console.table({
    batchFiles: files.length,
    reviewedRows: combined.length,
    duplicateRowsSkipped: duplicates.length,
    output: path.relative(process.cwd(), outputPath),
  });

  if (duplicates.length) {
    console.warn(`Skipped duplicate mapping rows:\n${duplicates.slice(0, 20).join("\n")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
