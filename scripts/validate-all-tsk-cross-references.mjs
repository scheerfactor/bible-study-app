#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import verses1769 from "es-kjv/json/verses-1769.js";
import { readJsonOrCsv } from "./import-utils.mjs";

const importsDir = path.join(process.cwd(), "data", "imports");
const validRefs = new Set(Object.keys(verses1769));
const requiredFields = [
  "verse_ref",
  "target_ref",
  "source",
  "source_title",
  "source_url",
  "public_domain_status",
  "rights_basis",
];

const files = (await readdir(importsDir))
  .filter((file) => /^tsk.*\.(json|csv)$/i.test(file))
  .sort();

if (!files.length) {
  console.error("No TSK import files found in data/imports.");
  process.exit(1);
}

let totalRows = 0;
let totalSourceVerses = 0;
const fileSummaries = [];
const errors = [];
const appSource = await readFile(path.join(process.cwd(), "src", "app", "page.tsx"), "utf8");
const publishableFiles = files.filter((file) => !/(?:needs-review|staging)/i.test(file));

for (const file of publishableFiles) {
  if (!appSource.includes(file)) {
    errors.push(`${file}: reviewed TSK file is not connected to src/app/page.tsx.`);
  }
}

for (const file of files) {
  const filePath = path.join(importsDir, file);
  const rows = await readJsonOrCsv(filePath);
  const seen = new Set();
  const sourceVerses = new Set();

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const verseRef = String(row.verse_ref ?? "").trim();
    const targetRef = String(row.target_ref ?? "").trim();
    const source = String(row.source ?? "").trim();
    const key = `${verseRef}|${targetRef}|${source}`;

    requiredFields.forEach((field) => {
      if (!String(row[field] ?? "").trim()) {
        errors.push(`${file} row ${rowNumber}: missing ${field}.`);
      }
    });

    if (verseRef && !validRefs.has(verseRef)) {
      errors.push(`${file} row ${rowNumber}: source verse does not resolve in KJV data: ${verseRef}.`);
    }

    if (targetRef && !validRefs.has(targetRef)) {
      errors.push(`${file} row ${rowNumber}: target verse does not resolve in KJV data: ${targetRef}.`);
    }

    if (seen.has(key)) {
      errors.push(`${file} row ${rowNumber}: duplicate cross reference: ${key}.`);
    }

    seen.add(key);
    if (verseRef) sourceVerses.add(verseRef);
  });

  totalRows += rows.length;
  totalSourceVerses += sourceVerses.size;
  fileSummaries.push({ file, rows: rows.length, sourceVerses: sourceVerses.size });
}

if (errors.length) {
  console.error("TSK validation failed.");
  errors.slice(0, 75).forEach((error) => console.error(`- ${error}`));
  if (errors.length > 75) console.error(`- ${errors.length - 75} more errors omitted.`);
  process.exit(1);
}

console.log("TSK validation passed for all import files.");
fileSummaries.forEach((summary) => {
  console.log(`- ${summary.file}: ${summary.rows} rows, ${summary.sourceVerses} source verses`);
});
console.log(`Files checked: ${fileSummaries.length}`);
console.log(`Publishable files connected to the reader: ${publishableFiles.length}/${publishableFiles.length}`);
console.log(`Rows checked: ${totalRows}`);
console.log(`Per-file source verse total: ${totalSourceVerses}`);
console.log("Duplicate references: 0");
