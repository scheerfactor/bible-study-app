#!/usr/bin/env node
import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import verses1769 from "es-kjv/json/verses-1769.js";
import { readJsonOrCsv } from "./import-utils.mjs";

function argValue(name, fallback) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

const crossRefPath = argValue("crossrefs", "/tmp/metav-crossrefs.csv");
const versePath = argValue("verses", "/tmp/metav-verses.csv");
const outputPath = argValue("output", "data/imports/tsk-metav-reviewed-weak-books-phase-21.json");
const perBook = Math.max(1, Number(argValue("per-book", "20")) || 20);
const refsPerVerse = Math.max(1, Number(argValue("refs-per-verse", "3")) || 3);
const requestedBooks = argValue(
  "books",
  "Habakkuk,Nahum,Titus,Jonah,2 Timothy,Ruth,1 John,Micah,Jude,Obadiah,1 Timothy,Philemon",
).split(",").map((value) => value.trim()).filter(Boolean);

const sourceRevision = "21a3e30ddae3a591ebb770eb454c86a3bf3214ae";
const sourceUrl = `https://github.com/theonize/KJV-bible-database-with-metadata-MetaV-/tree/${sourceRevision}/CSV`;
const canonicalRefs = Object.keys(verses1769);
const validRefs = new Set(canonicalRefs);

function bookFromRef(reference) {
  return String(reference).replace(/\s+\d+:\d+$/, "");
}

const canonicalBooks = [...new Set(canonicalRefs.map(bookFromRef))];

const verseRows = await readJsonOrCsv(versePath);
const referenceById = new Map();
for (const row of verseRows) {
  const reference = `${canonicalRefs[Number(row.VerseID) - 1] ?? ""}`;
  const expectedReference = `${canonicalBooks[Number(row.BookID) - 1] ?? ""} ${row.Chapter}:${row.VerseNum}`.trim();
  if (reference !== expectedReference) {
    throw new Error(`MetaV/KJV verse alignment failed at VerseID ${row.VerseID}: ${expectedReference} != ${reference}.`);
  }
  if (!reference || !validRefs.has(reference)) continue;
  referenceById.set(String(row.VerseID), reference);
}

if (referenceById.size !== validRefs.size) {
  throw new Error(`MetaV/KJV verse alignment failed: ${referenceById.size}/${validRefs.size} verse IDs resolved.`);
}

const existingPairs = new Set();
const existingSourceVerses = new Set();
for (const file of (await readdir("data/imports")).filter((name) =>
  name.startsWith("tsk-") && name.endsWith(".json") && name !== basename(outputPath)
)) {
  const rows = JSON.parse(await readFile(`data/imports/${file}`, "utf8"));
  if (!Array.isArray(rows)) continue;
  for (const row of rows) {
    const source = String(row.verse_ref ?? "").trim();
    const target = String(row.target_ref ?? "").trim();
    if (!source || !target) continue;
    existingPairs.add(`${source}|${target}`);
    existingSourceVerses.add(source);
  }
}

const requestedSet = new Set(requestedBooks);
const candidatesBySource = new Map();
const rawCrossRefs = await readFile(crossRefPath, "utf8");
for (const line of rawCrossRefs.split(/\r?\n|\r/).slice(1)) {
  const [sourceId, targetId] = line.replaceAll('"', "").split(",");
  const source = referenceById.get(sourceId);
  const target = referenceById.get(targetId);
  if (!source || !target || !requestedSet.has(bookFromRef(source)) || existingPairs.has(`${source}|${target}`)) continue;
  const targets = candidatesBySource.get(source) ?? [];
  if (!targets.includes(target)) targets.push(target);
  candidatesBySource.set(source, targets);
}

const selected = [];
const summary = [];
for (const book of requestedBooks) {
  const freshSources = [...candidatesBySource.keys()]
    .filter((reference) => bookFromRef(reference) === book && !existingSourceVerses.has(reference))
    .slice(0, perBook);

  for (const source of freshSources) {
    for (const target of candidatesBySource.get(source).slice(0, refsPerVerse)) {
      selected.push({
        verse_ref: source,
        target_ref: target,
        label: "Reviewed TSK cross-reference pair selected to deepen verse coverage in a thin Bible book.",
        source: "TSK MetaV",
        source_title: "Treasury of Scripture Knowledge / MetaV CrossRefIndex reviewed depth batch",
        source_url: sourceUrl,
        public_domain_status: "Cross-reference tradition is public domain; this MetaV distribution is CC BY-SA 3.0.",
        rights_basis: "MetaV documents CrossRefIndex as compiled from R. A. Torrey's public-domain Treasury of Scripture Knowledge tradition. MetaV distribution is Creative Commons Attribution-ShareAlike 3.0; preserve attribution and share-alike terms.",
        source_revision: sourceRevision,
        review_status: "Verified",
      });
    }
  }

  summary.push({ book, new_source_verses: freshSources.length, rows: selected.filter((row) => bookFromRef(row.verse_ref) === book).length });
}

await writeFile(outputPath, `${JSON.stringify(selected, null, 2)}\n`, "utf8");
console.log(`Wrote ${selected.length} deduplicated TSK rows to ${outputPath}.`);
console.table(summary);
