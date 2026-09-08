#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/the-book-of-genesis-arno-c-gaebelein.txt";
const outputPath = "data/imports/a-c-gaebelein-reviewed-genesis-commentary.json";
const sourceUrl = "https://archive.org/download/bookofgenesiscom00gaeb/bookofgenesiscom00gaeb_djvu.txt";
const resourceTitle = "The Book of Genesis";
const expectedSourceChecksum = "405f6eff3612961ef949971233e315da84a0320ef73243a809dceae95a53ca4e";
const verseEnds = [31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32, 20, 18, 24, 21, 16, 27, 33, 38, 18, 34, 24, 20, 67, 34, 35, 46, 22, 35, 43, 55, 32, 20, 31, 29, 43, 36, 30, 23, 23, 57, 38, 34, 34, 28, 34, 31, 22, 33, 26];
const chapterMarkers = [
  "CHAPTER  1:1.     THE  ORIGINAL  CREATION  OF  GOD.",
  "CHAPTER  11:4-25.",
  "CHAPTER  III.",
  "CHAPTER  IV.",
  "CHAPTER  V.",
  "CHAPTER  VI:l-8.",
  "CHAPTER  VII.",
  "CHAPTER  VIII.",
  "CHAPTER  IX.",
  "CHAPTER  X.",
  "CHAPTER  XI:l-9.",
  "CHAPTER  XII.",
  "CHAPTER  XIII.",
  "CHAPTER  XIV.",
  "CHAPTER  XV.",
  "CHAPTER  XVI.",
  "CHAPTER  XVII.",
  "CHAPTER  XVIII.",
  "CHAPTER   XIX.",
  "CHAPTER  XX.",
  "CHAPTER  XXI.",
  "CHAPTER  XXII.",
  "CHAPTER  XXIII.",
  "CHAPTER  XXIV.",
  "CHAPTER  XXV:1-11.",
  "CHAPTER  XXVI.",
  "CHAPTER  XXVII.",
  "CHAPTER  XXVIII",
  "CHAPTER  XXIX.",
  "CHAPTER  XXX.",
  "CHAPTER  XXXI.",
  "CHAPTER  XXXII.",
  "CHAPTER  XXXIII.",
  "CHAPTER  XXXIV.",
  "CHAPTER  XXXV.",
  "Chapter  XXXVI :l-8.",
  "CHAPTER  XXXVII.",
  "CHAPTER  XXXVIII.",
  "CHAPTER  XXXIX.",
  "CHAPTER  X^",
  "CHAPTER  XLI.",
  "CHAPTER  XLII.",
  "CHAPTER  XLHI.",
  "CHAPTER  XLIV.",
  "CHAPTER  XLV.",
  "CHAPTER  XLVI.",
  "CHAPTER  XLVII.",
  "CHAPTER  XLVIII.",
  "CHAPTER  XLIX.",
  "CHAPTER  L.",
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
        if (/^(?:\d+\s+)?THE BOOK OF GENESIS\.?(?:\s+\d+)?$/i.test(line)) return false;
        if (/^THE BOOK OF GENESIS\s+\S{1,5}$/i.test(line) && /\d/.test(line)) return false;
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
  throw new Error(`Unexpected Gaebelein Genesis source checksum: ${sourceChecksum}`);
}

const headings = chapterMarkers.map((marker, index) => {
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Could not locate Genesis ${index + 1} marker: ${marker}`);
  return { chapter: index + 1, start };
});
if (headings.some((heading, index) => index > 0 && heading.start <= headings[index - 1].start)) {
  throw new Error("Genesis chapter sections are not in canonical order.");
}

const bookEnd = source.indexOf("Genesis  and  Geology.", headings[49].start);
if (bookEnd < 0) throw new Error("Could not locate the end of the Genesis exposition.");

const entries = headings.map((heading, index) => {
  const chapter = heading.chapter;
  const end = headings[index + 1]?.start ?? bookEnd;
  const rawSection = source.slice(heading.start, end).replace(/^[^\n]*(?:\n|$)/, `CHAPTER ${chapter}.\n`);
  const entryText = cleanOcr(rawSection);
  if (entryText.length < 100) {
    throw new Error(`Genesis ${chapter} commentary is unexpectedly short (${entryText.length} characters).`);
  }

  return {
    id: `a-c-gaebelein-genesis-${chapter}-reviewed-1912`,
    reference: `Genesis ${chapter}`,
    book: "Genesis",
    chapter,
    verse_start: chapter === 2 ? 4 : 1,
    verse_end: verseEnds[index],
    author: "Arno C. Gaebelein",
    resource_title: resourceTitle,
    source_title: "The Book of Genesis (1912)",
    source_url: sourceUrl,
    public_domain_status: "Verified public domain in the United States",
    rights_basis: `Published in 1912 and public domain in the United States. Verified source SHA-256: ${sourceChecksum}.`,
    recommended_use: "Read after the KJV chapter for dispensational exposition of creation, the fall, promise, covenant, the patriarchs, providence, faith, and hope. Keep the KJV text primary and compare every conclusion with Scripture.",
    entry_text: entryText,
    review_status: "Verified",
    import_status: "Public Verified",
    review_batch: "Arno C. Gaebelein Genesis Complete Chapter Integration",
    review_notes: "All fifty chapters were segmented from the exposition's printed divisions. The author treats Genesis 2:1-3 with chapter 1, so the Genesis 2 entry begins at verse 4. Line-wrap hyphenation, spacing, running titles, and isolated page numbers were cleaned without modernizing the author's wording. The later Genesis and geology appendix is excluded. Spot-check the scan before public quotation.",
  };
});

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
console.log(`Arno C. Gaebelein Genesis commentary written to ${outputPath}.`);
console.table(entries.map((entry) => ({ reference: entry.reference, characters: entry.entry_text.length })));
console.log(`Total characters: ${entries.reduce((sum, entry) => sum + entry.entry_text.length, 0)}`);
