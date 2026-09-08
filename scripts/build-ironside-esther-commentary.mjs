#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/notes-on-the-book-of-esther-h-a-ironside.txt";
const outputPath = "data/imports/h-a-ironside-reviewed-esther-commentary.json";
const sourceUrl = "https://archive.org/download/notesonbookofest0000iron/notesonbookofest0000iron_djvu.txt";
const resourceTitle = "Notes on the Book of Esther";
const expectedSourceChecksum = "706791fb35e185955959975f2b99c34439c036ccdb81300573c5a217e6addd68";
const verseEnds = [22, 23, 15, 17, 14, 14, 10, 17, 32, 3];
const sectionTitles = [
  "THE ROYAL FEAST, AND DIVORCE OF VASHTI.",
  "THE CHOICE OF ESTHER AND THE TREASON",
  "THE WRATH OF THE AMALEKITE, AND THE",
  "IN SACKCLOTH AND ASHES",
  "THE SCEPTRE OF GRACE, THE BANQUET, AND",
  "A SLEEPLESS NIGHT, AND ITS RESULTS",
  "THE SECOND BANQUET AND THE AMALEKITE’S",
  "THE DESPISED MAN EXALTED AND THE DECREE OF",
  "THE DELIVERANCE",
  "SPEAKING PEACE",
];

function cleanOcr(text) {
  return text
    .replace(/\r/g, "")
    .replace(/([A-Za-z])-[ \t]*\n[ \t]*([a-z])/g, "$1$2")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph
      .split("\n")
      .map((line) => line.trim().replace(/\s{2,}/g, " "))
      .filter((line) => {
        if (!line || /^\d+$/.test(line)) return false;
        if (/^\d+\s+NOTES ON THE BOOK OF ESTHER$/i.test(line)) return false;
        if (/^NOTES ON THE BOOK OF ESTHER\s+\S+$/i.test(line) && /\d/.test(line)) return false;
        if (line.length < 70 && /\d/.test(line) && /^(?:THE ROYAL FEAST|THE CHOICE OF ESTHER|THE WRATH OF THE AMALEKITE|IN SACKCLOTH AND ASHES|THE SCEPTRE OF GRACE|A SLEEPLESS NIGHT|THE SECOND BANQUET|THE DESPISED MAN EXALTED|THE DELIVERANCE|THE INSTITUTION OF PURIM|SPEAKING PEACE)/i.test(line)) return false;
        return true;
      })
      .join(" ")
      .trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

const source = await readFile(sourcePath, "utf8");
const sourceChecksum = createHash("sha256").update(source).digest("hex");
if (sourceChecksum !== expectedSourceChecksum) {
  throw new Error(`Unexpected Ironside Esther source checksum: ${sourceChecksum}`);
}

const contentStart = source.indexOf("__ BOOK OF ESTHER __");
if (contentStart < 0) throw new Error("Could not locate the beginning of the Esther exposition.");

const headings = sectionTitles.map((title, index) => {
  const start = source.indexOf(title, index === 0 ? contentStart : undefined);
  if (start < 0) throw new Error(`Could not locate Esther ${index + 1} section title: ${title}`);
  return { chapter: index + 1, start };
});
if (headings.some((heading, index) => index > 0 && heading.start <= headings[index - 1].start)) {
  throw new Error("Esther chapter sections are not in canonical order.");
}

const bookEnd = source.indexOf("\nBY H. A. IRONSIDE", headings[9].start);
if (bookEnd < 0) throw new Error("Could not locate the end of the Esther exposition.");

const entries = headings.map((heading, index) => {
  const chapter = heading.chapter;
  const end = headings[index + 1]?.start ?? bookEnd;
  const entryText = cleanOcr(source.slice(heading.start, end));
  if (entryText.length < 2_500) {
    throw new Error(`Esther ${chapter} commentary is unexpectedly short (${entryText.length} characters).`);
  }

  return {
    id: `h-a-ironside-esther-${chapter}-reviewed-1905`,
    reference: `Esther ${chapter}`,
    book: "Esther",
    chapter,
    verse_start: 1,
    verse_end: verseEnds[index],
    author: "H. A. Ironside",
    resource_title: resourceTitle,
    source_title: "Notes on the Book of Esther (1905; revised second edition 1921)",
    source_url: sourceUrl,
    public_domain_status: "Verified public domain in the United States",
    rights_basis: `First published in 1905; revised second edition dated 1921 and public domain in the United States. Verified source SHA-256: ${sourceChecksum}.`,
    recommended_use: "Read after the KJV chapter for practical exposition of providence, courage, intercession, spiritual conflict, reversal, deliverance, faith, and peace. Keep the KJV text primary and compare typological or prophetic conclusions carefully with Scripture.",
    entry_text: entryText,
    review_status: "Verified",
    import_status: "Public Verified",
    review_batch: "H. A. Ironside Esther Complete Chapter Integration",
    review_notes: "All ten chapters were segmented from the exposition's printed section titles; the two printed divisions of Esther 9 remain together as one chapter entry. Line-wrap hyphenation, spacing, running titles, and isolated page numbers were cleaned without modernizing the author's wording. Front matter and advertising matter are excluded. Spot-check the scan before public quotation.",
  };
});

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
console.log(`H. A. Ironside Esther commentary written to ${outputPath}.`);
console.table(entries.map((entry) => ({ reference: entry.reference, characters: entry.entry_text.length })));
console.log(`Total characters: ${entries.reduce((sum, entry) => sum + entry.entry_text.length, 0)}`);
