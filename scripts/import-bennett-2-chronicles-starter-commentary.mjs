#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/the-expositor-s-bible-the-books-of-chronicles-w-h-bennett.txt";
const outputPath = "data/imports/w-h-bennett-reviewed-2-chronicles-starter-commentary.json";
const sourceUrl = "https://www.gutenberg.org/ebooks/40235";

const passageRanges = [
  {
    id: "2-chronicles-10-13",
    reference: "2 Chronicles 10-13",
    chapter: 10,
    verseEnd: 19,
    start: 7993,
    end: 8462,
  },
  {
    id: "2-chronicles-14-16",
    reference: "2 Chronicles 14-16",
    chapter: 14,
    verseEnd: 15,
    start: 8463,
    end: 9171,
  },
  {
    id: "2-chronicles-17-20",
    reference: "2 Chronicles 17-20",
    chapter: 17,
    verseEnd: 19,
    start: 9172,
    end: 9855,
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
  id: `w-h-bennett-${id}-reviewed`,
  reference,
  book: "2 Chronicles",
  chapter,
  verse_start: 1,
  verse_end: verseEnd,
  author: "W. H. Bennett",
  resource_title: "The Expositor's Bible: The Books of Chronicles",
  source_title: "The Expositor's Bible: The Books of Chronicles",
  source_url: sourceUrl,
  public_domain_status: "Verified public domain",
  rights_basis: `Verified public-domain 1894 edition reviewed from Project Gutenberg: ${sourceUrl}.`,
  recommended_use:
    "Use as a historical and homiletical comparison voice after reading the KJV text; evaluate historical-critical conclusions by Scripture and compare them with the other public-domain commentaries.",
  entry_text: cleanSourceText(sourceLines.slice(start - 1, end)),
  review_status: "Verified",
  import_status: "Public Verified",
  review_batch: "2 Chronicles Commentary Depth Starter",
  review_notes: `Source lines ${start}-${end} cover ${reference} and are linked from the first chapter of that range. Project Gutenberg emphasis markers and OCR whitespace were cleaned; source wording was otherwise preserved.`,
}));

if (rows.some((row) => !row.entry_text || row.entry_text.length < 1_000)) {
  throw new Error("One or more Bennett 2 Chronicles entries are unexpectedly short.");
}

await writeFile(outputPath, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} verified W. H. Bennett 2 Chronicles essays to ${outputPath}.`);
