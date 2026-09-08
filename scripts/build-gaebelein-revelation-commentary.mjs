#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/the-revelation-an-analysis-and-exposition-of-the-last-book-of-the-bible-arno-c-gaebelein.txt";
const outputPath = "data/imports/a-c-gaebelein-reviewed-revelation-commentary.json";
const sourceUrl = "https://archive.org/download/revelationanalys0000arno/revelationanalys0000arno_djvu.txt";
const resourceTitle = "The Revelation: An Analysis and Exposition";
const expectedSourceChecksum = "4a7b1884bfaeee1e742306d89d0cba3a8154b615096b6fd64fca3f281913358a";
const verseEnds = [20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19, 17, 18, 20, 8, 21, 18, 24, 21, 15, 27, 21];
const chapterMarkers = [
  "Chapter I \n\n\n1. The Book:",
  "Chapters II and III",
  "Chapter III \n",
  "Chapter IV. The Open Door and the Vision of the",
  "Chapter V. J. Who 1s worthy to Open the Book?",
  "Chapter VI. 1. The First Seal. The White Horse:",
  "Chapter VII. \n",
  "Chapter VIII. The Seventh Seal. Verses 1-5.",
  "Chapter IX. 5. The Fifth Trumpet. Verses 1-12.",
  "Chapter X. 1. The Descending Angel. Verses 1-7.",
  "Chapter XI. 3. The Temple, Altar and Jewish",
  "Chapter XII. 2. The Woman With Child. Verses",
  "Chapter XIII. The Beast Out of the Sea. Verses",
  "Chapter XIV. \n",
  "Chapter XV. 1. The Seven Angels with the Seven",
  "Chapter XVI. 4. The First Vial. Verses 1-2.",
  "Chapter XVII. /. The Description of the Woman.",
  "Chapter XVIII. 4. The Angelic Announcement.",
  "Chapter XIX. 1. The Four Hallelujah’s in Heaven.",
  "Chapter XX. 4. The Binding of Satan. Verses 1-3.",
  "Chapter XXI. 4. The Eternal State. Verses 1-8.",
  "Chapter XXII. The River and the Tree of Life.",
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
        if (/^\d+\s+THE REVELATION$/i.test(line)) return false;
        if (/^THE REVELATION\s+\d+$/i.test(line)) return false;
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
  throw new Error(`Unexpected Gaebelein Revelation source checksum: ${sourceChecksum}`);
}

let searchFrom = 0;
const starts = chapterMarkers.map((marker, index) => {
  const start = source.indexOf(marker, searchFrom);
  if (start < 0) throw new Error(`Could not locate Revelation ${index + 1} marker: ${marker}`);
  searchFrom = start + marker.length;
  return start;
});
if (starts.some((start, index) => index > 0 && start <= starts[index - 1])) {
  throw new Error("Revelation chapter markers are not in canonical order.");
}

const bookEnd = source.indexOf("\nAPPENDIX I.", starts[21]);
if (bookEnd < 0) throw new Error("Could not locate the end of the Revelation exposition.");

const entries = starts.map((start, index) => {
  const chapter = index + 1;
  const end = starts[index + 1] ?? bookEnd;
  const entryText = cleanOcr(source.slice(start, end)).replace(/^Chapter(?:s)?[^\n]*/, `CHAPTER ${chapter}.`);
  if (entryText.length < 1_500) {
    throw new Error(`Revelation ${chapter} commentary is unexpectedly short (${entryText.length} characters).`);
  }

  return {
    id: `a-c-gaebelein-revelation-${chapter}-reviewed-1915`,
    reference: `Revelation ${chapter}`,
    book: "Revelation",
    chapter,
    verse_start: 1,
    verse_end: verseEnds[index],
    author: "Arno C. Gaebelein",
    resource_title: resourceTitle,
    source_title: "The Revelation: An Analysis and Exposition of the Last Book of the Bible (1915)",
    source_url: sourceUrl,
    public_domain_status: "Verified public domain in the United States",
    rights_basis: `Published in 1915 and public domain in the United States. Verified source SHA-256: ${sourceChecksum}.`,
    recommended_use: "Read after the KJV chapter for dispensational exposition of Jesus Christ's revelation, the seven churches, worship, judgment, victory, the coming kingdom, and new creation. Keep the KJV text primary and compare every conclusion with Scripture.",
    entry_text: entryText,
    review_status: "Verified",
    import_status: "Public Verified",
    review_batch: "Arno C. Gaebelein Revelation Complete Chapter Integration",
    review_notes: "All twenty-two chapters were segmented from the book's printed exposition headings. Line-wrap hyphenation, spacing, running titles, and isolated page numbers were cleaned without modernizing the author's wording. Appendices and advertising matter are excluded. Spot-check the scan before public quotation.",
  };
});

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
console.log(`Arno C. Gaebelein Revelation commentary written to ${outputPath}.`);
console.table(entries.map((entry) => ({ reference: entry.reference, characters: entry.entry_text.length })));
console.log(`Total characters: ${entries.reduce((sum, entry) => sum + entry.entry_text.length, 0)}`);
