#!/usr/bin/env node
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const importsDir = "data/imports";
const writeChanges = process.argv.includes("--write");
const maxTrimSearchCharacters = 20000;

const wrapperMarkers = [
  /Gill's Exposition\s+Garner-Howes\s+Everett's Study Notes/i,
  /The Pulpit Commentaries\s+Treasury of Scripture Knowledge/i,
  /Old Testament \(\d+\)\s+Keil\s*&\s*Delitzsch/i,
  /Henry's Complete\s+Henry's Concise\s+Poole's Annotations/i,
  /Individual Books \(\d+\)\s+Ironside's Notes/i,
];

const startPatterns = [
  /\n\s*(?:duction\s+"?\s+class="com-number"[^>]*>\s*)?Intro\s+duction\b/i,
  /\n\s*Verses?\s+\d+(?:[-–]\d+)?\b/i,
  /\n\s*Verse\s+\d+\b/i,
  /\n\s*Introduction\b/i,
];

function normalizeStudyLightArtifacts(text) {
  return String(text)
    .replace(/^duction\s+"?\s+class="com-number"[^>]*>\s*Intro\s+duction\b/i, "Introduction")
    .replace(/\bIntro\s+duction\b/g, "Introduction");
}

function hasWrapperNoise(text) {
  const head = String(text).slice(0, maxTrimSearchCharacters);
  return wrapperMarkers.some((pattern) => pattern.test(head));
}

function trimWrapper(text) {
  const value = String(text);
  const normalizedValue = normalizeStudyLightArtifacts(value);
  const normalizedChanged = normalizedValue !== value;
  if (!hasWrapperNoise(normalizedValue)) {
    return normalizedChanged
      ? { changed: true, text: normalizedValue, reason: "normalized StudyLight artifact" }
      : { changed: false, text: value, reason: "no wrapper" };
  }

  const searchArea = normalizedValue.slice(0, maxTrimSearchCharacters);
  const candidates = startPatterns
    .flatMap((pattern) => Array.from(searchArea.matchAll(new RegExp(pattern.source, `${pattern.flags.includes("i") ? "i" : ""}g`))))
    .map((match) => match.index ?? -1)
    .filter((index) => index > 0)
    .sort((left, right) => left - right);

  if (!candidates.length) return { changed: false, text: value, reason: "no commentary start found" };

  const trimIndex = candidates[0];
  const next = normalizedValue.slice(trimIndex).trim();
  if (next.length < 250) return { changed: false, text: value, reason: "trim would leave too little text" };
  if (next === value) return normalizedChanged
    ? { changed: true, text: normalizedValue, reason: "normalized StudyLight artifact" }
    : { changed: false, text: value, reason: "unchanged" };
  return { changed: true, text: next, reason: `trimmed ${trimIndex} characters` };
}

const files = (await readdir(importsDir))
  .filter((file) => file.endsWith(".json") && file.includes("commentary"))
  .map((file) => path.join(importsDir, file))
  .sort();

const changedFiles = [];
const skippedRows = [];
let changedRows = 0;
let scannedRows = 0;

for (const filePath of files) {
  const rows = JSON.parse(await readFile(filePath, "utf8"));
  if (!Array.isArray(rows)) continue;

  let fileChangedRows = 0;
  for (const row of rows) {
    if (!row.entry_text) continue;
    scannedRows += 1;
    const result = trimWrapper(row.entry_text);
    if (result.changed) {
      row.entry_text = result.text;
      fileChangedRows += 1;
      changedRows += 1;
    } else if (result.reason !== "no wrapper" && hasWrapperNoise(row.entry_text)) {
      skippedRows.push({
        file: filePath,
        reference: row.reference ?? `${row.book ?? ""} ${row.chapter ?? ""}`.trim(),
        reason: result.reason,
      });
    }
  }

  if (fileChangedRows) {
    changedFiles.push({ file: filePath, changedRows: fileChangedRows });
    if (writeChanges) await writeFile(filePath, `${JSON.stringify(rows, null, 2)}\n`);
  }
}

console.log(`${writeChanges ? "Cleaned" : "Dry run"} StudyLight commentary wrappers.`);
console.table({
  scanned_rows: scannedRows,
  changed_rows: changedRows,
  changed_files: changedFiles.length,
  skipped_rows: skippedRows.length,
});
if (changedFiles.length) console.table(changedFiles);
if (skippedRows.length) {
  console.log("Skipped rows needing manual review");
  console.table(skippedRows.slice(0, 50));
  if (skippedRows.length > 50) console.log(`...${skippedRows.length - 50} more skipped row(s)`);
}
if (!writeChanges) console.log("Dry run only. Re-run with --write to update files.");
