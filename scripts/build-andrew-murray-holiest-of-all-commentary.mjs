#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/the-holiest-of-all-an-exposition-of-the-epistle-to-the-hebrews-andrew-murray.txt";
const outputPath = "data/imports/andrew-murray-reviewed-holiest-of-all-hebrews-commentary.json";
const sourceChecksum = "5798d4a60c5f58a2c48e6296518a394a281b4ad88fb83acdb21f31b1861caa2c";
const chapterSectionStarts = ["I", "X", "XIX", "XXIX", "XXXVII", "XLIV", "L", "LVIII", "LXIV", "LXXV", "XCVIII", "CXII", "CXXII"];
const verseEnds = [14, 18, 19, 16, 14, 20, 28, 13, 28, 39, 40, 29, 25];

function cleanOcrChapter(text) {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph
      .split("\n")
      .map((line) => line.trim().replace(/\s{2,}/g, " "))
      .filter((line) => {
        if (!line || /^\d+$/.test(line)) return false;
        if (/^(?:Cbe|ibollest|tboliest|Cbe Iboliest).*\d+$/i.test(line)) return false;
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
  throw new Error(`Verified Andrew Murray source checksum changed: expected ${sourceChecksum}, received ${checksum}.`);
}

const bodyStart = [...source.matchAll(/^I\.\s*$/gm)].find((match) => match.index > 3_000)?.index ?? -1;
if (bodyStart < 0) throw new Error("Could not locate the beginning of the Hebrews exposition.");

const starts = chapterSectionStarts.map((section, index) => {
  const pattern = new RegExp(`^${section}\\.\\s*$`, "gm");
  const position = [...source.matchAll(pattern)].find((match) => match.index >= bodyStart)?.index ?? -1;
  if (position < 0) throw new Error(`Could not locate section ${section}, the start of Hebrews ${index + 1}.`);
  return position;
});

const bookEnd = source.indexOf("\nilORKlSCXX", starts.at(-1));
if (bookEnd < 0) throw new Error("Could not locate the end of the exposition before the publisher catalogue.");

if (starts.some((position, index) => index > 0 && position <= starts[index - 1])) {
  throw new Error("Hebrews chapter boundaries are not in canonical order.");
}

const entries = starts.map((start, index) => {
  const chapter = index + 1;
  const end = starts[index + 1] ?? bookEnd;
  const entryText = cleanOcrChapter(source.slice(start, end));
  if (entryText.length < 12_000) {
    throw new Error(`Hebrews ${chapter} commentary is unexpectedly short (${entryText.length} characters).`);
  }
  return {
    id: `andrew-murray-holiest-of-all-hebrews-${chapter}-reviewed`,
    reference: `Hebrews ${chapter}`,
    book: "Hebrews",
    chapter,
    verse_start: 1,
    verse_end: verseEnds[index],
    author: "Andrew Murray",
    resource_title: "The Holiest of All",
    source_title: "The Holiest of All: An Exposition of the Epistle to the Hebrews",
    source_url: "https://archive.org/details/theholiestofall00murruoft",
    public_domain_status: "Verified public domain",
    rights_basis: `1894 public-domain edition preserved by Internet Archive. Verified source SHA-256: ${sourceChecksum}.`,
    recommended_use: "Read after the KJV chapter for devotional exposition on Christ, the better covenant, faith, holiness, and drawing near to God. Keep the KJV text primary and compare the author's doctrinal conclusions carefully with Scripture.",
    entry_text: entryText,
    review_status: "Verified",
    import_status: "Public Verified",
    review_batch: "Andrew Murray Holiest of All Hebrews Phase 1",
    review_notes: "The thirteen chapter boundaries were verified against the printed table of contents and the opening section of each Hebrews chapter. Historical OCR was cleaned only for spacing and recurring page headers; wording was not modernized. OCR defects may remain.",
  };
});

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
console.log(`Andrew Murray Hebrews commentary written to ${outputPath}.`);
console.log(`Chapters: ${entries.length} (Hebrews 1-13)`);
console.log(`Characters: ${entries.reduce((sum, entry) => sum + entry.entry_text.length, 0)}`);
