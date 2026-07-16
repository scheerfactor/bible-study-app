#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/the-expositor-s-bible-the-second-book-of-kings-f-w-farrar.txt";
const outputPath = "data/imports/f-w-farrar-reviewed-2-kings-starter-commentary.json";
const sourceUrl = "https://www.gutenberg.org/ebooks/42027";

const passageRanges = [
  {
    id: "2-kings-1-1-18",
    reference: "2 Kings 1:1-18",
    chapter: 1,
    verseStart: 1,
    verseEnd: 18,
    start: 678,
    end: 1180,
  },
  {
    id: "2-kings-2-1-18",
    reference: "2 Kings 2:1-18",
    chapter: 2,
    verseStart: 1,
    verseEnd: 18,
    start: 1181,
    end: 1500,
  },
  {
    id: "2-kings-3-4-27",
    reference: "2 Kings 3:4-27",
    chapter: 3,
    verseStart: 4,
    verseEnd: 27,
    start: 1501,
    end: 1845,
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
const rows = passageRanges.map(({ id, reference, chapter, verseStart, verseEnd, start, end }) => ({
  id: `f-w-farrar-${id}-reviewed`,
  reference,
  book: "2 Kings",
  chapter,
  verse_start: verseStart,
  verse_end: verseEnd,
  author: "F. W. Farrar",
  resource_title: "The Expositor's Bible: The Second Book of Kings",
  source_title: "The Expositor's Bible: The Second Book of Kings",
  source_url: sourceUrl,
  public_domain_status: "Verified public domain",
  rights_basis: `Verified public-domain edition reviewed from Project Gutenberg: ${sourceUrl}.`,
  recommended_use:
    "Use as a historical and expository comparison voice after reading the KJV text; evaluate historical-critical conclusions by Scripture and compare them with the other public-domain commentaries.",
  entry_text: cleanSourceText(sourceLines.slice(start - 1, end)),
  review_status: "Verified",
  import_status: "Public Verified",
  review_batch: "2 Kings Commentary Depth Starter",
  review_notes: `Source lines ${start}-${end} cover ${reference}. Project Gutenberg emphasis markers and OCR whitespace were cleaned; source wording was otherwise preserved.`,
}));

if (rows.some((row) => !row.entry_text || row.entry_text.length < 1_000)) {
  throw new Error("One or more Farrar 2 Kings entries are unexpectedly short.");
}

await writeFile(outputPath, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} verified F. W. Farrar 2 Kings essays to ${outputPath}.`);
