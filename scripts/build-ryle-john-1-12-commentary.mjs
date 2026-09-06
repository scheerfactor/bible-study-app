#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const outputPath = "data/imports/j-c-ryle-reviewed-john-1-12-commentary.json";
const resourceTitle = "Expository Thoughts on the Gospels: St. John, Volumes I-II";
const sources = [
  {
    path: "data/library/verified/expository-thoughts-on-the-gospels-for-family-and-private-use-with-the-text-complete-john-charles-ryle.txt",
    checksum: "012235ca32caa79e48386f9dfae84f7efd746ca84e10848b232b235f6d0df740",
    url: "https://archive.org/details/expositorythoug02rylegoog",
    title: "Expository Thoughts on the Gospels: St. John, Volume I (1879)",
    rights: "1879 Robert Carter & Brothers edition from Internet Archive item expositorythoug02rylegoog",
    endPattern: null,
    chapters: [
      { chapter: 1, verseEnd: 51, startPattern: /^JOHN L 1—5\.\s*$/m },
      { chapter: 2, verseEnd: 25, startPattern: /^JOHN n\. 1\.— II\.\s*$/m },
      { chapter: 3, verseEnd: 36, startPattern: /^JOHN m\. 1—8\.\s*$/m },
      { chapter: 4, verseEnd: 54, startPattern: /^JOHN IV\. 1—6\.\s*$/m },
      { chapter: 5, verseEnd: 47, startPattern: /^JOHN T\. 1—15\.\s*$/m },
      { chapter: 6, verseEnd: 71, startPattern: /^JOHN VL 1—14\.\s*$/m },
    ],
  },
  {
    path: "data/library/verified/expository-thoughts-on-the-gospels-for-family-and-private-use-with-the-text-complete-j-c-ryle.txt",
    checksum: "0b0adbb27b46a1c187099d329afe426a35d501dda0f2326d64e0112c976e3edd",
    url: "https://archive.org/details/expositorythough06ryle",
    title: "Expository Thoughts on the Gospels: St. John, Volume II (1878)",
    rights: "1878 Robert Carter & Brothers edition from Internet Archive item expositorythough06ryle",
    endPattern: /^END\s+OF\s+VOL\.\s+H\.\s*$/m,
    chapters: [
      { chapter: 7, verseEnd: 53, startPattern: /^JOHN\s+VII\.\s+1—13\.\s*$/m },
      { chapter: 8, verseEnd: 59, startPattern: /^JOHN\s+VIII\.\s+1—11\.\s*$/m },
      { chapter: 9, verseEnd: 41, startPattern: /^JOHN\s+IX\.\s+1—12\.\s*$/m },
      { chapter: 10, verseEnd: 42, startPattern: /^JOHN\s+X\.\s+1—9\.\s*$/m },
      { chapter: 11, verseEnd: 57, startPattern: /^JOHN\s+XI\.\s+1—6\.\s*$/m },
      { chapter: 12, verseEnd: 50, startPattern: /^JOHN\s+XII\.\s+1—11\.\s*$/m },
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
        if (/^JOHN,?\s+CHAP[.,]?\s+/i.test(line)) return false;
        if (/^\S+\s+EXPOSITO(?:RY|E)\s+THOUGHTS[,.]?$/i.test(line)) return false;
        if (/^EXPOSITO(?:RY|E)\s+THOUGHTS[,.]?\s+\S+$/i.test(line)) return false;
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

  const endMarker = sourceDefinition.endPattern?.exec(source);
  if (sourceDefinition.endPattern && !endMarker) {
    throw new Error(`Could not find the end of ${sourceDefinition.title}.`);
  }

  const chapterStarts = sourceDefinition.chapters.map(({ chapter, startPattern }) => {
    const match = startPattern.exec(source);
    if (!match) throw new Error(`Could not find the first John ${chapter} passage heading.`);
    return match.index;
  });

  for (const [index, chapterDefinition] of sourceDefinition.chapters.entries()) {
    const start = chapterStarts[index];
    const end = chapterStarts[index + 1] ?? endMarker?.index ?? source.length;
    const entryText = cleanOcrChapter(source.slice(start, end));

    if (entryText.length < 10_000) {
      throw new Error(`John ${chapterDefinition.chapter} commentary is unexpectedly short (${entryText.length} characters).`);
    }

    entries.push({
      id: `j-c-ryle-john-${chapterDefinition.chapter}-reviewed`,
      reference: `John ${chapterDefinition.chapter}`,
      book: "John",
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
      review_batch: "J. C. Ryle John 1-12 Commentary Phase 1",
      review_notes: "Chapter boundary verified against the volume's printed John passage sequence. Historical OCR was cleaned only for spacing and recurring page headers; wording was not modernized. OCR defects may remain.",
    });
  }
}

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");

console.log(`Ryle commentary written to ${outputPath}.`);
console.log(`Chapters: ${entries.length} (John 1-12)`);
console.log(`Characters: ${entries.reduce((sum, entry) => sum + entry.entry_text.length, 0)}`);
