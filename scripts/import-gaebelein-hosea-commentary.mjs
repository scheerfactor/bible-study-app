#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const sourcePath =
  "data/library/verified/the-annotated-bible-the-holy-scriptures-analyzed-and-annotated-gaebelein-arno-clemens-1861-1945.txt";
const outputPath = "data/imports/a-c-gaebelein-reviewed-hosea-commentary.json";
const sourceUrl = "https://archive.org/download/annotatedbible05gaeb/annotatedbible05gaeb_djvu.txt";

const chapterRanges = [
  { chapter: 1, start: 2311, end: 2763, verseEnd: 11 },
  { chapter: 2, start: 2764, end: 2882, verseEnd: 23 },
  { chapter: 3, start: 2883, end: 2989, verseEnd: 5 },
  { chapter: 4, start: 2990, end: 3056, verseEnd: 19 },
  { chapter: 5, start: 3057, end: 3158, verseEnd: 15 },
  { chapter: 6, start: 3159, end: 3274, verseEnd: 11 },
  { chapter: 7, start: 3275, end: 3347, verseEnd: 16 },
  { chapter: 8, start: 3348, end: 3398, verseEnd: 14 },
  { chapter: 9, start: 3399, end: 3443, verseEnd: 17 },
  { chapter: 10, start: 3444, end: 3503, verseEnd: 15 },
  { chapter: 11, start: 3504, end: 3606, verseEnd: 12 },
  { chapter: 12, start: 3581, end: 3672, verseEnd: 14 },
  { chapter: 13, start: 3673, end: 3779, verseEnd: 16 },
  { chapter: 14, start: 3780, end: 3890, verseEnd: 9 },
];

const pageHeaderPattern = /^(?:\d+\s+)?T(?:HE|EE)\s+PROPHET\s+(?:HOSEA|ROSEA|HOSE\s*A)\s*\d*$/i;

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

    if (!paragraph) {
      paragraph = line;
    } else if (paragraph.endsWith("-") && /^[a-z]/.test(line)) {
      paragraph = `${paragraph.slice(0, -1)}${line}`;
    } else {
      paragraph = `${paragraph} ${line}`;
    }
  }
  flush();
  let text = paragraphs.join("\n\n").replace(/-\n\n(?=[A-Za-z])/g, "");
  const reviewedOcrCorrections = new Map([
    ["Attentioii", "Attention"],
    ["covenr at", "covenant"],
    ["controversey", "controversy"],
    ["diflBcult", "difficult"],
    ["difiFerent", "different"],
    ["dottering", "tottering"],
    ["Ephralm", "Ephraim"],
    ["fNote", "Note"],
    ["herin", "her in"],
    ["Israei", "Israel"],
    ["Ivr.d", "had"],
    ["Jacob*s", "Jacob's"],
    ["Johovah's", "Jehovah's"],
    ["miiversal", "universal"],
    ["Pekak", "Pekah"],
    ["redeiription", "redemption"],
    ["Retiirn", "Return"],
    ["selfexaltatiou", "self-exaltation"],
    ["stiU", "still"],
    ["troduction", "introduction"],
    ["Ukewise", "Likewise"],
    ["v,ith", "with"],
    ["v/e", "we"],
    ["vith", "with"],
    ["wealoiess", "weakness"],
    ["wlio", "who"],
  ]);
  for (const [ocr, correction] of reviewedOcrCorrections) text = text.replaceAll(ocr, correction);
  text = text
    .replace(/\bco tlie\b/g, "to the")
    .replace(/\btlie\b/g, "the")
    .replace(/Judah 's/g, "Judah's")
    .replace(/CHAPTER Vn\b/g, "CHAPTER VII")
    .replace(/CHAPTER XI:12-Xn\b/g, "CHAPTER XI:12-XII")
    .replace(/Chapter ix\.l -9/g, "Chapter ix:1-9")
    .replace(/:l-ll\b/g, ":1-11")
    .replace(/:l-9\b/g, ":1-9")
    .replace(/:l-3\b/g, ":1-3");
  return text;
}

const sourceLines = (await readFile(sourcePath, "utf8")).split(/\r?\n/);
const rows = chapterRanges.map(({ chapter, start, end, verseEnd }) => ({
  id: `a-c-gaebelein-hosea-${chapter}-reviewed`,
  reference: `Hosea ${chapter}`,
  book: "Hosea",
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
  review_batch: "Hosea Completion",
  review_notes:
    `Source lines ${start}-${end} were assigned to Hosea ${chapter}. OCR whitespace, scan line-wrap hyphenation, repeated page headers, and a small reviewed list of obvious character-recognition errors were cleaned; source wording was otherwise preserved. Chapter 11:12-12:2 is included in both chapter views because the source treats it as one section.`,
}));

if (rows.some((row) => !row.entry_text || row.entry_text.length < 300)) {
  throw new Error("One or more Gaebelein Hosea chapter entries are unexpectedly short.");
}

await writeFile(outputPath, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} verified Gaebelein Hosea commentary chapters to ${outputPath}.`);
