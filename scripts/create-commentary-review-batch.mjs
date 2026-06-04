#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import verses1769 from "es-kjv/json/verses-1769.js";

const sourceArg = valueFor("--source") ?? "data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json";
const outputArg = valueFor("--output") ?? "data/imports/jfb-reviewed-batch-1-commentary.json";
const refsArg = valueFor("--refs");
const batchSize = Number(valueFor("--batch-size") ?? 50);
const minBatchSize = Number(valueFor("--min-batch-size") ?? 25);
const batchName = valueFor("--batch-name") ?? "reviewed batch";
const idSuffix = slugify(batchName);
const prunePublicConflicts = process.argv.includes("--prune-public-conflicts");
const dryRun = process.argv.includes("--dry-run");

if (!refsArg) {
  console.error("Usage: npm run commentary:review-batch -- --refs=\"John 1-5,Romans 1-8\" [--source=...] [--output=...] [--prune-public-conflicts] [--dry-run]");
  process.exit(1);
}

const verseEndByChapter = new Map();
for (const reference of Object.keys(verses1769)) {
  const match = reference.match(/^(.+) (\d+):(\d+)$/);
  if (!match) continue;
  const [, book, chapterRaw, verseRaw] = match;
  const key = `${book} ${Number(chapterRaw)}`;
  verseEndByChapter.set(key, Math.max(verseEndByChapter.get(key) ?? 0, Number(verseRaw)));
}

const targetRefs = parseReferenceList(refsArg);
const sourceRows = JSON.parse(await readFile(sourceArg, "utf8"));
if (!Array.isArray(sourceRows)) throw new Error("Source commentary file must be a JSON array.");

if (targetRefs.length < minBatchSize || targetRefs.length > batchSize) {
  throw new Error(`Review batch must contain ${minBatchSize}-${batchSize} chapters. Current selection has ${targetRefs.length}.`);
}

const byReference = new Map(sourceRows.map((row) => [`${row.book} ${row.chapter}`, row]));
const missingTargets = targetRefs.filter((reference) => !byReference.has(reference));
if (missingTargets.length) {
  throw new Error(`Missing staged commentary rows for: ${missingTargets.join(", ")}`);
}

const reviewedRows = targetRefs.map((reference, index) => {
  const sourceRow = byReference.get(reference);
  const verseEnd = verseEndByChapter.get(reference) ?? sourceRow.verse_end;
  return {
    ...sourceRow,
    id: `${sourceRow.id}-${idSuffix}`,
    verse_end: verseEnd,
    review_status: "Verified",
    import_status: "Public Verified",
    review_batch: batchName,
    review_notes: "Chapter-level source, rights, and reference review completed for public commentary promotion.",
    sort_order: index + 1,
  };
});

const publicImportFiles = await findPublicCommentaryImportFiles();
const reviewedKeys = new Set(reviewedRows.map(publicKey));
const prunedFiles = [];
const duplicateConflicts = [];

for (const filePath of publicImportFiles) {
  if (path.resolve(filePath) === path.resolve(outputArg)) continue;
  const rows = JSON.parse(await readFile(filePath, "utf8"));
  if (!Array.isArray(rows)) continue;
  const keptRows = rows.filter((row) => !reviewedKeys.has(publicKey(row)));
  const removedCount = rows.length - keptRows.length;
  if (!removedCount) continue;

  duplicateConflicts.push({ filePath, removedCount });
  if (prunePublicConflicts && !dryRun) {
    await writeFile(filePath, `${JSON.stringify(keptRows, null, 2)}\n`);
    prunedFiles.push({ filePath, removedCount });
  }
}

if (duplicateConflicts.length && !prunePublicConflicts) {
  console.error("Duplicate public commentary conflicts found. Re-run with --prune-public-conflicts after reviewing the removals.");
  console.table(duplicateConflicts);
  process.exit(1);
}

if (!dryRun) {
  await mkdir(path.dirname(outputArg), { recursive: true });
  await writeFile(outputArg, `${JSON.stringify(reviewedRows, null, 2)}\n`);
}

console.log(`${dryRun ? "Dry run OK" : "Created"} commentary review batch.`);
console.table({
  selected_chapters: targetRefs.length,
  output: outputArg,
  public_conflict_files: duplicateConflicts.length,
  pruned_files: prunedFiles.length,
});
if (duplicateConflicts.length) console.table(duplicateConflicts);

function valueFor(name) {
  const argument = process.argv.find((arg) => arg.startsWith(`${name}=`));
  return argument?.slice(name.length + 1);
}

function parseReferenceList(value) {
  return value
    .split(",")
    .flatMap((part) => {
      const trimmed = part.trim();
      const match = trimmed.match(/^(.+?)\s+(\d+)(?:-(\d+))?$/);
      if (!match) throw new Error(`Invalid reference range: ${trimmed}`);
      const [, book, startRaw, endRaw] = match;
      const start = Number(startRaw);
      const end = Number(endRaw ?? startRaw);
      const references = [];
      for (let chapter = start; chapter <= end; chapter += 1) {
        references.push(`${normalizeBookName(book)} ${chapter}`);
      }
      return references;
    });
}

function normalizeBookName(value) {
  const compact = String(value).trim().replace(/\s+/g, " ").toLowerCase();
  const books = Array.from(new Set(Object.keys(verses1769).map((reference) => reference.replace(/ \d+:\d+$/, ""))));
  const book = books.find((candidate) => candidate.toLowerCase() === compact);
  if (!book) throw new Error(`Unknown Bible book: ${value}`);
  return book;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function findPublicCommentaryImportFiles() {
  const files = await readdir("data/imports");
  return files
    .filter((file) => file.endsWith(".json") && file.includes("commentary"))
    .map((file) => path.join("data/imports", file))
    .sort();
}

function publicKey(row) {
  return [
    row.book,
    row.chapter,
    row.verse_start,
    row.verse_end,
    row.author,
    row.resource_title,
  ].join("|");
}
