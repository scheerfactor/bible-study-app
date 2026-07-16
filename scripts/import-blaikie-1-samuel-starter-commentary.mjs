#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const sourcePath =
  "data/library/verified/the-expositor-s-bible-the-first-book-of-samuel-blaikie-william-garden-and-nicoll-w-robertson-william-robertson.txt";
const outputPath = "data/imports/w-g-blaikie-reviewed-1-samuel-starter-commentary.json";
const sourceUrl = "https://www.gutenberg.org/ebooks/39394";

const passageRanges = [
  {
    id: "1-samuel-1-1-18",
    reference: "1 Samuel 1:1-18",
    chapter: 1,
    verseStart: 1,
    verseEnd: 18,
    start: 173,
    end: 502,
  },
  {
    id: "1-samuel-1-19-28",
    reference: "1 Samuel 1:19-28",
    chapter: 1,
    verseStart: 19,
    verseEnd: 28,
    start: 503,
    end: 798,
  },
  {
    id: "1-samuel-2-1-10",
    reference: "1 Samuel 2:1-10",
    chapter: 2,
    verseStart: 1,
    verseEnd: 10,
    start: 799,
    end: 1107,
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
  id: `w-g-blaikie-${id}-reviewed`,
  reference,
  book: "1 Samuel",
  chapter,
  verse_start: verseStart,
  verse_end: verseEnd,
  author: "W. G. Blaikie",
  resource_title: "The Expositor's Bible: The First Book of Samuel",
  source_title: "The Expositor's Bible: The First Book of Samuel",
  source_url: sourceUrl,
  public_domain_status: "Verified public domain",
  rights_basis: `Verified public-domain 1888 edition reviewed from Project Gutenberg: ${sourceUrl}.`,
  recommended_use:
    "Use as a pastoral and homiletical comparison voice after reading the KJV text; compare conclusions with Scripture and the other public-domain commentaries.",
  entry_text: cleanSourceText(sourceLines.slice(start - 1, end)),
  review_status: "Verified",
  import_status: "Public Verified",
  review_batch: "1 Samuel Commentary Depth Starter",
  review_notes: `Source lines ${start}-${end} cover ${reference}. Project Gutenberg emphasis markers and OCR whitespace were cleaned; source wording was otherwise preserved.`,
}));

if (rows.some((row) => !row.entry_text || row.entry_text.length < 1_000)) {
  throw new Error("One or more Blaikie 1 Samuel entries are unexpectedly short.");
}

await writeFile(outputPath, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} verified W. G. Blaikie 1 Samuel essays to ${outputPath}.`);
