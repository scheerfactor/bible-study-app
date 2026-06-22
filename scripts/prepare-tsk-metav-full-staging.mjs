#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import verses1769 from "es-kjv/json/verses-1769.js";
import { readJsonOrCsv } from "./import-utils.mjs";

const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => {
      const [key, ...valueParts] = arg.slice(2).split("=");
      return [key, valueParts.join("=") || "true"];
    }),
);

const sourceDir = path.resolve(process.cwd(), args.get("source-dir") ?? "data/sources/tsk/metav");
const outputDir = path.resolve(process.cwd(), args.get("output-dir") ?? "data/staging/tsk/metav-full");
const chunkSize = Math.max(100, Number(args.get("chunk-size") ?? 2500));
const limit = args.has("limit") ? Number(args.get("limit")) : null;
const download = args.get("download") !== "false";

const sources = {
  verses: {
    fileName: "Verses.csv",
    url: "https://raw.githubusercontent.com/theonize/KJV-bible-database-with-metadata-MetaV-/master/CSV/Verses.csv",
  },
  crossRefs: {
    fileName: "CrossRefIndex.csv",
    url: "https://raw.githubusercontent.com/theonize/KJV-bible-database-with-metadata-MetaV-/master/CSV/CrossRefIndex.csv",
  },
};

const sourceMetadata = {
  source: "TSK",
  source_title: "Treasury of Scripture Knowledge / MetaV CrossRefIndex staging",
  source_url: "https://github.com/theonize/KJV-bible-database-with-metadata-MetaV-/tree/master/CSV",
  public_domain_status:
    "Needs review before public import. MetaV states CrossRefIndex is compiled from R. A. Torrey's public-domain Treasury of Scripture Knowledge, but the repository distribution carries Creative Commons ShareAlike terms.",
  rights_basis:
    "Stage locally for review only. Public promotion requires accepting/documenting CC BY-SA obligations or replacing with a purely public-domain TSK source file.",
  review_status: "Needs Review",
};

const osisToBook = new Map([
  ["Gen", "Genesis"],
  ["Exod", "Exodus"],
  ["Lev", "Leviticus"],
  ["Num", "Numbers"],
  ["Deut", "Deuteronomy"],
  ["Josh", "Joshua"],
  ["Judg", "Judges"],
  ["Ruth", "Ruth"],
  ["1Sam", "1 Samuel"],
  ["2Sam", "2 Samuel"],
  ["1Kgs", "1 Kings"],
  ["2Kgs", "2 Kings"],
  ["1Chr", "1 Chronicles"],
  ["2Chr", "2 Chronicles"],
  ["Ezra", "Ezra"],
  ["Neh", "Nehemiah"],
  ["Esth", "Esther"],
  ["Job", "Job"],
  ["Ps", "Psalms"],
  ["Prov", "Proverbs"],
  ["Eccl", "Ecclesiastes"],
  ["Song", "Solomon's Song"],
  ["Isa", "Isaiah"],
  ["Jer", "Jeremiah"],
  ["Lam", "Lamentations"],
  ["Ezek", "Ezekiel"],
  ["Dan", "Daniel"],
  ["Hos", "Hosea"],
  ["Joel", "Joel"],
  ["Amos", "Amos"],
  ["Obad", "Obadiah"],
  ["Jonah", "Jonah"],
  ["Mic", "Micah"],
  ["Nah", "Nahum"],
  ["Hab", "Habakkuk"],
  ["Zeph", "Zephaniah"],
  ["Hag", "Haggai"],
  ["Zech", "Zechariah"],
  ["Mal", "Malachi"],
  ["Matt", "Matthew"],
  ["Mark", "Mark"],
  ["Luke", "Luke"],
  ["John", "John"],
  ["Acts", "Acts"],
  ["Rom", "Romans"],
  ["1Cor", "1 Corinthians"],
  ["2Cor", "2 Corinthians"],
  ["Gal", "Galatians"],
  ["Eph", "Ephesians"],
  ["Phil", "Philippians"],
  ["Col", "Colossians"],
  ["1Thess", "1 Thessalonians"],
  ["2Thess", "2 Thessalonians"],
  ["1Tim", "1 Timothy"],
  ["2Tim", "2 Timothy"],
  ["Titus", "Titus"],
  ["Phlm", "Philemon"],
  ["Heb", "Hebrews"],
  ["Jas", "James"],
  ["1Pet", "1 Peter"],
  ["2Pet", "2 Peter"],
  ["1John", "1 John"],
  ["2John", "2 John"],
  ["3John", "3 John"],
  ["Jude", "Jude"],
  ["Rev", "Revelation"],
]);

function osisToReference(osisRef) {
  const [book, chapter, verse] = String(osisRef ?? "").split(".");
  const bookName = osisToBook.get(book);
  if (!bookName || !chapter || !verse) return null;
  const reference = `${bookName} ${Number(chapter)}:${Number(verse)}`;
  return verses1769[reference] ? reference : null;
}

async function downloadSource({ fileName, url }) {
  const filePath = path.join(sourceDir, fileName);
  if (!download) return filePath;

  await fs.mkdir(sourceDir, { recursive: true });
  const response = await fetch(url, { headers: { "User-Agent": "fbbs-study-tools-import" } });
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  await fs.writeFile(filePath, await response.text(), "utf8");
  return filePath;
}

function chunkRows(rows) {
  const chunks = [];
  for (let index = 0; index < rows.length; index += chunkSize) {
    chunks.push(rows.slice(index, index + chunkSize));
  }
  return chunks;
}

await fs.mkdir(outputDir, { recursive: true });

const [versesPath, crossRefsPath] = await Promise.all([
  downloadSource(sources.verses),
  downloadSource(sources.crossRefs),
]);

const verses = await readJsonOrCsv(versesPath);
const verseById = new Map();
for (const verse of verses) {
  const reference = osisToReference(verse.OsisRef);
  if (reference) verseById.set(String(verse.VerseID), reference);
}

const crossRefs = await readJsonOrCsv(crossRefsPath);
const staged = [];
const seen = new Set();
const stats = {
  sourceVerses: verses.length,
  sourceCrossRefs: crossRefs.length,
  skippedMissingVerse: 0,
  skippedDuplicate: 0,
  skippedLimit: 0,
};

for (const row of crossRefs) {
  if (limit && staged.length >= limit) {
    stats.skippedLimit += 1;
    continue;
  }

  const verseRef = verseById.get(String(row.VerseID));
  const targetRef = verseById.get(String(row.VerseRefID));
  if (!verseRef || !targetRef) {
    stats.skippedMissingVerse += 1;
    continue;
  }

  const key = `${verseRef}|${targetRef}|${sourceMetadata.source}`;
  if (seen.has(key)) {
    stats.skippedDuplicate += 1;
    continue;
  }
  seen.add(key);

  staged.push({
    verse_ref: verseRef,
    target_ref: targetRef,
    label: "",
    ...sourceMetadata,
  });
}

const chunks = chunkRows(staged);
const writtenFiles = [];
for (const [index, rows] of chunks.entries()) {
  const fileName = `tsk-metav-full-staging-${String(index + 1).padStart(3, "0")}.json`;
  const filePath = path.join(outputDir, fileName);
  await fs.writeFile(filePath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  writtenFiles.push(path.relative(process.cwd(), filePath));
}

const report = {
  generated_at: new Date().toISOString(),
  public_import: false,
  source_files: {
    verses: path.relative(process.cwd(), versesPath),
    cross_refs: path.relative(process.cwd(), crossRefsPath),
  },
  output_dir: path.relative(process.cwd(), outputDir),
  chunk_size: chunkSize,
  chunks: writtenFiles.length,
  staged_rows: staged.length,
  ...stats,
  rights_note: sourceMetadata.rights_basis,
};

await fs.writeFile(path.join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log("Full TSK staging prepared");
console.table({
  staged_rows: staged.length,
  chunks: writtenFiles.length,
  output_dir: path.relative(process.cwd(), outputDir),
  public_import: "No - staging only",
});
console.log(`Report: ${path.relative(process.cwd(), path.join(outputDir, "report.json"))}`);
