#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/expository-thoughts-on-the-gospels-j-c-ryle.txt";
const outputPath = "data/imports/j-c-ryle-reviewed-john-13-21-commentary.json";
const expectedChecksum = "6aa687f8826120cee751d5fc086dd1c085019f7aac281328f35ae33a62dc0151";
const sourceUrl = "https://archive.org/details/expositorythough07ryle";
const resourceTitle = "Expository Thoughts on the Gospels: St. John, Volume III";
const chapters = [
  { chapter: 13, roman: "XIII", verseEnd: 38 },
  { chapter: 14, roman: "XIV", verseEnd: 31 },
  { chapter: 15, roman: "XV", verseEnd: 27 },
  { chapter: 16, roman: "XVI", verseEnd: 33 },
  { chapter: 17, roman: "XVII", verseEnd: 26 },
  { chapter: 18, roman: "XVIII", verseEnd: 40 },
  { chapter: 19, roman: "XIX", verseEnd: 42 },
  { chapter: 20, roman: "XX", verseEnd: 31 },
  { chapter: 21, roman: "XXI", verseEnd: 25 },
];

function firstHeadingIndex(source, roman) {
  const heading = new RegExp(`^JOHN\\s+${roman}\\.\\s+1(?:[—-]\\d+)?\\.\\s*$`, "m");
  const match = heading.exec(source);
  if (!match) throw new Error(`Could not find the first John ${roman} passage heading.`);
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
        if (/^JOHN,\s+CHAP\.\s+[IVXLCDM]+\.\s+\S+$/i.test(line)) return false;
        if (/^\S+\s+EXPOSITO(?:RY|E)\s+THOUGHTS\.?$/i.test(line)) return false;
        if (/^EXPOSITO(?:RY|E)\s+THOUGHTS\.?\s+\S+$/i.test(line)) return false;
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

const endMarker = /^ALPHABETICAL\s+INDEX\s*$/m.exec(source);
if (!endMarker) throw new Error("Could not find the end of the John commentary before the subject index.");

const chapterStarts = chapters.map(({ roman }) => firstHeadingIndex(source, roman));
const entries = chapters.map(({ chapter, verseEnd }, index) => {
  const start = chapterStarts[index];
  const end = chapterStarts[index + 1] ?? endMarker.index;
  const entryText = cleanOcrChapter(source.slice(start, end));

  if (entryText.length < 10_000) {
    throw new Error(`John ${chapter} commentary is unexpectedly short (${entryText.length} characters).`);
  }

  return {
    id: `j-c-ryle-john-${chapter}-reviewed`,
    reference: `John ${chapter}`,
    book: "John",
    chapter,
    verse_start: 1,
    verse_end: verseEnd,
    author: "J. C. Ryle",
    resource_title: resourceTitle,
    source_title: "Expository Thoughts on the Gospels, St. John, Volume III (1878)",
    source_url: sourceUrl,
    public_domain_status: "Verified public domain",
    rights_basis: `1878 Robert Carter and Brothers edition from Internet Archive item expositorythough07ryle, marked NOT_IN_COPYRIGHT. Verified source SHA-256: ${expectedChecksum}.`,
    recommended_use: "Read after the KJV text as an evangelical Anglican exposition. Compare doctrine with Scripture, and spot-check the scanned page before using an OCR quotation in print or presentation slides.",
    entry_text: entryText,
    review_status: "Verified",
    import_status: "Public Verified",
    review_batch: "J. C. Ryle John 13-21 Commentary Phase 1",
    review_notes: "Chapter boundary verified against the volume's printed JOHN heading. Historical OCR was cleaned only for spacing and recurring page headers; wording was not modernized. OCR defects may remain.",
  };
});

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");

console.log(`Ryle commentary written to ${outputPath}.`);
console.log(`Chapters: ${entries.length} (John 13-21)`);
console.log(`Characters: ${entries.reduce((sum, entry) => sum + entry.entry_text.length, 0)}`);
