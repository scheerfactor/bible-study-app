#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import verses1769 from "es-kjv/json/verses-1769.js";

const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => {
      const [key, ...valueParts] = arg.slice(2).split("=");
      return [key, valueParts.join("=") || "true"];
    }),
);

const inputPath = args.get("input");
const outputPath = args.get("output") ?? "data/imports/tsk-openbible-staging-sample-needs-review.json";
const limit = Number(args.get("limit") ?? 50);
const minVotes = Number(args.get("min-votes") ?? 50);

if (!inputPath) {
  console.error("Usage: npm run prepare:tsk-openbible -- --input=<cross_references.txt> [--output=<json>] [--limit=50] [--min-votes=50]");
  process.exit(1);
}

const bookMap = new Map([
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

const validRefs = new Set(Object.keys(verses1769));

function convertOpenBibleRef(ref) {
  if (!ref || ref.includes("-")) return null;
  const match = ref.match(/^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  const [, openBibleBook, chapter, verse] = match;
  const book = bookMap.get(openBibleBook);
  if (!book) return null;
  const kjvRef = `${book} ${Number(chapter)}:${Number(verse)}`;
  return validRefs.has(kjvRef) ? kjvRef : null;
}

const raw = await fs.readFile(path.resolve(process.cwd(), inputPath), "utf8");
const rows = raw.split(/\r?\n/);
const staged = [];
const seen = new Set();
const stats = {
  inputRows: 0,
  skippedHeader: 0,
  skippedRange: 0,
  skippedVotes: 0,
  skippedInvalidReference: 0,
  skippedDuplicate: 0,
};

for (const line of rows) {
  if (!line.trim()) continue;
  if (line.startsWith("From Verse")) {
    stats.skippedHeader += 1;
    continue;
  }

  stats.inputRows += 1;
  const [fromRef, toRef, votesRaw] = line.split("\t");
  const votes = Number(votesRaw);
  if (fromRef?.includes("-") || toRef?.includes("-")) {
    stats.skippedRange += 1;
    continue;
  }
  if (!Number.isFinite(votes) || votes < minVotes) {
    stats.skippedVotes += 1;
    continue;
  }

  const verseRef = convertOpenBibleRef(fromRef);
  const targetRef = convertOpenBibleRef(toRef);
  if (!verseRef || !targetRef) {
    stats.skippedInvalidReference += 1;
    continue;
  }

  const key = `${verseRef}|${targetRef}|OpenBible TSK`;
  if (seen.has(key)) {
    stats.skippedDuplicate += 1;
    continue;
  }

  staged.push({
    verse_ref: verseRef,
    target_ref: targetRef,
    label: `OpenBible ranked cross-reference (${votes} votes). Review before public promotion.`,
    source: "OpenBible TSK",
    source_title: "OpenBible.info Bible Cross References",
    source_url: "https://www.openbible.info/labs/cross-references/",
    public_domain_status: "CC BY 4.0 staging candidate based primarily on public-domain TSK tradition; not public-domain-only.",
    rights_basis: "OpenBible.info states the cross-reference data draws primarily from public-domain sources, especially Treasury of Scripture Knowledge, and is licensed under Creative Commons Attribution unless otherwise indicated. Import references only; no ESV quotations.",
    review_status: "Needs Review",
  });
  seen.add(key);

  if (staged.length >= limit) break;
}

await fs.mkdir(path.dirname(path.resolve(process.cwd(), outputPath)), { recursive: true });
await fs.writeFile(path.resolve(process.cwd(), outputPath), `${JSON.stringify(staged, null, 2)}\n`);

console.log("OpenBible TSK staging sample prepared");
console.table({
  output: outputPath,
  stagedRows: staged.length,
  minVotes,
  ...stats,
});

if (staged.length === 0) {
  console.error("No rows staged. Check input format, min votes, or reference conversion.");
  process.exit(1);
}
