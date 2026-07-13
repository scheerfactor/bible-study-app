#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const importDirectory = "data/imports";
const reportPath = "data/commentary/reports/major-commentary-thin-source-audit.json";
const thresholdCharacters = 200;
const majorFamilyPattern =
  /Pulpit|Biblical Illustrator|Barnes|Morgan|Poole|Wesley|Preacher's Complete Homiletical/;

const files = (await readdir(importDirectory))
  .filter((name) => name.endsWith(".json"))
  .sort();
const activeThinRows = [];
const stagedThinRows = [];

for (const file of files) {
  let entries;
  try {
    entries = JSON.parse(await readFile(path.join(importDirectory, file), "utf8"));
  } catch {
    continue;
  }
  if (!Array.isArray(entries)) continue;

  for (const entry of entries) {
    if (!majorFamilyPattern.test(entry.resource_title ?? "")) continue;
    const text = String(entry.entry_text ?? "").trim();
    if (text.length >= thresholdCharacters) continue;

    const row = {
      resource_title: entry.resource_title,
      reference: entry.reference,
      characters: text.length,
      file,
      review_status: entry.review_status ?? null,
      import_status: entry.import_status ?? null,
      review_notes: entry.review_notes ?? null,
      source_recovery_status: entry.source_recovery_status ?? null,
    };
    if (entry.import_status === "Public Verified") activeThinRows.push(row);
    else stagedThinRows.push(row);
  }
}

const byResource = (rows) =>
  Object.entries(
    rows.reduce((groups, row) => {
      (groups[row.resource_title] ??= []).push(row.reference);
      return groups;
    }, {}),
  )
    .map(([resource_title, references]) => ({ resource_title, references }))
    .sort((a, b) => a.resource_title.localeCompare(b.resource_title));

const report = {
  audited_at: new Date().toISOString(),
  threshold_characters: thresholdCharacters,
  review_status: "current_public_and_staged_rows_classified",
  method:
    "Scanned all commentary import files for major commentary-family rows below the threshold and separated public verified rows from staged or quarantined rows.",
  safety_rule:
    "A short row is not automatically defective. Keep genuine brief notes and cross-references when source-verified; stage headings, navigation wrappers, and verse-only placeholders until matching public-domain text is recovered.",
  summary: {
    files_scanned: files.length,
    active_thin_rows: activeThinRows.length,
    staged_thin_rows: stagedThinRows.length,
  },
  active_thin_rows: activeThinRows,
  active_by_resource: byResource(activeThinRows),
  staged_thin_rows: stagedThinRows,
  staged_by_resource: byResource(stagedThinRows),
};

await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log("Major commentary thin-source audit complete.");
console.table(report.summary);
console.log(`Report: ${reportPath}`);
