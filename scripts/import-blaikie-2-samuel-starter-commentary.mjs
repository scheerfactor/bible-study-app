#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const sourcePath =
  "data/library/verified/the-expositor-s-bible-the-second-book-of-samuel-blaikie-william-garden-and-nicoll-w-robertson-william-robertso.txt";
const outputPath = "data/imports/w-g-blaikie-reviewed-2-samuel-starter-commentary.json";
const sourceUrl = "https://www.gutenberg.org/ebooks/44619";

const passageRanges = [
  {
    id: "2-samuel-1",
    reference: "2 Samuel 1",
    chapter: 1,
    verseStart: 1,
    verseEnd: 27,
    start: 256,
    end: 589,
  },
  {
    id: "2-samuel-2-1-7",
    reference: "2 Samuel 2:1-7",
    chapter: 2,
    verseStart: 1,
    verseEnd: 7,
    start: 590,
    end: 928,
  },
  {
    id: "2-samuel-2-12-32",
    reference: "2 Samuel 2:12-32",
    chapter: 2,
    verseStart: 12,
    verseEnd: 32,
    start: 929,
    end: 1245,
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
      .replace(/=([^=]+)=/g, "$1")
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
  id: `w-g-blaikie-${id}-reviewed`,
  reference,
  book: "2 Samuel",
  chapter,
  verse_start: verseStart,
  verse_end: verseEnd,
  author: "W. G. Blaikie",
  resource_title: "The Expositor's Bible: The Second Book of Samuel",
  source_title: "The Expositor's Bible: The Second Book of Samuel",
  source_url: sourceUrl,
  public_domain_status: "Verified public domain",
  rights_basis: `Verified public-domain 1898 edition reviewed from Project Gutenberg: ${sourceUrl}.`,
  recommended_use:
    "Use as a pastoral and homiletical comparison voice after reading the KJV text; compare conclusions with Scripture and the other public-domain commentaries.",
  entry_text: cleanSourceText(sourceLines.slice(start - 1, end)),
  review_status: "Verified",
  import_status: "Public Verified",
  review_batch: "2 Samuel Commentary Depth Starter",
  review_notes: `Source lines ${start}-${end} cover ${reference}. Project Gutenberg emphasis markers and OCR whitespace were cleaned; source wording was otherwise preserved.`,
}));

if (rows.some((row) => !row.entry_text || row.entry_text.length < 1_000)) {
  throw new Error("One or more Blaikie 2 Samuel entries are unexpectedly short.");
}

await writeFile(outputPath, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} verified W. G. Blaikie 2 Samuel essays to ${outputPath}.`);
