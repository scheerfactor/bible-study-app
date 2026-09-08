#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/expository-thoughts-on-the-gospel-of-saint-matthew-ryle-j-c-john-charles-1816-1900.txt";
const outputPath = "data/imports/j-c-ryle-reviewed-matthew-commentary.json";
const expectedChecksum = "32ea93020c8ec39a55e106841051ba02f37bbd952e8483e0cf34940a8b8a7973";
const sourceUrl = "https://archive.org/details/expositorythough0000ryle";
const resourceTitle = "Expository Thoughts on the Gospel of St. Matthew";
const chapters = [
  { chapter: 1, heading: "I", verseEnd: 25 },
  { chapter: 2, heading: "II", verseEnd: 23 },
  { chapter: 3, heading: "III", verseEnd: 17 },
  { chapter: 4, heading: "IV", verseEnd: 25 },
  { chapter: 5, heading: "V", verseEnd: 48 },
  { chapter: 6, heading: "VI", verseEnd: 34 },
  { chapter: 7, heading: "VII", verseEnd: 29 },
  { chapter: 8, heading: "VIII", verseEnd: 34 },
  { chapter: 9, heading: "IX", verseEnd: 38 },
  { chapter: 10, heading: "X", verseEnd: 42 },
  { chapter: 11, heading: "XI", verseEnd: 30 },
  { chapter: 12, heading: "XII", verseEnd: 50 },
  { chapter: 13, heading: "XIII", verseEnd: 58 },
  { chapter: 14, heading: "XIV", verseEnd: 36 },
  { chapter: 15, heading: "XV", verseEnd: 39 },
  { chapter: 16, heading: "XVI", verseEnd: 28 },
  { chapter: 17, heading: "XVII", verseEnd: 27 },
  { chapter: 18, heading: "XVIII", verseEnd: 35 },
  { chapter: 19, heading: "XIX", verseEnd: 30 },
  { chapter: 20, heading: "XX", verseEnd: 34 },
  { chapter: 21, heading: "XXI", verseEnd: 46 },
  { chapter: 22, heading: "XXII", verseEnd: 46 },
  { chapter: 23, heading: "XXIII", verseEnd: 39 },
  { chapter: 24, heading: "XXIV", verseEnd: 51 },
  { chapter: 25, heading: "XXV", verseEnd: 46 },
  { chapter: 26, heading: "XXVI", verseEnd: 75 },
  { chapter: 27, heading: "XXVII", verseEnd: 66 },
  { chapter: 28, heading: "XXVIII", verseEnd: 20 },
];

function firstHeadingIndex(source, heading, chapter) {
  const pattern = chapter === 24
    ? /^MATTHEW[ \t]*$/m
    : new RegExp(`^MATTHEW\\s+${heading}\\.\\s+1(?:[—-]\\d+)?[.,]?\\s*$`, "m");
  const match = pattern.exec(source);
  if (!match) throw new Error(`Could not find the first Matthew ${chapter} passage heading.`);
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
        if (/^MATTHEW,?\s+CHAP[.,]?\s+/i.test(line)) return false;
        if (/^\S+\s+EXPOSITORY\s+THOUGHTS\.?$/i.test(line)) return false;
        if (/^EXPOSITORY\s+THOUGHTS\.?\s+\S+$/i.test(line)) return false;
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

const endMarker = /^The Expositor’s Bible\.\s*$/m.exec(source);
if (!endMarker) throw new Error("Could not find the end of the Matthew commentary before the publisher catalog.");

const chapterStarts = chapters.map(({ heading, chapter }) => firstHeadingIndex(source, heading, chapter));
const entries = chapters.map(({ chapter, verseEnd }, index) => {
  const start = chapterStarts[index];
  const end = chapterStarts[index + 1] ?? endMarker.index;
  const entryText = cleanOcrChapter(source.slice(start, end));

  if (entryText.length < 10_000) {
    throw new Error(`Matthew ${chapter} commentary is unexpectedly short (${entryText.length} characters).`);
  }

  return {
    id: `j-c-ryle-matthew-${chapter}-reviewed`,
    reference: `Matthew ${chapter}`,
    book: "Matthew",
    chapter,
    verse_start: 1,
    verse_end: verseEnd,
    author: "J. C. Ryle",
    resource_title: resourceTitle,
    source_title: "Expository Thoughts on the Gospel of St. Matthew (1896 popular edition)",
    source_url: sourceUrl,
    public_domain_status: "Verified public domain",
    rights_basis: `1896 Hodder and Stoughton edition from Internet Archive item expositorythough0000ryle. Verified source SHA-256: ${expectedChecksum}.`,
    recommended_use: "Read after the KJV text as an evangelical Anglican exposition. Compare doctrine with Scripture, and spot-check the scanned page before using an OCR quotation in print or presentation slides.",
    entry_text: entryText,
    review_status: "Verified",
    import_status: "Public Verified",
    review_batch: "J. C. Ryle Matthew Commentary Phase 1",
    review_notes: "Chapter boundary verified against the volume's printed Matthew heading. Historical OCR was cleaned only for spacing and recurring page headers; wording was not modernized. OCR defects may remain.",
  };
});

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");

console.log(`Ryle commentary written to ${outputPath}.`);
console.log(`Chapters: ${entries.length} (Matthew 1-28)`);
console.log(`Characters: ${entries.reduce((sum, entry) => sum + entry.entry_text.length, 0)}`);
