#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const outputPath = "data/imports/j-c-ryle-reviewed-luke-commentary.json";
const resourceTitle = "Expository Thoughts on the Gospels: St. Luke";
const sources = [
  {
    path: "data/library/verified/expository-thoughts-on-the-gospels-with-the-text-complete-john-charles-ryle.txt",
    checksum: "f775c20d185318928ace56158875ba69c835da94c6f54063aa018e6fceb13c60",
    url: "https://archive.org/details/expositorythoug06rylegoog",
    title: "Expository Thoughts on the Gospels: St. Luke, Volume I (1858)",
    rights: "1858 William Hunt edition from Internet Archive item expositorythoug06rylegoog",
    endPattern: /^END OF VOL\. I\.\s*$/m,
    chapters: [
      { chapter: 1, verseEnd: 80, startPattern: /^LUKE I\. 1—4\.\s*$/m },
      { chapter: 2, verseEnd: 52, startPattern: /^LTTKE n\. 1—7\.\s*$/m },
      { chapter: 3, verseEnd: 38, startPattern: /^LUKE m\. 1—6\.\s*$/m },
      { chapter: 4, verseEnd: 44, startPattern: /^LUKE IV\. 1—13\.\s*$/m },
      { chapter: 5, verseEnd: 39, startPattern: /^LUKE V\. 1—11\.\s*$/m },
      { chapter: 6, verseEnd: 49, startPattern: /^LUKE YI\. 1—6\.\s*$/m },
      { chapter: 7, verseEnd: 50, startPattern: /^LUKE VII\. 1—10\.\s*$/m },
      { chapter: 8, verseEnd: 56, startPattern: /^LUKE Vm\. 1—8\.\s*$/m },
      { chapter: 9, verseEnd: 62, startPattern: /^LUKE IX\. 1—6\.\s*$/m },
      { chapter: 10, verseEnd: 42, startPattern: /^LUKE X\. 1—7\.\s*$/m },
    ],
  },
  {
    path: "data/library/verified/saint-luke-ryle-j-c-john-charles-1816-1900.txt",
    checksum: "8468305039bbf23698ef90ace376d439552878a04d44bbf34aa2e7a744d88a69",
    url: "https://archive.org/details/saintluke0002ryle",
    title: "Expository Thoughts on the Gospels: St. Luke, Volume II (1862)",
    rights: "1862 Robert Carter & Brothers edition from Internet Archive item saintluke0002ryle",
    endPattern: /^In leaving the Gospel of St\. Luke,/m,
    chapters: [
      { chapter: 11, verseEnd: 54, startPattern: /^LUKE XI\. 1-4\.\s*$/m },
      { chapter: 12, verseEnd: 59, startPattern: /^LUKE XII\. 1-7\.\s*$/m },
      { chapter: 13, verseEnd: 35, startPattern: /^- LUKE XIII\. 1—5\.\s*$/m },
      { chapter: 14, verseEnd: 35, startPattern: /^LUKE XIV\. 1—6\.\s*$/m },
      { chapter: 15, verseEnd: 32, startPattern: /^LUKE XV\. 1—10\.\s*$/m },
      { chapter: 16, verseEnd: 31, startPattern: /^LUKE XVI\. 1—12\.\s*$/m },
      { chapter: 17, verseEnd: 37, startPattern: /^LUKE XVII\. 1—4\.\s*$/m },
      { chapter: 18, verseEnd: 43, startPattern: /^LUKE XVIII\. 1—8\.\s*$/m },
      { chapter: 19, verseEnd: 48, startPattern: /^LUKE XIX\. 1—10\.\s*$/m },
      { chapter: 20, verseEnd: 47, startPattern: /^LUKE XX\. 1—8\.\s*$/m },
      { chapter: 21, verseEnd: 38, startPattern: /^1 And he looked up, and saw the \|/m },
      { chapter: 22, verseEnd: 71, startPattern: /^LUKE XXII\. 1—13\.\s*$/m },
      { chapter: 23, verseEnd: 56, startPattern: /^LUXE XXIII\. 1—12\.\s*$/m },
      { chapter: 24, verseEnd: 53, startPattern: /^LUKE XXIV\. 1—12\.\s*$/m },
    ],
  },
];

function cleanOcrChapter(text) {
  const paragraphs = text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph
      .split("\n")
      .map((line) => line.trim().replace(/\s{2,}/g, " "))
      .filter((line) => {
        if (!line) return false;
        if (/^\d+$/.test(line)) return false;
        if (/^L[UTX][A-Z]*[,.]?\s+CHAP[.,]?\s+/i.test(line)) return false;
        if (/^\S+\s+EXPOSITOR(?:Y|'S)\s+THOUGHTS[,.]?$/i.test(line)) return false;
        if (/^EXPOSITOR(?:Y|'S)\s+THOUGHTS[,.]?\s+\S+$/i.test(line)) return false;
        return true;
      })
      .join(" ")
      .trim())
    .filter(Boolean);

  return paragraphs.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

const entries = [];

for (const sourceDefinition of sources) {
  const source = await readFile(sourceDefinition.path, "utf8");
  const checksum = createHash("sha256").update(source).digest("hex");

  if (checksum !== sourceDefinition.checksum) {
    throw new Error(`Verified Ryle source checksum changed: expected ${sourceDefinition.checksum}, received ${checksum}.`);
  }

  const endMarker = sourceDefinition.endPattern.exec(source);
  if (!endMarker) throw new Error(`Could not find the end of ${sourceDefinition.title}.`);

  const chapterStarts = sourceDefinition.chapters.map(({ chapter, startPattern }) => {
    const match = startPattern.exec(source);
    if (!match) throw new Error(`Could not find the first Luke ${chapter} passage heading.`);
    return match.index;
  });

  for (const [index, chapterDefinition] of sourceDefinition.chapters.entries()) {
    const start = chapterStarts[index];
    const end = chapterStarts[index + 1] ?? endMarker.index;
    const entryText = cleanOcrChapter(source.slice(start, end));

    if (entryText.length < 10_000) {
      throw new Error(`Luke ${chapterDefinition.chapter} commentary is unexpectedly short (${entryText.length} characters).`);
    }

    entries.push({
      id: `j-c-ryle-luke-${chapterDefinition.chapter}-reviewed`,
      reference: `Luke ${chapterDefinition.chapter}`,
      book: "Luke",
      chapter: chapterDefinition.chapter,
      verse_start: 1,
      verse_end: chapterDefinition.verseEnd,
      author: "J. C. Ryle",
      resource_title: resourceTitle,
      source_title: sourceDefinition.title,
      source_url: sourceDefinition.url,
      public_domain_status: "Verified public domain",
      rights_basis: `${sourceDefinition.rights}. Verified source SHA-256: ${sourceDefinition.checksum}.`,
      recommended_use: "Read after the KJV text as an evangelical Anglican exposition. Compare doctrine with Scripture, and spot-check the scanned page before using an OCR quotation in print or presentation slides.",
      entry_text: entryText,
      review_status: "Verified",
      import_status: "Public Verified",
      review_batch: "J. C. Ryle Luke Commentary Phase 1",
      review_notes: "Chapter boundary verified against the volume's printed Luke passage sequence. Historical OCR was cleaned only for spacing and recurring page headers; wording was not modernized. OCR defects may remain.",
    });
  }
}

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");

console.log(`Ryle commentary written to ${outputPath}.`);
console.log(`Chapters: ${entries.length} (Luke 1-24)`);
console.log(`Characters: ${entries.reduce((sum, entry) => sum + entry.entry_text.length, 0)}`);
