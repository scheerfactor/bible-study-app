#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/the-expositor-s-bible-the-book-of-deuteronomy-andrew-harper.txt";
const outputPath = "data/imports/andrew-harper-reviewed-deuteronomy-starter-commentary.json";
const sourceUrl = "https://www.gutenberg.org/ebooks/49045";

const passageRanges = [
  {
    id: "deuteronomy-1-3",
    reference: "Deuteronomy 1-3",
    chapter: 1,
    verseStart: 1,
    verseEnd: 46,
    start: 1657,
    end: 2022,
  },
  {
    id: "deuteronomy-5-22-33",
    reference: "Deuteronomy 5:22-33",
    chapter: 5,
    verseStart: 22,
    verseEnd: 33,
    start: 3404,
    end: 3685,
  },
  {
    id: "deuteronomy-6-4-5",
    reference: "Deuteronomy 6:4-5",
    chapter: 6,
    verseStart: 4,
    verseEnd: 5,
    start: 3686,
    end: 4611,
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
  id: `andrew-harper-${id}-reviewed`,
  reference,
  book: "Deuteronomy",
  chapter,
  verse_start: verseStart,
  verse_end: verseEnd,
  author: "Andrew Harper",
  resource_title: "The Expositor's Bible: The Book of Deuteronomy",
  source_title: "The Expositor's Bible: The Book of Deuteronomy",
  source_url: sourceUrl,
  public_domain_status: "Verified public domain",
  rights_basis: `Verified public-domain 1895 edition reviewed from Project Gutenberg: ${sourceUrl}.`,
  recommended_use:
    "Use as a historical and expository comparison voice after reading the KJV text; evaluate critical conclusions by Scripture and compare them with the other public-domain commentaries.",
  entry_text: cleanSourceText(sourceLines.slice(start - 1, end)),
  review_status: "Verified",
  import_status: "Public Verified",
  review_batch: "Deuteronomy Commentary Depth Starter",
  review_notes: `Source lines ${start}-${end} cover ${reference}. Project Gutenberg emphasis markers and OCR whitespace were cleaned; source wording was otherwise preserved.`,
}));

if (rows.some((row) => !row.entry_text || row.entry_text.length < 1_000)) {
  throw new Error("One or more Harper Deuteronomy entries are unexpectedly short.");
}

await writeFile(outputPath, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} verified Andrew Harper Deuteronomy essays to ${outputPath}.`);
