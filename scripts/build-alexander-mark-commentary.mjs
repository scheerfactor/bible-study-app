#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/commentary-on-the-gospel-of-mark-alexander-joseph-addison-1809-1860.txt";
const outputPath = "data/imports/joseph-addison-alexander-reviewed-mark-commentary.json";
const sourceUrl = "https://archive.org/download/commentaryongosp00alex/commentaryongosp00alex_djvu.txt";
const resourceTitle = "Commentary on the Gospel of Mark";
const expectedSourceChecksum = "ec0272352cc752fdc3f1b906c78299a338956a96c8182f3017fec058f7938a35";
const verseEnds = [45, 28, 35, 41, 43, 56, 37, 38, 50, 52, 33, 44, 37, 72, 47, 20];
const ocrChapterNumbers = new Map([
  ["I", 1], ["II", 2], ["III", 3], ["TV", 4], ["Y", 5], ["VI", 6], ["VII", 7], ["YIII", 8],
  ["IX", 9], ["X", 10], ["XI", 11], ["XII", 12], ["XIII", 13], ["XIV", 14], ["XY", 15], ["XYI", 16],
]);

function cleanOcr(text) {
  const pageHeaders = [
    /^\d+\*?$/,
    /^[A-Z0-9]*\s*MARKS?\s+[A-Z0-9]+\s*,[A-Z0-9,.\-\s]+$/i,
    /^\d+\s+MARK\s+[0-9,\.\s]+$/i,
    /^MARK\s+[0-9,\.\s]+$/i,
  ];

  return text
    .replace(/\r/g, "")
    .replace(/([A-Za-z])-[ \t]*\n[ \t]*([a-z])/g, "$1$2")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph
      .split("\n")
      .map((line) => line.trim().replace(/\s{2,}/g, " "))
      .filter((line) => line
        && !(line.length < 50 && /MARKS?/i.test(line) && /\d/.test(line))
        && !pageHeaders.some((pattern) => pattern.test(line)))
      .join(" ")
      .trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

const source = await readFile(sourcePath, "utf8");
const sourceChecksum = createHash("sha256").update(source).digest("hex");
if (sourceChecksum !== expectedSourceChecksum) {
  throw new Error(`Unexpected Joseph Addison Alexander Mark source checksum: ${sourceChecksum}`);
}

const headingPattern = /^(?:CHAPTER|CHAPTEK|CHAPTEE|CHAPTEH|CIIAPTEE|CIIAPTERW|CIIAPTEPV)\s+([IVXYLCT]+)\.\s*$/gmi;
const headings = [];
for (const match of source.matchAll(headingPattern)) {
  const chapter = ocrChapterNumbers.get(match[1].toUpperCase());
  if (chapter) headings.push({ chapter, start: match.index });
}

if (headings.length !== 16 || headings.some((heading, index) => heading.chapter !== index + 1)) {
  throw new Error(`Expected canonical Mark 1-16 headings; found ${headings.map((heading) => heading.chapter).join(", ")}.`);
}

const scanEnd = source.indexOf("\nDate  Due", headings[15].start);
if (scanEnd < 0) throw new Error("Could not locate the end of the Mark commentary.");

const entries = headings.map((heading, index) => {
  const chapter = heading.chapter;
  const end = headings[index + 1]?.start ?? scanEnd;
  const entryText = cleanOcr(source.slice(heading.start, end))
    .replace(/^[^\n]+/, `CHAPTER ${chapter}.`);
  if (entryText.length < 8_000) {
    throw new Error(`Mark ${chapter} commentary is unexpectedly short (${entryText.length} characters).`);
  }

  return {
    id: `joseph-addison-alexander-mark-${chapter}-reviewed-1864`,
    reference: `Mark ${chapter}`,
    book: "Mark",
    chapter,
    verse_start: 1,
    verse_end: verseEnds[index],
    author: "Joseph Addison Alexander",
    resource_title: resourceTitle,
    source_title: "Commentary on the Gospel of Mark (1864)",
    source_url: sourceUrl,
    public_domain_status: "Verified public domain in the United States",
    rights_basis: `Published in 1864 and public domain in the United States. Verified source SHA-256: ${sourceChecksum}.`,
    recommended_use: "Read after the KJV chapter for detailed grammatical, historical, harmonistic, and doctrinal exposition of Mark's Gospel. Keep the KJV text primary and compare every conclusion with Scripture.",
    entry_text: entryText,
    review_status: "Verified",
    import_status: "Public Verified",
    review_batch: "Joseph Addison Alexander Gospel of Mark Complete Chapter Integration",
    review_notes: "All sixteen chapters were segmented from the book's printed headings, including several OCR-corrupted Roman numerals. Line-wrap hyphenation, spacing, and recurring page headers were cleaned without modernizing the author's wording. Spot-check the scan before public quotation.",
  };
});

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
console.log(`Joseph Addison Alexander Mark commentary written to ${outputPath}.`);
console.table(entries.map((entry) => ({ reference: entry.reference, characters: entry.entry_text.length })));
console.log(`Total characters: ${entries.reduce((sum, entry) => sum + entry.entry_text.length, 0)}`);
