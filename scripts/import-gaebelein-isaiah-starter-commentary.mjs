#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const sourcePath =
  "data/library/verified/the-annotated-bible-the-holy-scriptures-analysed-and-annotated-gaebelein-arno-clemens-1861-1945.txt";
const outputPath = "data/imports/a-c-gaebelein-reviewed-isaiah-1-3-commentary.json";
const sourceUrl = "https://archive.org/download/annotatedbibleho04gaeb/annotatedbibleho04gaeb_djvu.txt";

const chapterRanges = [
  { chapter: 1, start: 4624, end: 4641, verseEnd: 31 },
  { chapter: 2, start: 4642, end: 4658, verseEnd: 22 },
  { chapter: 3, start: 4659, end: 4676, verseEnd: 26 },
];

const pageHeaderPattern = /^(?:\d+\s+)?T(?:HE|EE)\s+PROPHET\s+ISAIAH[,.]?\s*\d*$/i;

function cleanSourceText(lines) {
  const paragraphs = [];
  let paragraph = "";

  const flush = () => {
    if (paragraph) paragraphs.push(paragraph);
    paragraph = "";
  };

  for (const rawLine of lines) {
    const line = rawLine.trim().replace(/\s+/g, " ");
    if (!line) {
      flush();
      continue;
    }
    if (pageHeaderPattern.test(line)) continue;

    if (!paragraph) paragraph = line;
    else if (paragraph.endsWith("-") && /^[a-z]/.test(line)) paragraph = `${paragraph.slice(0, -1)}${line}`;
    else paragraph = `${paragraph} ${line}`;
  }
  flush();

  return paragraphs
    .join("\n\n")
    .replaceAll("iv:l", "iv:1")
    .replaceAll("called ''The City", 'called "The City');
}

const sourceLines = (await readFile(sourcePath, "utf8")).split(/\r?\n/);
const rows = chapterRanges.map(({ chapter, start, end, verseEnd }) => ({
  id: `a-c-gaebelein-isaiah-${chapter}-reviewed`,
  reference: `Isaiah ${chapter}`,
  book: "Isaiah",
  chapter,
  verse_start: 1,
  verse_end: verseEnd,
  author: "A. C. Gaebelein",
  resource_title: "The Annotated Bible",
  source_title: "The Annotated Bible: The Holy Scriptures Analysed and Annotated, Volume IV",
  source_url: sourceUrl,
  public_domain_status: "Verified public domain",
  rights_basis: `Verified public-domain 1921 source reviewed from ${sourceUrl}.`,
  recommended_use:
    "Use as a concise dispensational comparison voice after reading the KJV text; compare interpretive conclusions with Scripture and the other public-domain commentaries.",
  entry_text: cleanSourceText(sourceLines.slice(start - 1, end)),
  review_status: "Verified",
  import_status: "Public Verified",
  review_batch: "Isaiah Commentary Depth Starter",
  review_notes: `Source lines ${start}-${end} were assigned to Isaiah ${chapter}. OCR whitespace, scan line-wrap hyphenation, repeated page headers, and two obvious reference/quotation recognition errors were cleaned; source wording was otherwise preserved.`,
}));

if (rows.some((row) => !row.entry_text || row.entry_text.length < 300)) {
  throw new Error("One or more Gaebelein Isaiah chapter entries are unexpectedly short.");
}

await writeFile(outputPath, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} verified Gaebelein Isaiah commentary chapters to ${outputPath}.`);
