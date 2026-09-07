#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/the-acts-of-the-apostles-an-exposition-arno-c-gaebelein.txt";
const outputPath = "data/imports/a-c-gaebelein-reviewed-acts-commentary.json";
const sourceUrl = "https://archive.org/download/actsofapostles0000arno_q5g8/actsofapostles0000arno_q5g8_djvu.txt";
const resourceTitle = "The Acts of the Apostles: An Exposition";
const expectedSourceChecksum = "f0458c5a0421ef76bacf47fbc0d206966f0dda6a5278c00592d6f6bfcbf9e70b";
const verseEnds = [26, 47, 26, 37, 42, 15, 60, 40, 43, 48, 30, 25, 52, 28, 41, 40, 34, 28, 41, 38, 40, 30, 35, 27, 27, 32, 44, 31];
const headingMarkers = [
  "CHAPTER I.", "CHAPTER II.", "CHAPTER III.", "CHAPTER IV.", "CHAPTER: V.", "CHAPTER VI.", "CHAPTER VII.",
  "CHAPTER. VIIL", "CHAPTER. IX.", "CHAPTERS:", "CHAPTERS AL", "CHAPTER @AIT:", "CHAPTER XIII.", "CHAPTER XIV.",
  "GHAPTER XY.", "CHAPTER XVI.", "CHAPTER XVII.", "CHAPTER XVIII.", "CHAPTER XIX.", "CHAPTER XX.", "CHAPTER XXII.",
  "CHAPTER XXII.", "CHAE Th Ree oii:", "CHAPTER XXIV.", "CHAPTER XXV.", "CHAPTER XXVI.", "CHAPTER XXVII.", "CHAPTERS X2evilly",
];

function cleanOcr(text) {
  return text
    .replace(/\r/g, "")
    .replace(/([A-Za-z])-[ \t]*\n[ \t]*([a-z])/g, "$1$2")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph
      .split("\n")
      .map((line) => line.trim().replace(/\s{2,}/g, " "))
      .filter((line) => {
        if (!line || /^\d+$/.test(line)) return false;
        if (/^Chapter\s+\S{1,3}\s+\S{1,5}$/i.test(line)) return false;
        if (line.length < 50 && /The Acts of the Apostles/i.test(line)) return false;
        return true;
      })
      .join(" ")
      .trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

const source = await readFile(sourcePath, "utf8");
const sourceChecksum = createHash("sha256").update(source).digest("hex");
if (sourceChecksum !== expectedSourceChecksum) {
  throw new Error(`Unexpected Gaebelein Acts source checksum: ${sourceChecksum}`);
}

const starts = [];
let searchFrom = 0;
for (const [index, marker] of headingMarkers.entries()) {
  const start = source.indexOf(marker, searchFrom);
  if (start < 0) throw new Error(`Could not locate Acts ${index + 1} boundary: ${marker}`);
  starts.push(start);
  searchFrom = start + marker.length;
}

const bookEnd = source.indexOf("\nTABE-END,", starts[27]);
if (bookEnd < 0) throw new Error("Could not locate the end of the Acts exposition.");

const entries = starts.map((start, index) => {
  const chapter = index + 1;
  const end = starts[index + 1] ?? bookEnd;
  const entryText = cleanOcr(source.slice(start, end)).replace(/^[^\n]+/, `CHAPTER ${chapter}.`);
  if (entryText.length < 5_000) {
    throw new Error(`Acts ${chapter} commentary is unexpectedly short (${entryText.length} characters).`);
  }

  return {
    id: `a-c-gaebelein-acts-${chapter}-reviewed-1912`,
    reference: `Acts ${chapter}`,
    book: "Acts",
    chapter,
    verse_start: 1,
    verse_end: verseEnds[index],
    author: "Arno C. Gaebelein",
    resource_title: resourceTitle,
    source_title: "The Acts of the Apostles: An Exposition (1912)",
    source_url: sourceUrl,
    public_domain_status: "Verified public domain in the United States",
    rights_basis: `Originally published in 1912 and public domain in the United States. Verified source SHA-256: ${sourceChecksum}.`,
    recommended_use: "Read after the KJV chapter for dispensational exposition of the risen Christ's work, the Holy Spirit, Pentecost, gospel witness, church growth, mission, and Paul's journeys. Keep the KJV text primary and compare every conclusion with Scripture.",
    entry_text: entryText,
    review_status: "Verified",
    import_status: "Public Verified",
    review_batch: "Arno C. Gaebelein Acts Complete Chapter Integration",
    review_notes: "All twenty-eight chapters were segmented from the printed headings, including OCR-corrupted headings. Line-wrap hyphenation, spacing, and recurring page headers were cleaned without modernizing the author's wording. Later-edition foreword and advertising matter are excluded. Spot-check the scan before public quotation.",
  };
});

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
console.log(`Arno C. Gaebelein Acts commentary written to ${outputPath}.`);
console.table(entries.map((entry) => ({ reference: entry.reference, characters: entry.entry_text.length })));
console.log(`Total characters: ${entries.reduce((sum, entry) => sum + entry.entry_text.length, 0)}`);
