#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/notes-on-the-epistle-to-the-philippians-h-a-ironside.txt";
const outputPath = "data/imports/h-a-ironside-reviewed-philippians-commentary.json";
const sourceChecksum = "91dfea7b7eea66f836d915c001a71f6c898bdf4e45ddfd0c2cf79cc3cd170c37";
const verseEnds = [30, 30, 21, 23];

function cleanOcrChapter(text) {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph
      .split("\n")
      .map((line) => line.trim().replace(/\s{2,}/g, " "))
      .filter((line) => {
        if (!line || /^\d+$/.test(line)) return false;
        if (/^\d+ Notes on Philippians$/i.test(line)) return false;
        if (/^(?:Notes on Philippians|Joy and Peace|Ministry in Temporal Things) \d+$/i.test(line)) return false;
        return true;
      })
      .join(" ")
      .trim())
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const source = await readFile(sourcePath, "utf8");
const checksum = createHash("sha256").update(source).digest("hex");
if (checksum !== sourceChecksum) {
  throw new Error(`Verified Ironside Philippians source checksum changed: expected ${sourceChecksum}, received ${checksum}.`);
}

const starts = ["ONE", "TWO", "THREE", "FOUR"].map((word, index) => {
  const pattern = new RegExp(`^CHAPTER ${word}\\s*$`, "gm");
  const position = [...source.matchAll(pattern)].find((match) => match.index > 10_000)?.index ?? -1;
  if (position < 0) throw new Error(`Could not locate the body opening for Philippians ${index + 1}.`);
  return position;
});

const bookEnd = source.indexOf("\nTNT ", starts.at(-1));
if (bookEnd < 0) throw new Error("Could not locate the end of the Philippians exposition.");

if (starts.some((position, index) => index > 0 && position <= starts[index - 1])) {
  throw new Error("Philippians chapter boundaries are not in canonical order.");
}

const entries = starts.map((start, index) => {
  const chapter = index + 1;
  const end = starts[index + 1] ?? bookEnd;
  const entryText = cleanOcrChapter(source.slice(start, end));
  if (entryText.length < 20_000) {
    throw new Error(`Philippians ${chapter} commentary is unexpectedly short (${entryText.length} characters).`);
  }
  return {
    id: `h-a-ironside-philippians-${chapter}-reviewed`,
    reference: `Philippians ${chapter}`,
    book: "Philippians",
    chapter,
    verse_start: 1,
    verse_end: verseEnds[index],
    author: "H. A. Ironside",
    resource_title: "Notes on the Epistle to the Philippians",
    source_title: "Notes on the Epistle to the Philippians",
    source_url: "https://archive.org/details/notesonepistleto0000iron",
    public_domain_status: "Verified public domain",
    rights_basis: `1927 public-domain edition preserved by Internet Archive. Verified source SHA-256: ${sourceChecksum}.`,
    recommended_use: "Read after the KJV chapter for practical exposition of Christ as the believer's life, example, object, and strength. Keep the KJV text primary and compare every conclusion with Scripture.",
    entry_text: entryText,
    review_status: "Verified",
    import_status: "Public Verified",
    review_batch: "H. A. Ironside Philippians Phase 1",
    review_notes: "All four chapter boundaries were verified against the printed contents and body headings. Historical OCR was cleaned only for spacing and recurring page headers; wording was not modernized. OCR defects may remain, so check the scan before public quotation.",
  };
});

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
console.log(`Ironside Philippians commentary written to ${outputPath}.`);
console.log(`Chapters: ${entries.length} (Philippians 1-4)`);
console.log(`Characters: ${entries.reduce((sum, entry) => sum + entry.entry_text.length, 0)}`);
