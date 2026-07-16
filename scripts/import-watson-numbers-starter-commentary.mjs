#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/the-expositor-s-bible-the-book-of-numbers-robert-a-watson.txt";
const outputPath = "data/imports/robert-a-watson-reviewed-numbers-1-5-commentary.json";
const sourceUrl = "https://www.gutenberg.org/ebooks/42639";

const passageRanges = [
  {
    id: "numbers-1-2",
    reference: "Numbers 1-2",
    chapter: 1,
    verseEnd: 54,
    start: 778,
    end: 1086,
  },
  {
    id: "numbers-3-4",
    reference: "Numbers 3-4",
    chapter: 3,
    verseEnd: 51,
    start: 1087,
    end: 1566,
  },
  {
    id: "numbers-5",
    reference: "Numbers 5",
    chapter: 5,
    verseEnd: 31,
    start: 1567,
    end: 1925,
  },
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

  return paragraphs.join("\n\n");
}

const sourceLines = (await readFile(sourcePath, "utf8")).split(/\r?\n/);
const rows = passageRanges.map(({ id, reference, chapter, verseEnd, start, end }) => ({
  id: `robert-a-watson-${id}-reviewed`,
  reference,
  book: "Numbers",
  chapter,
  verse_start: 1,
  verse_end: verseEnd,
  author: "Robert A. Watson",
  resource_title: "The Expositor's Bible: The Book of Numbers",
  source_title: "The Expositor's Bible: The Book of Numbers",
  source_url: sourceUrl,
  public_domain_status: "Verified public domain",
  rights_basis: `Verified public-domain edition reviewed from Project Gutenberg: ${sourceUrl}.`,
  recommended_use:
    "Use as a pastoral and historical comparison voice after reading the KJV text; evaluate historical-critical conclusions by Scripture and compare them with the other public-domain commentaries.",
  entry_text: cleanSourceText(sourceLines.slice(start - 1, end)),
  review_status: "Verified",
  import_status: "Public Verified",
  review_batch: "Numbers Commentary Depth Starter",
  review_notes: `Source lines ${start}-${end} cover ${reference} and are linked from the first chapter of that range. Project Gutenberg emphasis markers and OCR whitespace were cleaned; source wording was otherwise preserved.`,
}));

if (rows.some((row) => !row.entry_text || row.entry_text.length < 1_000)) {
  throw new Error("One or more Watson Numbers entries are unexpectedly short.");
}

await writeFile(outputPath, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} verified Robert A. Watson Numbers essays to ${outputPath}.`);
