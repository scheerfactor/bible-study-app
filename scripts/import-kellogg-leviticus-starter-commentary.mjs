#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/the-expositor-s-bible-the-book-of-leviticus-samuel-h-kellogg.txt";
const outputPath = "data/imports/s-h-kellogg-reviewed-leviticus-starter-commentary.json";
const sourceUrl = "https://www.gutenberg.org/ebooks/42334";

const passageRanges = [
  {
    id: "leviticus-1-2-4",
    reference: "Leviticus 1:2-4",
    chapter: 1,
    verseStart: 2,
    verseEnd: 4,
    start: 1272,
    end: 1799,
  },
  {
    id: "leviticus-1-5-17-6-8-13",
    reference: "Leviticus 1:5-17; 6:8-13",
    chapter: 1,
    verseStart: 5,
    verseEnd: 17,
    start: 1800,
    end: 2282,
  },
  {
    id: "leviticus-2-1-16-6-14-23",
    reference: "Leviticus 2:1-16; 6:14-23",
    chapter: 2,
    verseStart: 1,
    verseEnd: 16,
    start: 2283,
    end: 2828,
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
  id: `s-h-kellogg-${id}-reviewed`,
  reference,
  book: "Leviticus",
  chapter,
  verse_start: verseStart,
  verse_end: verseEnd,
  author: "S. H. Kellogg",
  resource_title: "The Expositor's Bible: The Book of Leviticus",
  source_title: "The Expositor's Bible: The Book of Leviticus",
  source_url: sourceUrl,
  public_domain_status: "Verified public domain",
  rights_basis: `Verified public-domain 1906 fifth edition reviewed from Project Gutenberg: ${sourceUrl}.`,
  recommended_use:
    "Use as an expository and typological comparison voice after reading the KJV text; compare conclusions with Scripture and the other public-domain commentaries.",
  entry_text: cleanSourceText(sourceLines.slice(start - 1, end)),
  review_status: "Verified",
  import_status: "Public Verified",
  review_batch: "Leviticus Commentary Depth Starter",
  review_notes: `Source lines ${start}-${end} cover ${reference}. Project Gutenberg emphasis markers and OCR whitespace were cleaned; source wording was otherwise preserved.`,
}));

if (rows.some((row) => !row.entry_text || row.entry_text.length < 1_000)) {
  throw new Error("One or more Kellogg Leviticus entries are unexpectedly short.");
}

await writeFile(outputPath, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} verified S. H. Kellogg Leviticus essays to ${outputPath}.`);
