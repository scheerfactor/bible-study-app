#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const sourcePath =
  "data/library/verified/the-annotated-bible-the-holy-scriptures-analyzed-and-annotated-arno-c-gaebelein.txt";
const outputPath = "data/imports/a-c-gaebelein-reviewed-exodus-1-3-commentary.json";
const sourceUrl =
  "https://archive.org/download/annotatedbibleho0001arno/annotatedbibleho0001arno_djvu.txt";

const chapterRanges = [
  { chapter: 1, start: 5625, end: 5742, verseEnd: 22 },
  { chapter: 2, start: 5743, end: 5943, verseEnd: 25 },
  { chapter: 3, start: 5944, end: 6084, verseEnd: 22 },
];

const pageHeaderPattern = /^(?:\d+\s+)?THE\s+BOOK\s+OF\s+EXODUS\.?\s*[0-9s]*\.?$/i;
const decorativeScanPattern = /^(?:ROE OR Vom|SO CO =|Gi\) ae)$/;

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
    if (pageHeaderPattern.test(line) || decorativeScanPattern.test(line)) continue;

    if (!paragraph) paragraph = line;
    else if (paragraph.endsWith("-") && /^[a-z]/.test(line)) paragraph = `${paragraph.slice(0, -1)}${line}`;
    else paragraph = `${paragraph} ${line}`;
  }
  flush();

  let text = paragraphs.join("\n\n");
  const reviewedOcrCorrections = new Map([
    ["CHAPTER It.", "CHAPTER III."],
    ["deliyerance", "deliverance"],
    ["athornbush", "a thornbush"],
    ["come tec years", "come to years"],
    ["refused tobe", "refused to be"],
    ["Esteeming the 5, Lat of Christ", "Esteeming the reproach of Christ"],
    ["whoisinvisible", "who is invisible"],
    ["and suck “a son.”", "and such “a son.”"],
    ["selfconfidence", "self-confidence"],
    ["allsufficient", "all-sufficient"],
    ["emptyhanded", "empty-handed"],
    ["He isthe One", "He is the One"],
    ["the J am", "the I am"],
    ["Before Abraham was Iam", "Before Abraham was I am"],
    ["Himself J am", "Himself I am"],
    ["thelamthatIam", "the I am that I am"],
    ["Z am hath", "I am hath"],
  ]);
  for (const [ocr, correction] of reviewedOcrCorrections) text = text.replaceAll(ocr, correction);

  return text
    .replace(/\n\n\. Their Disobedience/, "\n\nTheir Disobedience")
    .replace(
      /\n\nWe give a little diagram of the genealogy of Moses and his brother Aaron\.[\s\S]*?courses of priests\. \(1 Chron\. ch\. 24\.\)/,
      "",
    );
}

const sourceLines = (await readFile(sourcePath, "utf8")).split(/\r?\n/);
const rows = chapterRanges.map(({ chapter, start, end, verseEnd }) => ({
  id: `a-c-gaebelein-exodus-${chapter}-reviewed`,
  reference: `Exodus ${chapter}`,
  book: "Exodus",
  chapter,
  verse_start: 1,
  verse_end: verseEnd,
  author: "A. C. Gaebelein",
  resource_title: "The Annotated Bible",
  source_title: "The Annotated Bible: The Holy Scriptures Analyzed and Annotated, Volume I",
  source_url: sourceUrl,
  public_domain_status: "Verified public domain",
  rights_basis: `Verified public-domain 1913 source reviewed from ${sourceUrl}.`,
  recommended_use:
    "Use as a dispensational comparison voice after reading the KJV text; compare interpretive conclusions with Scripture and the other public-domain commentaries.",
  entry_text: cleanSourceText(sourceLines.slice(start - 1, end)),
  review_status: "Verified",
  import_status: "Public Verified",
  review_batch: "Exodus Commentary Depth Starter",
  review_notes: `Source lines ${start}-${end} were assigned to Exodus ${chapter}. OCR whitespace, scan line-wrap hyphenation, repeated page headers, decorative scan artifacts, and a small reviewed list of obvious character-recognition errors were cleaned. The damaged genealogy diagram in chapter 2 was omitted because its layout could not be represented reliably; source wording was otherwise preserved.`,
}));

if (rows.some((row) => !row.entry_text || row.entry_text.length < 300)) {
  throw new Error("One or more Gaebelein Exodus chapter entries are unexpectedly short.");
}

await writeFile(outputPath, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} verified Gaebelein Exodus commentary chapters to ${outputPath}.`);
