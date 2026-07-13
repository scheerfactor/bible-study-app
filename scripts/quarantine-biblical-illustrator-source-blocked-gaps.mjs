#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const writeChanges = process.argv.includes("--write");
const targets = [
  {
    file: "data/imports/biblical-illustrator-reviewed-ezekiel-13-48-commentary.json",
    book: "Ezekiel",
    chapter: 30,
    sourceVolume: 26,
  },
  {
    file: "data/imports/biblical-illustrator-reviewed-jeremiah-11-52-commentary.json",
    book: "Jeremiah",
    chapter: 19,
    sourceVolume: 24,
  },
  {
    file: "data/imports/biblical-illustrator-reviewed-weak-books-commentary.json",
    book: "Jeremiah",
    chapter: 10,
    sourceVolume: 24,
  },
  {
    file: "data/imports/biblical-illustrator-reviewed-weak-books-phase-2-commentary.json",
    book: "Lamentations",
    chapter: 3,
    sourceVolume: 24,
  },
  {
    file: "data/imports/biblical-illustrator-reviewed-weak-books-phase-2-commentary.json",
    book: "Lamentations",
    chapter: 4,
    sourceVolume: 24,
  },
];

const files = new Map();
const quarantined = [];

for (const target of targets) {
  if (!files.has(target.file)) {
    files.set(target.file, JSON.parse(await readFile(target.file, "utf8")));
  }

  const rows = files.get(target.file);
  const matches = rows.filter(
    (row) =>
      row.resource_title === "The Biblical Illustrator" &&
      row.book === target.book &&
      row.chapter === target.chapter,
  );
  if (matches.length !== 1) {
    throw new Error(`Expected one Biblical Illustrator ${target.book} ${target.chapter} row.`);
  }

  const row = matches[0];
  if (String(row.entry_text ?? "").length >= 100) {
    throw new Error(`Refusing to quarantine non-thin ${target.book} ${target.chapter}.`);
  }

  row.review_status = "Needs Review";
  row.import_status = "Staged";
  row.review_batch = "Biblical Illustrator Source Recovery Queue";
  row.review_notes =
    `Quarantined because the stored text is a failed navigation wrapper, not commentary. ` +
    `The canonical public-domain source is volume ${target.sourceVolume}, but the indexed Internet Archive copy is print-disabled. ` +
    "Do not import or display publicly until an openly accessible scan is verified and exact chapter boundaries are recorded.";
  row.source_recovery_status = "Blocked - open public-domain scan needed";

  quarantined.push({
    book: target.book,
    chapter: target.chapter,
    characters: String(row.entry_text ?? "").length,
    source_volume: target.sourceVolume,
    review_status: row.review_status,
    import_status: row.import_status,
  });
}

if (writeChanges) {
  for (const [file, rows] of files) {
    await writeFile(file, `${JSON.stringify(rows, null, 2)}\n`);
  }
}

console.log(`${writeChanges ? "Quarantined" : "Dry-run verified"} ${quarantined.length} source-blocked rows.`);
console.table(quarantined);
