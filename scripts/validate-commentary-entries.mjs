#!/usr/bin/env node
import verses1769 from "es-kjv/json/verses-1769.js";
import { readJsonOrCsv } from "./import-utils.mjs";

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: npm run validate:commentary -- <path-to-commentary-json-or-csv>");
  process.exit(1);
}

const rows = await readJsonOrCsv(filePath);
const validRefs = new Set(Object.keys(verses1769));
const seen = new Set();
const errors = [];
const chaptersCovered = new Set();

const requiredFields = [
  "reference",
  "book",
  "chapter",
  "verse_start",
  "verse_end",
  "author",
  "resource_title",
  "source_title",
  "source_url",
  "public_domain_status",
  "rights_basis",
  "recommended_use",
  "entry_text",
];

rows.forEach((row, index) => {
  const rowNumber = index + 1;
  const book = String(row.book ?? "").trim();
  const chapter = Number(row.chapter);
  const verseStart = Number(row.verse_start);
  const verseEnd = Number(row.verse_end);
  const author = String(row.author ?? "").trim();
  const resourceTitle = String(row.resource_title ?? "").trim();
  const key = `${book}|${chapter}|${verseStart}|${verseEnd}|${author}|${resourceTitle}`;

  requiredFields.forEach((field) => {
    if (!String(row[field] ?? "").trim()) {
      errors.push(`Row ${rowNumber}: missing ${field}.`);
    }
  });

  if (!Number.isInteger(chapter) || chapter < 1) {
    errors.push(`Row ${rowNumber}: invalid chapter ${row.chapter}.`);
  }

  if (!Number.isInteger(verseStart) || verseStart < 1) {
    errors.push(`Row ${rowNumber}: invalid verse_start ${row.verse_start}.`);
  }

  if (!Number.isInteger(verseEnd) || verseEnd < verseStart) {
    errors.push(`Row ${rowNumber}: invalid verse_end ${row.verse_end}.`);
  }

  if (book && chapter && verseStart && !validRefs.has(`${book} ${chapter}:${verseStart}`)) {
    errors.push(`Row ${rowNumber}: start verse does not resolve in KJV data: ${book} ${chapter}:${verseStart}.`);
  }

  if (book && chapter && verseEnd && !validRefs.has(`${book} ${chapter}:${verseEnd}`)) {
    errors.push(`Row ${rowNumber}: end verse does not resolve in KJV data: ${book} ${chapter}:${verseEnd}.`);
  }

  if (seen.has(key)) {
    errors.push(`Row ${rowNumber}: duplicate commentary entry: ${key}.`);
  }

  seen.add(key);
  if (book && chapter) chaptersCovered.add(`${book} ${chapter}`);
});

if (errors.length) {
  console.error(`Commentary validation failed for ${filePath}.`);
  errors.slice(0, 50).forEach((error) => console.error(`- ${error}`));
  if (errors.length > 50) console.error(`- ${errors.length - 50} more errors omitted.`);
  process.exit(1);
}

console.log(`Commentary validation passed for ${filePath}.`);
console.log(`Rows checked: ${rows.length}`);
console.log(`Chapters covered: ${chaptersCovered.size}`);
console.log("Duplicate entries: 0");
