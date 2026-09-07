#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/the-prophet-joel-an-exposition-gaebelein-arno-clemens-1861-1945.txt";
const outputPath = "data/imports/a-c-gaebelein-reviewed-joel-commentary.json";
const sourceUrl = "https://archive.org/download/prophetjoelexpos00gaebiala/prophetjoelexpos00gaebiala_djvu.txt";
const resourceTitle = "The Prophet Joel: An Exposition";
const expectedSourceChecksum = "02af3d9dc67c0e01f20007039dfc0f29d0a55a88e090543324fdba90ee77fe09";
const verseEnds = [20, 32, 21];

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
        if (/^CHAPTER\s+[IVXLCDM0-9]+\.\s+(?:\d+|pi|ill)$/i.test(line)) return false;
        if (/^(?:\d+\s+)?THE BOOK OF JOEL\.?(?:\s+\d+)?$/i.test(line)) return false;
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
  throw new Error(`Unexpected Gaebelein Joel source checksum: ${sourceChecksum}`);
}

const expositionStart = source.indexOf("prepared  to  take  up  the  chapters  separate-");
if (expositionStart < 0) throw new Error("Could not locate the start of the analytical Joel exposition.");

const headings = [];
for (const match of source.slice(expositionStart).matchAll(/^CHAPTER\s+([IVXLCDM]+)\.\s*$/gm)) {
  const chapter = romanToNumber(match[1]);
  if (chapter >= 1 && chapter <= 3) headings.push({ chapter, start: expositionStart + match.index });
}
if (headings.length !== 3 || headings.some((heading, index) => heading.chapter !== index + 1)) {
  throw new Error(`Expected canonical Joel 1-3 headings; found ${headings.map((heading) => heading.chapter).join(", ")}.`);
}

const bookEnd = source.indexOf("APPENDIX  A.", headings[2].start);
if (bookEnd < 0) throw new Error("Could not locate the end of the Joel exposition.");

const entries = headings.map((heading, index) => {
  const chapter = heading.chapter;
  const end = headings[index + 1]?.start ?? bookEnd;
  const entryText = cleanOcr(source.slice(heading.start, end)).replace(/^CHAPTER\s+[IVXLCDM]+\./i, `CHAPTER ${chapter}.`);
  if (entryText.length < 10_000) {
    throw new Error(`Joel ${chapter} commentary is unexpectedly short (${entryText.length} characters).`);
  }

  return {
    id: `a-c-gaebelein-joel-${chapter}-reviewed-1909`,
    reference: `Joel ${chapter}`,
    book: "Joel",
    chapter,
    verse_start: 1,
    verse_end: verseEnds[index],
    author: "Arno C. Gaebelein",
    resource_title: resourceTitle,
    source_title: "The Prophet Joel: An Exposition (1909)",
    source_url: sourceUrl,
    public_domain_status: "Verified public domain in the United States",
    rights_basis: `Published in 1909 and public domain in the United States. Verified source SHA-256: ${sourceChecksum}.`,
    recommended_use: "Read after the KJV chapter for dispensational exposition of prophecy, repentance, prayer, the day of the Lord, the outpouring of the Spirit, restoration, and the coming kingdom. Keep the KJV text primary and compare every conclusion with Scripture.",
    entry_text: entryText,
    review_status: "Verified",
    import_status: "Public Verified",
    review_batch: "Arno C. Gaebelein Prophet Joel Complete Chapter Integration",
    review_notes: "All three chapters were segmented from the analytical exposition's printed headings. Line-wrap hyphenation, spacing, running titles, and isolated page numbers were cleaned without modernizing the author's wording. The preliminary alternate translation and appendices are excluded. Spot-check the scan before public quotation.",
  };
});

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
console.log(`Arno C. Gaebelein Joel commentary written to ${outputPath}.`);
console.table(entries.map((entry) => ({ reference: entry.reference, characters: entry.entry_text.length })));
console.log(`Total characters: ${entries.reduce((sum, entry) => sum + entry.entry_text.length, 0)}`);
