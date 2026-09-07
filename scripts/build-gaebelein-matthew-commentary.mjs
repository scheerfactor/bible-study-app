#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/the-gospel-of-matthew-an-exposition-gaebelein-arno-clemens-1861-1945-2.txt";
const outputPath = "data/imports/a-c-gaebelein-reviewed-matthew-commentary.json";
const sourceUrl = "https://archive.org/download/gospelofmatthewe01gaebuoft/gospelofmatthewe01gaebuoft_djvu.txt";
const resourceTitle = "The Gospel of Matthew: An Exposition";
const expectedSourceChecksum = "81f896fbdebbf7f75262afa1c00924c1c2e27799aaa79c406380864c70a8d5f0";
const verseEnds = [25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 50, 58, 36, 39, 28, 27, 35, 30, 34, 46, 46, 39, 51, 46, 75, 66, 20];

function romanToNumber(value) {
  const values = { I: 1, V: 5, X: 10, L: 50, C: 100 };
  return [...value.toUpperCase()].reduceRight((total, character, index, characters) => {
    const current = values[character] ?? 0;
    const next = values[characters[index + 1]] ?? 0;
    return total + (current < next ? -current : current);
  }, 0);
}

function cleanOcr(text) {
  return text
    .replace(/\r/g, "")
    .replace(/([A-Za-z])-[ \t]*\n[ \t]*([a-z])/g, "$1$2")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph
      .split("\n")
      .map((line) => line.trim().replace(/\s{2,}/g, " "))
      .filter((line) => line && !/^\d+$/.test(line))
      .join(" ")
      .trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

const source = await readFile(sourcePath, "utf8");
const sourceChecksum = createHash("sha256").update(source).digest("hex");
if (sourceChecksum !== expectedSourceChecksum) {
  throw new Error(`Unexpected Gaebelein Matthew source checksum: ${sourceChecksum}`);
}

const headings = [];
for (const match of source.matchAll(/^CHAPTER\s+([IVXLCDM]+)\.\s*$/gmi)) {
  const chapter = romanToNumber(match[1]);
  if (chapter >= 1 && chapter <= 28) headings.push({ chapter, start: match.index });
}
if (headings.length !== 28 || headings.some((heading, index) => heading.chapter !== index + 1)) {
  throw new Error(`Expected canonical Matthew 1-28 headings; found ${headings.map((heading) => heading.chapter).join(", ")}.`);
}

const bookEnd = source.indexOf("\nINDEX  TO  VOLUME", headings[27].start);
if (bookEnd < 0) throw new Error("Could not locate the end of the Matthew exposition.");

const entries = headings.map((heading, index) => {
  const chapter = heading.chapter;
  const end = headings[index + 1]?.start ?? bookEnd;
  const entryText = cleanOcr(source.slice(heading.start, end)).replace(/^[^\n]+/, `CHAPTER ${chapter}.`);
  if (entryText.length < 8_000) {
    throw new Error(`Matthew ${chapter} commentary is unexpectedly short (${entryText.length} characters).`);
  }

  return {
    id: `a-c-gaebelein-matthew-${chapter}-reviewed-1910`,
    reference: `Matthew ${chapter}`,
    book: "Matthew",
    chapter,
    verse_start: 1,
    verse_end: verseEnds[index],
    author: "Arno C. Gaebelein",
    resource_title: resourceTitle,
    source_title: "The Gospel of Matthew: An Exposition (1910)",
    source_url: sourceUrl,
    public_domain_status: "Verified public domain in the United States",
    rights_basis: `Published in 1910 and public domain in the United States. Verified source SHA-256: ${sourceChecksum}.`,
    recommended_use: "Read after the KJV chapter for dispensational exposition of Jesus Christ as King, the kingdom message, prophecy, parables, discipleship, the cross, and resurrection. Keep the KJV text primary and compare every conclusion with Scripture.",
    entry_text: entryText,
    review_status: "Verified",
    import_status: "Public Verified",
    review_batch: "Arno C. Gaebelein Gospel of Matthew Complete Chapter Integration",
    review_notes: "All twenty-eight chapters were segmented from the book's printed headings. Line-wrap hyphenation, spacing, and isolated page numbers were cleaned without modernizing the author's wording. The alphabetical index is excluded. Spot-check the scan before public quotation.",
  };
});

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
console.log(`Arno C. Gaebelein Matthew commentary written to ${outputPath}.`);
console.table(entries.map((entry) => ({ reference: entry.reference, characters: entry.entry_text.length })));
console.log(`Total characters: ${entries.reduce((sum, entry) => sum + entry.entry_text.length, 0)}`);
