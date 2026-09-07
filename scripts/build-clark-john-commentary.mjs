#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/the-gospel-of-john-a-popular-commentary-upon-a-critical-basis-especialy-designed-for-pastors-and-sunday-school.txt";
const outputPath = "data/imports/george-w-clark-reviewed-john-commentary.json";
const sourceUrl = "https://archive.org/download/gospelofjohnpopu04clar/gospelofjohnpopu04clar_djvu.txt";
const resourceTitle = "The Gospel of John: A Popular Commentary";
const expectedSourceChecksum = "49ba3c344e02685cadaaa5a1010a588cd3de26e3a72aa5434b6efc90b71a37d4";
const verseEnds = [51, 25, 36, 54, 47, 71, 53, 59, 41, 42, 57, 50, 38, 31, 27, 33, 26, 40, 42, 31, 25];

function romanToNumber(value) {
  const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    const current = values[value[index]];
    const next = values[value[index + 1]] ?? 0;
    total += current < next ? -current : current;
  }
  return total;
}

function cleanOcr(text) {
  const pageHeaders = [
    /^\d+$/,
    /^A\.\s*D\.\s*[0-9A-Z.,:\s-]+$/i,
    /^\d+\s+JOHN\s+[IVXLCDM]+\.?$/i,
    /^JOHN\s+\S{1,6}$/i,
  ];

  return text
    .replace(/\r/g, "")
    .replace(/([A-Za-z])-[ \t]*\n[ \t]*([a-z])/g, "$1$2")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph
      .split("\n")
      .map((line) => line.trim().replace(/\s{2,}/g, " "))
      .filter((line) => line && !pageHeaders.some((pattern) => pattern.test(line)))
      .join(" ")
      .trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

const source = await readFile(sourcePath, "utf8");
const sourceChecksum = createHash("sha256").update(source).digest("hex");
if (sourceChecksum !== expectedSourceChecksum) {
  throw new Error(`Unexpected George W. Clark John source checksum: ${sourceChecksum}`);
}

const bodyStart = source.indexOf("THE  GOSPEL  ACCORDING  TO  JOHN.");
const bodyEnd = source.indexOf("\nINDEX.", bodyStart);
if (bodyStart < 0 || bodyEnd < 0) throw new Error("Could not locate the John commentary body.");
const body = source.slice(bodyStart, bodyEnd);

const headingPattern = /^CHAPTER\s+([IVXLCDM]+)\.?\s*$/gm;
const headings = [];
for (const match of body.matchAll(headingPattern)) {
  const chapter = match[1] === "VIIL" ? 8 : romanToNumber(match[1]);
  if (chapter === 1 && headings.some((heading) => heading.chapter === 1)) continue;
  headings.push({ chapter, start: match.index });
}

if (headings.length !== 21 || headings.some((heading, index) => heading.chapter !== index + 1)) {
  throw new Error(`Expected canonical John 1-21 headings; found ${headings.map((heading) => heading.chapter).join(", ")}.`);
}

const entries = headings.map((heading, index) => {
  const chapter = heading.chapter;
  const end = headings[index + 1]?.start ?? body.length;
  const entryText = cleanOcr(body.slice(heading.start, end));
  if (entryText.length < 4_000) {
    throw new Error(`John ${chapter} commentary is unexpectedly short (${entryText.length} characters).`);
  }

  return {
    id: `george-w-clark-john-${chapter}-reviewed-1896`,
    reference: `John ${chapter}`,
    book: "John",
    chapter,
    verse_start: 1,
    verse_end: verseEnds[index],
    author: "George W. Clark",
    resource_title: resourceTitle,
    source_title: "The Gospel of John: A Popular Commentary upon a Critical Basis (Revised Edition, 1896)",
    source_url: sourceUrl,
    public_domain_status: "Verified public domain in the United States",
    rights_basis: `Revised edition published in 1896 and public domain in the United States. Verified source SHA-256: ${sourceChecksum}.`,
    recommended_use: "Read after the KJV chapter for verse-by-verse historical exposition, lesson preparation, doctrinal observations, geography, chronology, and practical teaching suggestions. Keep the KJV text primary and compare every conclusion with Scripture.",
    entry_text: entryText,
    review_status: "Verified",
    import_status: "Public Verified",
    review_batch: "George W. Clark Gospel of John Complete Chapter Integration",
    review_notes: "All twenty-one chapters were segmented from the book's printed chapter headings. Line-wrap hyphenation, spacing, and recurring page headers were cleaned without modernizing the author's wording. Spot-check the scan before public quotation.",
  };
});

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
console.log(`George W. Clark John commentary written to ${outputPath}.`);
console.table(entries.map((entry) => ({ reference: entry.reference, characters: entry.entry_text.length })));
console.log(`Total characters: ${entries.reduce((sum, entry) => sum + entry.entry_text.length, 0)}`);
