#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/the-prophet-ezekiel-an-analytical-exposition-gaebelein-arno-clemens.txt";
const outputPath = "data/imports/a-c-gaebelein-reviewed-ezekiel-commentary.json";
const sourceUrl = "https://www.gutenberg.org/ebooks/36857";
const resourceTitle = "The Prophet Ezekiel: An Analytical Exposition";
const expectedSourceChecksum = "f10bf1b20daf42157611ab92249b81a2d62b4c31fc31cf0f4497bc796c84d4ff";
const verseEnds = [28, 10, 27, 17, 17, 14, 27, 18, 11, 22, 25, 28, 23, 23, 8, 63, 24, 32, 14, 49, 32, 31, 49, 27, 17, 21, 36, 26, 21, 26, 18, 32, 33, 31, 15, 38, 28, 23, 29, 49, 26, 20, 27, 31, 25, 24, 23, 35];
const chapterMarkers = [
  "Chapter I-iii:14.",
  "Chapter ii-iii:14.",
  "Chapter iii:15-27.",
  "THE FOUR SYMBOLICAL SIGNS.",
  "IV. The Sign of the Shaving of the Head and the Face.",
  "THE TWO JUDGMENT MESSAGES.",
  "Chapter vii.",
  "Chapter viii.",
  "Chapter ix.",
  "Chapter x.",
  "Chapter xi.",
  "Chapter xii.",
  "Chapter xiii.",
  "Chapter xiv.",
  "Chapter xv.",
  "Chapter xvi.",
  "Chapter xvii.",
  "Chapter xviii.",
  "Chapter xix.",
  "Chapter xx.",
  "Chapter xxi.",
  "Chapter xxii.",
  "Chapter xxiii.",
  "Chapter xxiv.",
  "Chapter xxv.",
  "Chapter xxvi.",
  "Chapter xxvii.",
  "Chapter xxviii.",
  "Chapter xxix.",
  "Chapter xxx.",
  "Chapter xxxi.",
  "Chapter xxxii.",
  "Chapter xxxiii.",
  "Chapter xxxiv.",
  "Chapter xxxv.",
  "Chapter xxxvi.",
  "Chapter xxxvii.",
  "Chapter xxxviii.",
  "Chapter xxxix.",
  "Chapter xl.",
  "Chapter xli.",
  "Chapter xlii.",
  "Chapter xliii.",
  "Chapter xliv.",
  "Chapter xlv.",
  "Chapter xlvi.",
  "Chapter xlvii.",
  "Chapter xlviii.",
];

function cleanText(text) {
  return text
    .replace(/\r/g, "")
    .replace(/([A-Za-z])-[ \t]*\n[ \t]*([a-z])/g, "$1$2")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph
      .split("\n")
      .map((line) => line.trim().replace(/\s{2,}/g, " "))
      .filter((line) => line && !/^\*\s+\*\s+\*\s+\*\s+\*$/.test(line))
      .join(" ")
      .trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

const source = await readFile(sourcePath, "utf8");
const sourceChecksum = createHash("sha256").update(source).digest("hex");
if (sourceChecksum !== expectedSourceChecksum) {
  throw new Error(`Unexpected Gaebelein Ezekiel source checksum: ${sourceChecksum}`);
}

const headings = [];
let cursor = source.indexOf("I. PREDICTIONS BEFORE THE FALL OF JERUSALEM");
if (cursor < 0) throw new Error("Could not locate the beginning of the Ezekiel exposition.");
for (const [index, marker] of chapterMarkers.entries()) {
  if (index === 39) {
    cursor = source.indexOf("THE TEMPLE VISION.", cursor);
    if (cursor < 0) throw new Error("Could not locate the detailed temple vision exposition.");
  }
  const start = source.indexOf(marker, cursor);
  if (start < 0) throw new Error(`Could not locate Ezekiel ${index + 1} marker: ${marker}`);
  headings.push({ chapter: index + 1, marker, start });
  cursor = start + marker.length;
}

const bookEnd = source.indexOf("Transcriber's Notes:", headings[47].start);
if (bookEnd < 0) throw new Error("Could not locate the end of the Ezekiel exposition.");

const entries = headings.map((heading, index) => {
  const chapter = heading.chapter;
  const end = headings[index + 1]?.start ?? bookEnd;
  const bodyStart = source.indexOf("\n", heading.start) + 1;
  const entryText = `CHAPTER ${chapter}.\n\n${cleanText(source.slice(bodyStart, end))}`;
  if (entryText.length < 500) {
    throw new Error(`Ezekiel ${chapter} commentary is unexpectedly short (${entryText.length} characters).`);
  }

  return {
    id: `a-c-gaebelein-ezekiel-${chapter}-reviewed-1918`,
    reference: `Ezekiel ${chapter}`,
    book: "Ezekiel",
    chapter,
    verse_start: 1,
    verse_end: verseEnds[index],
    author: "Arno C. Gaebelein",
    resource_title: resourceTitle,
    source_title: "The Prophet Ezekiel: An Analytical Exposition (1918)",
    source_url: sourceUrl,
    public_domain_status: "Verified public domain in the United States",
    rights_basis: `Published in 1918 and public domain in the United States. Project Gutenberg ebook 36857; verified source SHA-256: ${sourceChecksum}.`,
    recommended_use: "Read after the KJV chapter for dispensational exposition of Ezekiel's call, watchman ministry, judgment, individual responsibility, restoration, renewed life, the future temple, the river, and the Lord's presence. Keep the KJV text primary and compare every conclusion with Scripture.",
    entry_text: entryText,
    review_status: "Verified",
    import_status: "Public Verified",
    review_batch: "Arno C. Gaebelein Ezekiel Complete Chapter Integration",
    review_notes: "All forty-eight chapters were segmented from the exposition's printed divisions. The combined printed treatments of chapters 4-5 and 6-7 were divided at their internal chapter markers. Project Gutenberg formatting was normalized without modernizing the author's wording. Front matter, contents, maps, and transcriber's notes are excluded from the chapter entries. Spot-check the source before public quotation.",
  };
});

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
console.log(`Arno C. Gaebelein Ezekiel commentary written to ${outputPath}.`);
console.table(entries.map((entry) => ({ reference: entry.reference, characters: entry.entry_text.length })));
console.log(`Total characters: ${entries.reduce((sum, entry) => sum + entry.entry_text.length, 0)}`);
