#!/usr/bin/env node
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import verses1769 from "es-kjv/json/verses-1769.js";

const importsDirectory = path.join("data", "imports");
const outputPath = path.join("data", "commentary", "reports", "commentary-chapter-file-index.json");

const fileNames = (await readdir(importsDirectory))
  .filter(
    (fileName) =>
      fileName.endsWith(".json") &&
      fileName.includes("commentary") &&
      !fileName.startsWith("commentary-acquisition-"),
  )
  .sort();
const fileIndexByName = new Map(fileNames.map((fileName, index) => [fileName, index]));

const chapterFiles = new Map();
const indexedFiles = new Set();
let rowCount = 0;

for (const fileName of fileNames) {
  const rows = JSON.parse(await readFile(path.join(importsDirectory, fileName), "utf8"));

  if (!Array.isArray(rows)) {
    throw new Error(`Commentary import must contain an array: ${fileName}`);
  }

  for (const row of rows) {
    const book = String(row.book ?? "").trim();
    const chapter = Number(row.chapter);

    if (!book || !Number.isInteger(chapter) || chapter < 1) {
      throw new Error(`Commentary row has an invalid book or chapter: ${fileName}`);
    }

    const key = `${book}|${chapter}`;
    const files = chapterFiles.get(key) ?? new Set();
    files.add(fileName);
    chapterFiles.set(key, files);
    indexedFiles.add(fileName);
    rowCount += 1;
  }
}

const chapters = Object.fromEntries(
  Array.from(chapterFiles.entries())
    .sort(([left], [right]) => left.localeCompare(right, "en", { numeric: true }))
    .map(([key, files]) => [
      key,
      Array.from(files)
        .map((fileName) => fileIndexByName.get(fileName))
        .filter((index) => index !== undefined)
        .sort((left, right) => left - right),
    ]),
);

const index = {
  schema_version: 1,
  catalog_file_count: fileNames.length,
  indexed_file_count: indexedFiles.size,
  row_count: rowCount,
  chapter_count: Object.keys(chapters).length,
  files: fileNames,
  chapters,
};
const validChapterKeys = new Set(
  Object.keys(verses1769).flatMap((reference) => {
    const match = reference.match(/^(.+) (\d+):\d+$/);
    return match ? [`${match[1]}|${Number(match[2])}`] : [];
  }),
);
const indexedChapterKeys = new Set(Object.keys(chapters));
const missingChapterKeys = Array.from(validChapterKeys).filter((key) => !indexedChapterKeys.has(key));
const unexpectedChapterKeys = Array.from(indexedChapterKeys).filter((key) => !validChapterKeys.has(key));

if (missingChapterKeys.length || unexpectedChapterKeys.length) {
  throw new Error(
    `Commentary chapter index coverage mismatch: ${missingChapterKeys.length} missing, ${unexpectedChapterKeys.length} unexpected.`,
  );
}

const serializedIndex = `${JSON.stringify(index)}\n`;

if (process.argv.includes("--check")) {
  const currentIndex = await readFile(outputPath, "utf8");
  if (currentIndex !== serializedIndex) {
    throw new Error(`Commentary chapter index is stale. Run npm run build:commentary-index.`);
  }
} else {
  await writeFile(outputPath, serializedIndex, "utf8");
}

console.log(
  process.argv.includes("--check")
    ? `Commentary chapter index is current: ${outputPath}.`
    : `Commentary chapter index written to ${outputPath}.`,
);
console.log(`Catalog files: ${index.catalog_file_count}`);
console.log(`Indexed files: ${index.indexed_file_count}`);
console.log(`Rows indexed: ${index.row_count}`);
console.log(`Chapters indexed: ${index.chapter_count}`);
