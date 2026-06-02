#!/usr/bin/env node
import verses1769 from "es-kjv/json/verses-1769.js";
import { readJsonOrCsv } from "./import-utils.mjs";

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: npm run validate:tsk -- <path-to-tsk-json-or-csv>");
  process.exit(1);
}

const rows = await readJsonOrCsv(filePath);
const validRefs = new Set(Object.keys(verses1769));
const seen = new Set();
const errors = [];
const sourceVerses = new Set();
const requiredFields = [
  "verse_ref",
  "target_ref",
  "source",
  "source_title",
  "source_url",
  "public_domain_status",
  "rights_basis",
];

rows.forEach((row, index) => {
  const rowNumber = index + 1;
  const verseRef = String(row.verse_ref ?? "").trim();
  const targetRef = String(row.target_ref ?? "").trim();
  const source = String(row.source ?? "").trim();
  const key = `${verseRef}|${targetRef}|${source}`;

  requiredFields.forEach((field) => {
    if (!String(row[field] ?? "").trim()) {
      errors.push(`Row ${rowNumber}: missing ${field}.`);
    }
  });

  if (verseRef && !validRefs.has(verseRef)) {
    errors.push(`Row ${rowNumber}: source verse does not resolve in KJV data: ${verseRef}.`);
  }

  if (targetRef && !validRefs.has(targetRef)) {
    errors.push(`Row ${rowNumber}: target verse does not resolve in KJV data: ${targetRef}.`);
  }

  if (seen.has(key)) {
    errors.push(`Row ${rowNumber}: duplicate cross reference: ${key}.`);
  }

  seen.add(key);
  if (verseRef) sourceVerses.add(verseRef);
});

if (errors.length) {
  console.error(`TSK validation failed for ${filePath}.`);
  errors.slice(0, 50).forEach((error) => console.error(`- ${error}`));
  if (errors.length > 50) console.error(`- ${errors.length - 50} more errors omitted.`);
  process.exit(1);
}

console.log(`TSK validation passed for ${filePath}.`);
console.log(`Rows checked: ${rows.length}`);
console.log(`Source verses covered: ${sourceVerses.size}`);
console.log(`Duplicate references: 0`);
