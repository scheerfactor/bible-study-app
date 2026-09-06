#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/expository-thoughts-on-the-gospels-st-mark-j-c-ryle.txt";
const outputPath = "data/imports/j-c-ryle-reviewed-mark-commentary.json";
const expectedChecksum = "7bbee83a56fc6cffb3d546c70330fcc95996fca9ac516d5700898326c8a2d2e7";
const sourceUrl = "https://archive.org/details/expositorythough00ryleiala";
const resourceTitle = "Expository Thoughts on the Gospels: St. Mark";
const chapters = [
  { chapter: 1, heading: "I", verseEnd: 45 },
  { chapter: 2, heading: "II", verseEnd: 28 },
  { chapter: 3, heading: "III", verseEnd: 35 },
  { chapter: 4, heading: "IV", verseEnd: 41 },
  { chapter: 5, heading: "V", verseEnd: 43 },
  { chapter: 6, heading: "VI", verseEnd: 56 },
  { chapter: 7, heading: "Vn", verseEnd: 37 },
  { chapter: 8, heading: "VIII", verseEnd: 38 },
  { chapter: 9, heading: "IX", verseEnd: 50 },
  { chapter: 10, heading: "X", verseEnd: 52 },
  { chapter: 11, heading: "XI", verseEnd: 33 },
  { chapter: 12, heading: "XII", verseEnd: 44 },
  { chapter: 13, heading: "Xin", verseEnd: 37 },
  { chapter: 14, heading: "XIV", verseEnd: 72 },
  { chapter: 15, heading: "XV", verseEnd: 47 },
  { chapter: 16, heading: "XVI", verseEnd: 20 },
];

function firstHeadingIndex(source, heading, chapter) {
  const pattern = new RegExp(`^M[A-Z]{3}[.,]?\\s+${heading}\\.\\s+1(?:[—-]\\d+)?\\.\\s*$`, "m");
  const match = pattern.exec(source);
  if (!match) throw new Error(`Could not find the first Mark ${chapter} passage heading.`);
  return match.index;
}

function cleanOcrChapter(text) {
  const paragraphs = text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph
      .split("\n")
      .map((line) => line.trim().replace(/\s{2,}/g, " "))
      .filter((line) => {
        if (!line) return false;
        if (/^\d+$/.test(line)) return false;
        if (/^M[A-Z]{3},\s+CHAP\.\s+\S+/i.test(line)) return false;
        if (/^\S+\s+EXPOSITOR(?:Y|'S)\s+THOUGHTS\.?$/i.test(line)) return false;
        if (/^EXPOSITOR(?:Y|'S)\s+THOUGHTS\.?\s+\S+$/i.test(line)) return false;
        return true;
      })
      .join(" ")
      .trim())
    .filter(Boolean);

  return paragraphs.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

const source = await readFile(sourcePath, "utf8");
const checksum = createHash("sha256").update(source).digest("hex");

if (checksum !== expectedChecksum) {
  throw new Error(`Verified Ryle source checksum changed: expected ${expectedChecksum}, received ${checksum}.`);
}

const endMarker = /^W\.\s+HDMT,/m.exec(source);
if (!endMarker) throw new Error("Could not find the end of the Mark commentary before the publisher catalog.");

const chapterStarts = chapters.map(({ heading, chapter }) => firstHeadingIndex(source, heading, chapter));
const entries = chapters.map(({ chapter, verseEnd }, index) => {
  const start = chapterStarts[index];
  const end = chapterStarts[index + 1] ?? endMarker.index;
  const entryText = cleanOcrChapter(source.slice(start, end));

  if (entryText.length < 10_000) {
    throw new Error(`Mark ${chapter} commentary is unexpectedly short (${entryText.length} characters).`);
  }

  return {
    id: `j-c-ryle-mark-${chapter}-reviewed`,
    reference: `Mark ${chapter}`,
    book: "Mark",
    chapter,
    verse_start: 1,
    verse_end: verseEnd,
    author: "J. C. Ryle",
    resource_title: resourceTitle,
    source_title: "Expository Thoughts on the Gospels: St. Mark (1859)",
    source_url: sourceUrl,
    public_domain_status: "Verified public domain",
    rights_basis: `1859 William Hunt edition from Internet Archive item expositorythough00ryleiala, marked NOT_IN_COPYRIGHT. Verified source SHA-256: ${expectedChecksum}.`,
    recommended_use: "Read after the KJV text as an evangelical Anglican exposition. Compare doctrine with Scripture, and spot-check the scanned page before using an OCR quotation in print or presentation slides.",
    entry_text: entryText,
    review_status: "Verified",
    import_status: "Public Verified",
    review_batch: "J. C. Ryle Mark Commentary Phase 1",
    review_notes: "Chapter boundary verified against the volume's printed Mark heading. Historical OCR was cleaned only for spacing and recurring page headers; wording was not modernized. OCR defects may remain.",
  };
});

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");

console.log(`Ryle commentary written to ${outputPath}.`);
console.log(`Chapters: ${entries.length} (Mark 1-16)`);
console.log(`Characters: ${entries.reduce((sum, entry) => sum + entry.entry_text.length, 0)}`);
