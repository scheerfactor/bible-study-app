#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/the-prophet-daniel-a-key-to-the-visions-and-prophecies-of-the-book-of-daniel-gaebelein-arno-clemens-1861-1945-2.txt";
const outputPath = "data/imports/a-c-gaebelein-reviewed-daniel-commentary.json";
const sourceUrl = "https://archive.org/download/prophetdanielkey00gae/prophetdanielkey00gae_djvu.txt";
const resourceTitle = "The Prophet Daniel: A Key to the Visions and Prophecies";
const expectedSourceChecksum = "167064e33c7426a25a9492e8fd990183a59e37c56399f78ba4f1e45bc1c5d890";
const verseEnds = [21, 49, 30, 37, 31, 28, 28, 27, 27, 21, 45, 13];

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
      .filter((line) => {
        if (!line || /^\d+$/.test(line)) return false;
        if (/^\d+\s+THE PROPHET DANIEL$/i.test(line)) return false;
        if (/^THE PROPHET DANIEL\s+\d+$/i.test(line)) return false;
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
  throw new Error(`Unexpected Gaebelein Daniel source checksum: ${sourceChecksum}`);
}

const headings = [];
for (const match of source.matchAll(/^CHAPTER\s+([IVXLCDM]+)\s*$/gmi)) {
  const chapter = romanToNumber(match[1]);
  if (chapter >= 1 && chapter <= 12) headings.push({ chapter, start: match.index });
}
if (headings.length !== 12 || headings.some((heading, index) => heading.chapter !== index + 1)) {
  throw new Error(`Expected canonical Daniel 1-12 headings; found ${headings.map((heading) => heading.chapter).join(", ")}.`);
}

const bookEnd = source.indexOf("THE  END", headings[11].start);
if (bookEnd < 0) throw new Error("Could not locate the end of the Daniel exposition.");

const entries = headings.map((heading, index) => {
  const chapter = heading.chapter;
  const end = headings[index + 1]?.start ?? bookEnd;
  const entryText = cleanOcr(source.slice(heading.start, end)).replace(/^CHAPTER\s+[IVXLCDM]+/i, `CHAPTER ${chapter}`);
  if (entryText.length < 2_500) {
    throw new Error(`Daniel ${chapter} commentary is unexpectedly short (${entryText.length} characters).`);
  }

  return {
    id: `a-c-gaebelein-daniel-${chapter}-reviewed-1911`,
    reference: `Daniel ${chapter}`,
    book: "Daniel",
    chapter,
    verse_start: 1,
    verse_end: verseEnds[index],
    author: "Arno C. Gaebelein",
    resource_title: resourceTitle,
    source_title: "The Prophet Daniel: A Key to the Visions and Prophecies of the Book of Daniel (1911)",
    source_url: sourceUrl,
    public_domain_status: "Verified public domain in the United States",
    rights_basis: `Copyright 1911 and public domain in the United States. Verified source SHA-256: ${sourceChecksum}.`,
    recommended_use: "Read after the KJV chapter for dispensational exposition of Daniel's faithfulness, prayer, prophetic visions, the times of the Gentiles, Israel, and God's sovereign kingdom. Keep the KJV text primary and compare every conclusion with Scripture.",
    entry_text: entryText,
    review_status: "Verified",
    import_status: "Public Verified",
    review_batch: "Arno C. Gaebelein Prophet Daniel Complete Chapter Integration",
    review_notes: "All twelve chapters were segmented from the book's printed headings. Line-wrap hyphenation, spacing, running titles, and isolated page numbers were cleaned without modernizing the author's wording. The postscript authenticity appendix and advertising matter are excluded. Spot-check the scan before public quotation.",
  };
});

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
console.log(`Arno C. Gaebelein Daniel commentary written to ${outputPath}.`);
console.table(entries.map((entry) => ({ reference: entry.reference, characters: entry.entry_text.length })));
console.log(`Total characters: ${entries.reduce((sum, entry) => sum + entry.entry_text.length, 0)}`);
