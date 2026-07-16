#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/expositor-s-bible-the-book-of-job-robert-a-watson.txt";
const outputPath = "data/imports/robert-a-watson-reviewed-job-1-3-commentary.json";
const sourceUrl = "https://www.gutenberg.org/ebooks/40470";

const passageRanges = [
  { id: "job-1-1-5", reference: "Job 1:1-5", chapter: 1, verseStart: 1, verseEnd: 5, start: 601, end: 975 },
  { id: "job-1-6-12", reference: "Job 1:6-12", chapter: 1, verseStart: 6, verseEnd: 12, start: 976, end: 1429 },
  { id: "job-1-13-22", reference: "Job 1:13-22", chapter: 1, verseStart: 13, verseEnd: 22, start: 1430, end: 1902 },
  { id: "job-2", reference: "Job 2", chapter: 2, verseStart: 1, verseEnd: 13, start: 1903, end: 2305 },
  { id: "job-3", reference: "Job 3", chapter: 3, verseStart: 1, verseEnd: 26, start: 2313, end: 2724 },
];

function cleanSourceText(lines) {
  const paragraphs = [];
  let paragraph = "";

  const flush = () => {
    if (paragraph) paragraphs.push(paragraph);
    paragraph = "";
  };

  for (const rawLine of lines) {
    const line = rawLine
      .trim()
      .replace(/_([^_]+)_/g, "$1")
      .replace(/\s+/g, " ");
    if (!line) {
      flush();
      continue;
    }

    paragraph = paragraph ? `${paragraph} ${line}` : line;
  }
  flush();

  return paragraphs.join("\n\n").replaceAll("prosperous emeer", "prosperous emir");
}

const sourceLines = (await readFile(sourcePath, "utf8")).split(/\r?\n/);
const rows = passageRanges.map(({ id, reference, chapter, verseStart, verseEnd, start, end }) => ({
  id: `robert-a-watson-${id}-reviewed`,
  reference,
  book: "Job",
  chapter,
  verse_start: verseStart,
  verse_end: verseEnd,
  author: "Robert A. Watson",
  resource_title: "Expositor's Bible: The Book of Job",
  source_title: "The Expositor's Bible: The Book of Job",
  source_url: sourceUrl,
  public_domain_status: "Verified public domain",
  rights_basis: `Verified public-domain 1900 edition reviewed from Project Gutenberg: ${sourceUrl}.`,
  recommended_use:
    "Use as a pastoral and literary comparison voice after reading the KJV text; compare conclusions with Scripture and the other public-domain commentaries.",
  entry_text: cleanSourceText(sourceLines.slice(start - 1, end)),
  review_status: "Verified",
  import_status: "Public Verified",
  review_batch: "Job Commentary Depth Starter",
  review_notes: `Source lines ${start}-${end} were assigned to ${reference}. Project Gutenberg emphasis markers and OCR whitespace were cleaned, and one obvious character-recognition error was corrected; source wording was otherwise preserved.`,
}));

if (rows.some((row) => !row.entry_text || row.entry_text.length < 1_000)) {
  throw new Error("One or more Watson Job passage entries are unexpectedly short.");
}

await writeFile(outputPath, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} verified Robert A. Watson Job commentary passages to ${outputPath}.`);
