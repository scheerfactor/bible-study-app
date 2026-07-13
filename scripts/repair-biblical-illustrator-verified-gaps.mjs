#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const writeChanges = process.argv.includes("--write");
const sources = {
  exodus: process.argv.find((argument) => argument.startsWith("--exodus="))?.split("=")[1],
  deuteronomy: process.argv.find((argument) => argument.startsWith("--deuteronomy="))?.split("=")[1],
  proverbs: process.argv.find((argument) => argument.startsWith("--proverbs="))?.split("=")[1],
  firstCorinthians: process.argv
    .find((argument) => argument.startsWith("--first-corinthians="))
    ?.split("=")[1],
  ezra: process.argv.find((argument) => argument.startsWith("--ezra="))?.split("=")[1],
};
if (
  !sources.exodus ||
  !sources.deuteronomy ||
  !sources.proverbs ||
  !sources.firstCorinthians ||
  !sources.ezra
) {
  console.error(
    "Usage: node scripts/repair-biblical-illustrator-verified-gaps.mjs --exodus=/path --deuteronomy=/path --proverbs=/path --first-corinthians=/path --ezra=/path [--write]",
  );
  process.exit(1);
}

const repairs = [
  {
    book: "Exodus",
    chapter: 37,
    importPath: "data/imports/biblical-illustrator-reviewed-exodus-commentary.json",
    sourcePath: sources.exodus,
    archiveIdentifier: "biblicalillustra02exel",
    sourceLineStart: 43229,
    sourceLineEnd: 43232,
    minimumCharacters: 50,
    sourceThinVerified: true,
  },
  {
    book: "Deuteronomy",
    chapter: 25,
    importPath: "data/imports/biblical-illustrator-reviewed-foundation-books-phase-1-commentary.json",
    sourcePath: sources.deuteronomy,
    archiveIdentifier: "biblicalillustra05exel",
    sourceLineStart: 30599,
    sourceLineEnd: 30695,
    minimumCharacters: 5_000,
    sourceThinVerified: false,
  },
  {
    book: "Proverbs",
    chapter: 15,
    importPath: "data/imports/biblical-illustrator-reviewed-proverbs-commentary.json",
    sourcePath: sources.proverbs,
    archiveIdentifier: "biblicalillustra20exel",
    sourceLineStart: 27869,
    sourceLineEnd: 29074,
    minimumCharacters: 75_000,
    sourceThinVerified: false,
  },
  {
    book: "Proverbs",
    chapter: 30,
    importPath: "data/imports/biblical-illustrator-reviewed-proverbs-commentary.json",
    sourcePath: sources.proverbs,
    archiveIdentifier: "biblicalillustra20exel",
    sourceLineStart: 47229,
    sourceLineEnd: 48434,
    minimumCharacters: 75_000,
    sourceThinVerified: false,
  },
  {
    book: "1 Corinthians",
    chapter: 10,
    importPath: "data/imports/biblical-illustrator-reviewed-1-corinthians-6-16-commentary.json",
    sourcePath: sources.firstCorinthians,
    archiveIdentifier: "biblicalillustra462exel",
    sourceLineStart: 45,
    sourceLineEnd: 4978,
    minimumCharacters: 400_000,
    sourceThinVerified: false,
  },
  {
    book: "Ezra",
    chapter: 9,
    importPath: "data/imports/biblical-illustrator-reviewed-weak-books-commentary.json",
    sourcePath: sources.ezra,
    archiveIdentifier: "biblicalillustra13exel",
    sourceLineStart: 24392,
    sourceLineEnd: 25057,
    minimumCharacters: 50_000,
    sourceThinVerified: false,
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

  const rows = importCache.get(repair.importPath);
  const matchingRows = rows.filter(
    (row) =>
      row.resource_title === "The Biblical Illustrator" &&
      row.book === repair.book &&
      row.chapter === repair.chapter,
  );
  if (matchingRows.length !== 1) {
    throw new Error(`Expected one Biblical Illustrator ${repair.book} ${repair.chapter} row.`);
  }
  const row = matchingRows[0];
  const lines = sourceCache.get(repair.sourcePath);
  const exactText = lines.slice(repair.sourceLineStart - 1, repair.sourceLineEnd).join("\n").trim();
  if (exactText.length < repair.minimumCharacters) {
    throw new Error(`Source-size gate failed for Biblical Illustrator ${repair.book} ${repair.chapter}.`);
  }
  const sourceTextSha256 = createHash("sha256").update(exactText).digest("hex");
  if (String(row.entry_text ?? "").length >= 100 && row.source_text_sha256 !== sourceTextSha256) {
    throw new Error(`Refusing to replace non-thin Biblical Illustrator ${repair.book} ${repair.chapter}.`);
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
    "Verified public-domain 1905 Biblical Illustrator volume from the Internet Archive; historical OCR source.";
  row.rights_basis =
    `Public-domain historical volume from Internet Archive scan ${repair.archiveIdentifier}; preserve source attribution and OCR provenance.`;
  row.review_batch = "Biblical Illustrator Archive Gap Repair";
  row.review_notes = repair.sourceThinVerified
    ? "The original volume intentionally provides only a cross-reference for this chapter. Exact source text is preserved and verified as source-thin."
    : "Replaced a failed navigation placeholder with source-traceable Archive OCR. Source wording is preserved; only trailing whitespace and runs of blank lines are normalized for reading.";
  row.source_line_start = repair.sourceLineStart;
  row.source_line_end = repair.sourceLineEnd;
  row.source_text_sha256 = sourceTextSha256;
  row.source_thin_verified = repair.sourceThinVerified;

  changed.push({
    book: repair.book,
    chapter: repair.chapter,
    characters: readableText.length,
    source_thin_verified: repair.sourceThinVerified,
    source_text_sha256: row.source_text_sha256,
  });
}

if (writeChanges) {
  for (const [importPath, rows] of importCache) {
    await writeFile(importPath, `${JSON.stringify(rows, null, 2)}\n`);
  }
}

console.log(`${writeChanges ? "Repaired" : "Dry-run verified"} ${changed.length} Biblical Illustrator rows.`);
console.table(changed);
