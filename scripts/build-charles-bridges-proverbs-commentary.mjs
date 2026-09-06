#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/an-exposition-of-the-book-of-proverbs-bridges-charles-1794-1869.txt";
const outputPath = "data/imports/charles-bridges-reviewed-proverbs-commentary.json";
const sourceChecksum = "7e136c3088e3ba41c5abf4c30c945353ca3bd7a9d009f55fd94dc4737a7b3f11";
const verseEnds = [33, 22, 35, 27, 23, 35, 27, 36, 18, 32, 31, 28, 25, 35, 33, 33, 28, 24, 29, 30, 31, 29, 35, 34, 28, 28, 27, 28, 27, 33, 31];
const romanChapters = [
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI",
  "XVII", "XVIII", "XIX", "XX", "XXI", "XXII", "XXIII", "XXIV", "XXV", "XXVI", "XXVII", "XXVIII", "XXIX", "XXX", "XXXI",
];

function cleanOcrChapter(text) {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph
      .split("\n")
      .map((line) => line.trim().replace(/\s{2,}/g, " "))
      .filter((line) => {
        if (!line || /^\d+$/.test(line)) return false;
        if (/^EXPOSITION\s+OF\s+THE\s+BOOK\s+OF\s+PROVERBS[,.]?$/i.test(line)) return false;
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
  throw new Error(`Verified Charles Bridges source checksum changed: expected ${sourceChecksum}, received ${checksum}.`);
}

const headingMatches = [...source.matchAll(/^\s*[•*]?\s*CHAPT(?:ER|EE|EK)\s*([IVXLCDMY]+)?[.,]?\s*$/gm)]
  .filter((match) => match.index > 20_000);

if (headingMatches.length !== 31) {
  throw new Error(`Expected 31 Proverbs chapter headings, found ${headingMatches.length}.`);
}

const entries = headingMatches.map((heading, index) => {
  const chapter = index + 1;
  const headingText = heading[1] ?? "";
  const expectedHeading = chapter === 25 ? "XXY" : romanChapters[index];
  if (chapter !== 19 && headingText !== expectedHeading) {
    throw new Error(`Unexpected chapter heading for Proverbs ${chapter}: ${heading[0].trim()}`);
  }
  const end = headingMatches[index + 1]?.index ?? source.search(/^INDEX\.\s*$/m);
  const entryText = cleanOcrChapter(source.slice(heading.index, end));
  if (entryText.length < 5_000) {
    throw new Error(`Proverbs ${chapter} commentary is unexpectedly short (${entryText.length} characters).`);
  }
  return {
    id: `charles-bridges-proverbs-${chapter}-reviewed`,
    reference: `Proverbs ${chapter}`,
    book: "Proverbs",
    chapter,
    verse_start: 1,
    verse_end: verseEnds[index],
    author: "Charles Bridges",
    resource_title: "An Exposition of the Book of Proverbs",
    source_title: "An Exposition of the Book of Proverbs (1865 edition)",
    source_url: "https://archive.org/details/expositionprover00briduoft",
    public_domain_status: "Verified public domain",
    rights_basis: `1865 Robert Carter & Brothers edition from Internet Archive item expositionprover00briduoft. Verified source SHA-256: ${sourceChecksum}.`,
    recommended_use: "Read after the KJV chapter for pastoral exposition and practical application. Keep the KJV text primary, compare every conclusion with Scripture, and spot-check the scanned page before quoting historical OCR in print or presentation slides.",
    entry_text: entryText,
    review_status: "Verified",
    import_status: "Public Verified",
    review_batch: "Charles Bridges Proverbs Commentary Phase 1",
    review_notes: "Chapter boundary verified against the printed Proverbs chapter sequence. Historical OCR was cleaned only for spacing and recurring page headers; wording was not modernized. OCR defects may remain.",
  };
});

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
console.log(`Charles Bridges commentary written to ${outputPath}.`);
console.log(`Chapters: ${entries.length} (Proverbs 1-31)`);
console.log(`Characters: ${entries.reduce((sum, entry) => sum + entry.entry_text.length, 0)}`);
