#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const writeChanges = process.argv.includes("--write");
const sources = {
  numbers: process.argv.find((argument) => argument.startsWith("--numbers="))?.split("=")[1],
  deuteronomy: process.argv.find((argument) => argument.startsWith("--deuteronomy="))?.split("=")[1],
  judges: process.argv.find((argument) => argument.startsWith("--judges="))?.split("=")[1],
  secondKings: process.argv.find((argument) => argument.startsWith("--second-kings="))?.split("=")[1],
};

if (Object.values(sources).some((sourcePath) => !sourcePath)) {
  console.error(
    "Usage: node scripts/repair-pulpit-final-thin-chapters.mjs --numbers=/path --deuteronomy=/path --judges=/path --second-kings=/path [--write]",
  );
  process.exit(1);
}

const repairs = [
  {
    book: "Numbers",
    chapter: 31,
    importPath: "data/imports/pulpit-commentary-reviewed-foundation-books-phase-1-commentary.json",
    sourcePath: sources.numbers,
    archiveIdentifier: "cu31924101105058",
    sourceLineStart: 36813,
    sourceLineEnd: 37897,
  },
  {
    book: "Numbers",
    chapter: 34,
    importPath: "data/imports/pulpit-commentary-reviewed-foundation-books-phase-1-commentary.json",
    sourcePath: sources.numbers,
    archiveIdentifier: "cu31924101105058",
    sourceLineStart: 39829,
    sourceLineEnd: 40950,
  },
  {
    book: "Numbers",
    chapter: 35,
    importPath: "data/imports/pulpit-commentary-reviewed-foundation-books-phase-1-commentary.json",
    sourcePath: sources.numbers,
    archiveIdentifier: "cu31924101105058",
    sourceLineStart: 40951,
    sourceLineEnd: 42178,
  },
  {
    book: "Deuteronomy",
    chapter: 6,
    importPath: "data/imports/pulpit-commentary-reviewed-foundation-books-phase-1-commentary.json",
    sourcePath: sources.deuteronomy,
    archiveIdentifier: "cu31924101104994",
    sourceLineStart: 12416,
    sourceLineEnd: 13765,
  },
  {
    book: "Judges",
    chapter: 21,
    importPath: "data/imports/pulpit-commentary-reviewed-historical-books-phase-1-commentary.json",
    sourcePath: sources.judges,
    archiveIdentifier: "cu31924101104937",
    sourceLineStart: 19912,
    sourceLineEnd: 20474,
  },
  {
    book: "2 Kings",
    chapter: 24,
    importPath: "data/imports/pulpit-commentary-reviewed-historical-books-phase-1-commentary.json",
    sourcePath: sources.secondKings,
    archiveIdentifier: "cu31924101104630",
    sourceLineStart: 45105,
    sourceLineEnd: 46313,
  },
];

const sourceCache = new Map();
const importCache = new Map();
const changed = [];

for (const repair of repairs) {
  if (!sourceCache.has(repair.sourcePath)) {
    sourceCache.set(repair.sourcePath, (await readFile(repair.sourcePath, "utf8")).split(/\r?\n/));
  }
  if (!importCache.has(repair.importPath)) {
    importCache.set(repair.importPath, JSON.parse(await readFile(repair.importPath, "utf8")));
  }

  const lines = sourceCache.get(repair.sourcePath);
  const rows = importCache.get(repair.importPath);
  const matchingRows = rows.filter(
    (row) =>
      row.resource_title === "The Pulpit Commentary" &&
      row.book === repair.book &&
      row.chapter === repair.chapter,
  );
  if (matchingRows.length !== 1) {
    throw new Error(`Expected one Pulpit ${repair.book} ${repair.chapter} row; found ${matchingRows.length}.`);
  }

  const row = matchingRows[0];
  if (String(row.entry_text ?? "").length >= 100) {
    throw new Error(`Refusing to replace non-thin Pulpit ${repair.book} ${repair.chapter}.`);
  }

  const exactText = lines.slice(repair.sourceLineStart - 1, repair.sourceLineEnd).join("\n").trim();
  if (exactText.length < 10_000) {
    throw new Error(`Substantial-text gate failed for Pulpit ${repair.book} ${repair.chapter}.`);
  }
  const readableText = exactText
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{4,}/g, "\n\n\n");
  const sourceUrl = `https://archive.org/download/${repair.archiveIdentifier}/${repair.archiveIdentifier}_djvu.txt`;

  row.entry_text = readableText;
  row.source_url = sourceUrl;
  row.public_domain_status =
    "Cornell University Library scan states that there are no known copyright restrictions in the United States on use of the text.";
  row.rights_basis =
    `Public-domain historical volume from the unrestricted Cornell University Library and Internet Archive scan ${repair.archiveIdentifier}; preserve source attribution and OCR provenance.`;
  row.review_batch = "Pulpit Cornell Final Thin-Source Repair";
  row.review_notes =
    "Replaced a heading-only fallback with source-traceable Cornell OCR. Source wording is preserved; only trailing whitespace and runs of blank lines are normalized for reading.";
  row.source_line_start = repair.sourceLineStart;
  row.source_line_end = repair.sourceLineEnd;
  row.source_text_sha256 = createHash("sha256").update(exactText).digest("hex");

  changed.push({
    book: repair.book,
    chapter: repair.chapter,
    characters: readableText.length,
    source_line_start: repair.sourceLineStart,
    source_line_end: repair.sourceLineEnd,
    source_text_sha256: row.source_text_sha256,
  });
}

if (writeChanges) {
  for (const [importPath, rows] of importCache) {
    await writeFile(importPath, `${JSON.stringify(rows, null, 2)}\n`);
  }
}

console.log(`${writeChanges ? "Repaired" : "Dry-run verified"} ${changed.length} final thin Pulpit rows.`);
console.table(changed);
