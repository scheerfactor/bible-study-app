#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const sourcePath =
  "data/library/verified/the-annotated-bible-the-holy-scriptures-analyzed-and-annotated-gaebelein-arno-clemens-1861-1945.txt";
const outputPath = "data/imports/a-c-gaebelein-reviewed-amos-commentary.json";
const sourceUrl = "https://archive.org/download/annotatedbible05gaeb/annotatedbible05gaeb_djvu.txt";

const chapterRanges = [
  { chapter: 1, start: 5514, end: 5777, verseEnd: 15 },
  { chapter: 2, start: 5778, end: 5848, verseEnd: 16 },
  { chapter: 3, start: 5849, end: 5951, verseEnd: 15 },
  { chapter: 4, start: 5952, end: 6016, verseEnd: 13 },
  { chapter: 5, start: 6017, end: 6136, verseEnd: 27 },
  { chapter: 6, start: 6137, end: 6193, verseEnd: 14 },
  { chapter: 7, start: 6194, end: 6263, verseEnd: 17 },
  { chapter: 8, start: 6264, end: 6334, verseEnd: 14 },
  { chapter: 9, start: 6335, end: 6424, verseEnd: 15 },
];

const pageHeaderPattern = /^(?:\d+\s+)?T(?:HE|EE)\s+PROPHET\s+AMOS\s*\d*$/i;

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

  let text = paragraphs.join("\n\n");
  const reviewedOcrCorrections = new Map([
    ["diflSculty", "difficulty"],
    ["diflFerent", "different"],
    ["opportimity", "opportunity"],
    ["miUennium", "millennium"],
    ["nVE", "FIVE"],
    ["v/ould", "would"],
  ]);
  for (const [ocr, correction] of reviewedOcrCorrections) text = text.replaceAll(ocr, correction);

  return text
    .replace(/\bTEE PROPHET AMOS\b/g, "THE PROPHET AMOS")
    .replace(/\bCHAPTER n\b/g, "CHAPTER II")
    .replace(/\bCHAPTER in\b/g, "CHAPTER III")
    .replace(/\bChapters i-11\b/g, "Chapters I-II")
    .replace(/\bChapter vii-ix\b/g, "Chapters VII-IX");
}

const sourceLines = (await readFile(sourcePath, "utf8")).split(/\r?\n/);
const rows = chapterRanges.map(({ chapter, start, end, verseEnd }) => ({
  id: `a-c-gaebelein-amos-${chapter}-reviewed`,
  reference: `Amos ${chapter}`,
  book: "Amos",
  chapter,
  verse_start: 1,
  verse_end: verseEnd,
  author: "A. C. Gaebelein",
  resource_title: "The Annotated Bible",
  source_title: "The Annotated Bible: The Holy Scriptures Analyzed and Annotated",
  source_url: sourceUrl,
  public_domain_status: "Verified public domain",
  rights_basis: `Verified public-domain source reviewed from ${sourceUrl}.`,
  recommended_use:
    "Use as a dispensational, whole-book comparison voice after reading the KJV text; compare interpretive conclusions with Scripture and the other public-domain commentaries.",
  entry_text: cleanSourceText(sourceLines.slice(start - 1, end)),
  review_status: "Verified",
  import_status: "Public Verified",
  review_batch: "Amos Commentary Expansion",
  review_notes: `Source lines ${start}-${end} were assigned to Amos ${chapter}. OCR whitespace, scan line-wrap hyphenation, repeated page headers, and a small reviewed list of obvious character-recognition errors were cleaned; source wording was otherwise preserved.`,
}));

if (rows.some((row) => !row.entry_text || row.entry_text.length < 300)) {
  throw new Error("One or more Gaebelein Amos chapter entries are unexpectedly short.");
}

await writeFile(outputPath, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} verified Gaebelein Amos commentary chapters to ${outputPath}.`);
