#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const writeChanges = process.argv.includes("--write");
const targets = [
  {
    file: "data/imports/g-campbell-morgan-reviewed-deuteronomy-commentary.json",
    book: "Deuteronomy",
    chapter: 24,
  },
  {
    file: "data/imports/g-campbell-morgan-reviewed-exodus-commentary.json",
    book: "Exodus",
    chapter: 39,
  },
  {
    file: "data/imports/g-campbell-morgan-reviewed-psalms-commentary.json",
    book: "Psalms",
    chapter: 48,
  },
];

const files = new Map();
const results = [];

for (const target of targets) {
  if (!files.has(target.file)) files.set(target.file, JSON.parse(await readFile(target.file, "utf8")));
  const rows = files.get(target.file);
  const matches = rows.filter(
    (row) => row.resource_title.includes("Morgan") && row.book === target.book && row.chapter === target.chapter,
  );
  if (matches.length !== 1) throw new Error(`Expected one Morgan ${target.book} ${target.chapter} row.`);

  const row = matches[0];
  if (String(row.entry_text ?? "").length >= 100) {
    throw new Error(`Refusing to quarantine non-thin Morgan ${target.book} ${target.chapter}.`);
  }

  row.review_status = "Needs Review";
  row.import_status = "Staged";
  row.review_batch = "Morgan Exposition Source Recovery Queue";
  row.review_notes =
    "Quarantined because the stored text is a failed navigation wrapper or heading-only record, not substantive commentary. " +
    "Do not substitute text from Morgan's distinct Searchlights from the Word or Gospel volumes. " +
    "Restore only from the matching public-domain Exposition/Analyzed Bible source with exact provenance.";
  row.source_recovery_status = "Blocked - matching Morgan source text needed";

  results.push({
    book: row.book,
    chapter: row.chapter,
    characters: String(row.entry_text ?? "").length,
    review_status: row.review_status,
    import_status: row.import_status,
  });
}

if (writeChanges) {
  for (const [file, rows] of files) await writeFile(file, `${JSON.stringify(rows, null, 2)}\n`);
}

console.log(`${writeChanges ? "Quarantined" : "Dry-run verified"} ${results.length} Morgan source-blocked rows.`);
console.table(results);
