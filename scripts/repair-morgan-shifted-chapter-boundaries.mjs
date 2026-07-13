#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const writeChanges = process.argv.includes("--write");
const repairs = [
  {
    sourceFile: "data/imports/g-campbell-morgan-reviewed-deuteronomy-commentary.json",
    sourceBook: "Deuteronomy",
    sourceChapter: 2,
    marker: "Deu 3:1-29\n\n",
    targetFile: "data/imports/g-campbell-morgan-reviewed-deuteronomy-commentary.json",
    targetBook: "Deuteronomy",
    targetChapter: 3,
  },
  {
    sourceFile: "data/imports/g-campbell-morgan-reviewed-mark-commentary.json",
    sourceBook: "Mark",
    sourceChapter: 16,
    marker: "Luk 1:1-80\n\n",
    targetFile: "data/imports/g-campbell-morgan-reviewed-luke-commentary.json",
    targetBook: "Luke",
    targetChapter: 1,
  },
];

const files = new Map();
const results = [];

async function rowsFor(file) {
  if (!files.has(file)) files.set(file, JSON.parse(await readFile(file, "utf8")));
  return files.get(file);
}

for (const repair of repairs) {
  const sourceRows = await rowsFor(repair.sourceFile);
  const targetRows = await rowsFor(repair.targetFile);
  const source = sourceRows.find(
    (row) => row.resource_title.includes("Morgan") && row.book === repair.sourceBook && row.chapter === repair.sourceChapter,
  );
  const target = targetRows.find(
    (row) => row.resource_title.includes("Morgan") && row.book === repair.targetBook && row.chapter === repair.targetChapter,
  );
  if (!source || !target) throw new Error(`Missing Morgan boundary rows for ${repair.targetBook} ${repair.targetChapter}.`);

  const markerIndex = source.entry_text.indexOf(repair.marker);
  if (markerIndex < 0) {
    if (target.boundary_repair_sha256) {
      results.push({ book: target.book, chapter: target.chapter, characters: target.entry_text.length, status: "already repaired" });
      continue;
    }
    throw new Error(`Boundary marker not found for ${repair.targetBook} ${repair.targetChapter}.`);
  }
  if (String(target.entry_text ?? "").length >= 100) {
    throw new Error(`Refusing to replace non-thin ${repair.targetBook} ${repair.targetChapter}.`);
  }

  const recoveredText = source.entry_text.slice(markerIndex).trim();
  const retainedText = source.entry_text.slice(0, markerIndex).trim();
  if (recoveredText.length < 500 || retainedText.length < 500) {
    throw new Error(`Boundary size gate failed for ${repair.targetBook} ${repair.targetChapter}.`);
  }

  source.entry_text = retainedText;
  source.review_notes = `${source.review_notes ?? ""} Removed a parser-shifted ${repair.targetBook} ${repair.targetChapter} section and restored it to its correct chapter row.`.trim();
  target.entry_text = recoveredText;
  target.review_status = "Verified";
  target.import_status = "Public Verified";
  target.review_batch = "Morgan Shifted Chapter Boundary Repair";
  target.review_notes =
    `Recovered exact text that the source parser appended to ${repair.sourceBook} ${repair.sourceChapter}. ` +
    "Wording is unchanged; only the chapter boundary was corrected.";
  target.boundary_repair_source_file = repair.sourceFile;
  target.boundary_repair_source_reference = `${repair.sourceBook} ${repair.sourceChapter}`;
  target.boundary_repair_sha256 = createHash("sha256").update(recoveredText).digest("hex");

  results.push({
    book: target.book,
    chapter: target.chapter,
    characters: recoveredText.length,
    retained_source_characters: retainedText.length,
    status: "verified",
    sha256: target.boundary_repair_sha256,
  });
}

if (writeChanges) {
  for (const [file, rows] of files) await writeFile(file, `${JSON.stringify(rows, null, 2)}\n`);
}

console.log(`${writeChanges ? "Repaired" : "Dry-run verified"} ${results.length} Morgan chapter boundaries.`);
console.table(results);
