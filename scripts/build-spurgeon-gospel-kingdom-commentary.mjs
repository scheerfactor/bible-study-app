#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/the-gospel-of-the-kingdom-c-h-spurgeon.txt";
const outputPath = "data/imports/spurgeon-reviewed-gospel-kingdom-matthew-commentary.json";
const sourceChecksum = "0d6d5e99a258d51f2a09ecbee87110d34c9e8d6b639d0e8eb6616a3101aca400";
const verseEnds = [25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 50, 58, 36, 39, 28, 27, 35, 30, 34, 46, 46, 39, 51, 46, 75, 66, 20];

function romanToNumber(raw) {
  const normalized = raw.toUpperCase().replaceAll("N", "II").replaceAll("L", "I");
  const values = { I: 1, V: 5, X: 10 };
  let total = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    const current = values[normalized[index]] ?? 0;
    const next = values[normalized[index + 1]] ?? 0;
    total += current < next ? -current : current;
  }
  return total;
}

function cleanOcrChapter(text) {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph
      .split("\n")
      .map((line) => line.trim().replace(/\s{2,}/g, " "))
      .filter((line) => {
        if (!line || /^\d+$/.test(line)) return false;
        if (/^CHAP\.\s*[IVXLN]+[.\]]/i.test(line)) return false;
        if (/^THE GOSPEL OF THE KINGDOM[,.]?$/i.test(line)) return false;
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
  throw new Error(`Verified Spurgeon source checksum changed: expected ${sourceChecksum}, received ${checksum}.`);
}

const headings = [...source.matchAll(/^CHAPTER\s+([IVXLN]+)[.,]?/gim)]
  .map((match) => ({ index: match.index, chapter: romanToNumber(match[1]), heading: match[0].trim() }))
  .filter((match) => match.index > 20_000 && match.chapter >= 1 && match.chapter <= 28);

const chapterStarts = [];
for (const heading of headings) {
  if (!chapterStarts.some((candidate) => candidate.chapter === heading.chapter)) chapterStarts.push(heading);
}
chapterStarts.sort((a, b) => a.chapter - b.chapter);

if (chapterStarts.length !== 28 || chapterStarts.some((heading, index) => heading.chapter !== index + 1)) {
  throw new Error(`Expected first headings for Matthew 1-28, received ${chapterStarts.map((heading) => `${heading.chapter}:${heading.heading}`).join(", ")}.`);
}

const entries = chapterStarts.map((heading, index) => {
  const chapter = index + 1;
  const end = chapterStarts[index + 1]?.index ?? source.length;
  const entryText = cleanOcrChapter(source.slice(heading.index, end));
  if (entryText.length < 4_000) {
    throw new Error(`Matthew ${chapter} commentary is unexpectedly short (${entryText.length} characters).`);
  }
  return {
    id: `spurgeon-gospel-kingdom-matthew-${chapter}-reviewed`,
    reference: `Matthew ${chapter}`,
    book: "Matthew",
    chapter,
    verse_start: 1,
    verse_end: verseEnds[index],
    author: "C. H. Spurgeon",
    resource_title: "The Gospel of the Kingdom",
    source_title: "The Gospel of the Kingdom: A Popular Exposition of the Gospel According to Matthew",
    source_url: "https://archive.org/details/cu31924029340720",
    public_domain_status: "Verified public domain",
    rights_basis: `1893 Baker & Taylor edition from Internet Archive item cu31924029340720. The scan states there are no known copyright restrictions in the United States. Verified source SHA-256: ${sourceChecksum}.`,
    recommended_use: "Read after the KJV chapter for concise Gospel exposition, preaching insight, and practical application. Keep the KJV text primary and spot-check historical OCR against the page scan before quotation.",
    entry_text: entryText,
    review_status: "Verified",
    import_status: "Public Verified",
    review_batch: "Spurgeon Gospel of the Kingdom Matthew Phase 1",
    review_notes: "Chapter boundaries were verified against the printed Matthew chapter sequence. Historical OCR was cleaned only for spacing and recurring page headers; wording was not modernized. OCR defects may remain.",
  };
});

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
console.log(`Spurgeon Matthew commentary written to ${outputPath}.`);
console.log(`Chapters: ${entries.length} (Matthew 1-28)`);
console.log(`Characters: ${entries.reduce((sum, entry) => sum + entry.entry_text.length, 0)}`);
