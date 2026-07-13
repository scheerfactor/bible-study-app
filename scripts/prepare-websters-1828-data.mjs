#!/usr/bin/env node
import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { normalizeHeadword } from "./import-utils.mjs";

const defaultSources = [
  "data/sources/websters-1828/americandictiona01websrich_djvu.txt",
  "data/sources/websters-1828/americandictiona02websrich_djvu.txt",
];
const outputPath = process.argv[2] || "data/generated/websters-1828.entries.json";
const sourceFiles = process.argv.slice(3).length ? process.argv.slice(3) : defaultSources;

const missingSourceFiles = [];
for (const sourceFile of sourceFiles) {
  try {
    await access(sourceFile);
  } catch {
    missingSourceFiles.push(sourceFile);
  }
}

if (missingSourceFiles.length) {
  const existingEntries = JSON.parse(await readFile(outputPath, "utf8"));
  if (!Array.isArray(existingEntries) || !existingEntries.length) {
    throw new Error(`Webster source files are unavailable and ${outputPath} has no reusable structured data.`);
  }

  console.log("Webster source scans are not present in this storage-first worktree.");
  console.log("Preserving the existing structured base; reviewed overlays remain separate and are merged by the app at read time.");
  console.table({
    output: outputPath,
    existing_entries: existingEntries.length,
    missing_sources: missingSourceFiles.length,
  });
  for (const sourceFile of missingSourceFiles) console.log(`- ${sourceFile}`);
  process.exit(0);
}

function normalizedText(line) {
  return line.replace(/\s+/g, " ").trim();
}

function isEntryStart(line) {
  const cleaned = normalizedText(line);
  const match = cleaned.match(/^([A-Z][A-Z'\- ]{1,45})[,.]\s+(.{1,70})/);
  if (!match) return null;

  const headword = match[1].trim();
  const tail = match[2].trim();
  if (!/[A-Za-z]/.test(tail)) return null;
  if (/^(and|or|but|the)\b/i.test(tail)) return null;
  if (/^\d+$/.test(headword)) return null;
  if (headword.split(/\s+/).length > 3) return null;

  return headword;
}

function cleanDefinition(lines) {
  return lines
    .map(normalizedText)
    .filter(Boolean)
    .filter((line) => !/^Vol\.?\s+[IVXLC]+\.?$/i.test(line))
    .filter((line) => !/^\d+$/.test(line))
    .filter((line) => !/^AMERICAN DICTIONARY/i.test(line))
    .join(" ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function displayHeadword(value) {
  return value.replace(/\s+/g, " ").trim();
}

const entries = [];
const sourceSummaries = [];

for (const sourceFile of sourceFiles) {
  const raw = await readFile(sourceFile, "utf8");
  const lines = raw.split(/\r?\n/);
  const starts = [];

  for (let index = 0; index < lines.length; index += 1) {
    const headword = isEntryStart(lines[index]);
    if (!headword) continue;
    if (index < 20000 && sourceFile.includes("01websrich")) continue;
    starts.push({ headword, index });
  }

  for (let startIndex = 0; startIndex < starts.length; startIndex += 1) {
    const start = starts[startIndex];
    const end = starts[startIndex + 1]?.index ?? lines.length;
    const definition = cleanDefinition(lines.slice(start.index, end));
    const normalized = normalizeHeadword(start.headword.replace(/'/g, ""));

    if (!normalized || definition.length < 12) continue;

    entries.push({
      headword: displayHeadword(start.headword),
      normalized_headword: normalized,
      definition,
      source_title: "American Dictionary of the English Language",
      source_file: sourceFile,
      source_line_start: start.index + 1,
      source_line_end: end,
      review_status: "ocr_full_import_needs_spot_review",
    });
  }

  sourceSummaries.push({
    source_file: sourceFile,
    sha256: createHash("sha256").update(raw).digest("hex"),
    entry_starts_found: starts.length,
  });
}

entries.sort((a, b) => {
  const headwordCompare = a.normalized_headword.localeCompare(b.normalized_headword);
  if (headwordCompare) return headwordCompare;
  return a.source_line_start - b.source_line_start;
});

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");

console.log("Webster 1828 generated data summary");
console.table({
  output: outputPath,
  entries: entries.length,
  sources: sourceFiles.length,
});
console.table(sourceSummaries);
