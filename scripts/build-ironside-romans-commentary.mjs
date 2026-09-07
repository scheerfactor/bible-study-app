#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "data/library/verified/lectures-on-the-epistle-to-the-romans-h-a-ironside.txt";
const outputPath = "data/imports/h-a-ironside-reviewed-romans-commentary.json";
const sourceUrl = "https://archive.org/details/lecturesonepistIO000hair_u7vO";
const resourceTitle = "Lectures on the Epistle to the Romans";
const expectedSourceChecksum = "79a858b1f6ec8c4ca9a18ef91c035199471f9a5d80afb63b4b37c997dc00b4a4";
const verseEnds = [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27];

function cleanOcr(text) {
  const pageHeaders = [
    /^\d+ Lectures on Romans$/i,
    /^(?:The Theme and Analysis|Salutation and Introduction|Introduction|The Need of the Gospel|The Gospel in Relation to our Sins|The Gospel in Relation to Indwelling Sin|The Triumph of Grace|The Christian’s Relation to Governments|Christian Liberty & Consideration for Others|Christ, the Believer’s Pattern|Conclusion|Salutations|The Mystery Revealed) \d+$/i,
    /^THE CINCINNATI BIBLE SEMINARY LIBRARY$/i,
    /^\d{1,3}$/,
    /^[|{}]+$/,
  ];

  return text
    .replace(/\r/g, "")
    .replace(/([A-Za-z])-[ \t]*\n[ \t]*([a-z])/g, "$1$2")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph
      .split("\n")
      .map((line) => line.trim().replace(/\s*\|\s*/g, " ").replace(/\s{2,}/g, " "))
      .filter((line) => line && !pageHeaders.some((pattern) => pattern.test(line)))
      .join(" ")
      .trim())
    .filter(Boolean)
    .join("\n\n");
}

const source = await readFile(sourcePath, "utf8");
const sourceChecksum = createHash("sha256").update(source).digest("hex");
if (sourceChecksum !== expectedSourceChecksum) {
  throw new Error(`Unexpected Romans source checksum: ${sourceChecksum}`);
}

const bodyStart = source.indexOf("LECTURES ON ROMANS");
if (bodyStart < 0) throw new Error("Could not locate the Romans commentary body.");
const body = cleanOcr(source.slice(bodyStart));

const markers = [
  "LECTURES ON ROMANS",
  "In the first sixteen verses of the next chapter",
  "In chapter 3:1-20 we have the great indictment",
  "In chapter four the apostle proceeds to show",
  "In the first eleven verses of chapter 5",
  "Chapter 6 answers this cavil",
  "The seventh chapter takes up another phase",
  "LECTURE VI",
  "LECTURE VII",
  "LECTURE VIII",
  "LECTURE Ix",
  "LECTURE X",
  "LECTURE XI",
  "In chapter 14 and the first seven verses of chapter 15",
  "He sums it all up in the first seven verses of chapter 15.",
  "Chapter 16 consists largely of salutations",
];

const starts = markers.map((marker, index) => {
  const position = body.indexOf(marker, index === 0 ? 0 : 1);
  if (position < 0) throw new Error(`Could not locate Romans ${index + 1} boundary: ${marker}`);
  return position;
});

if (starts.some((position, index) => index > 0 && position <= starts[index - 1])) {
  throw new Error("Romans chapter boundaries are not in canonical order.");
}

const finalSentence = "“To God only wise be glory through Jesus Christ for ever. Amen.”";
const finalStart = body.indexOf(finalSentence, starts[15]);
if (finalStart < 0) throw new Error("Could not locate the end of the Romans exposition.");
const bodyEnd = finalStart + finalSentence.length;

const entries = starts.map((start, index) => {
  const chapter = index + 1;
  const end = starts[index + 1] ?? bodyEnd;
  const entryText = body.slice(start, end).trim();
  if (entryText.length < 3_000) {
    throw new Error(`Romans ${chapter} commentary is unexpectedly short (${entryText.length} characters).`);
  }

  return {
    id: `h-a-ironside-romans-${chapter}-reviewed-1928`,
    reference: `Romans ${chapter}`,
    book: "Romans",
    chapter,
    verse_start: 1,
    verse_end: verseEnds[index],
    author: "H. A. Ironside",
    resource_title: resourceTitle,
    source_title: `${resourceTitle} (First Edition, 1928)`,
    source_url: sourceUrl,
    public_domain_status: "Verified public domain in the United States",
    rights_basis: `First edition published in 1928 and public domain in the United States. Verified source SHA-256: ${sourceChecksum}.`,
    recommended_use: "Read after the KJV chapter for dispensational, gospel-centered exposition of God's righteousness, justification by faith, life in Christ, Israel, and practical Christian service. Keep the KJV text primary and compare every conclusion with Scripture.",
    entry_text: entryText,
    review_status: "Verified",
    import_status: "Public Verified",
    review_batch: "H. A. Ironside Romans Complete Chapter Integration",
    review_notes: "All sixteen chapter boundaries follow the author's printed analysis and explicit transitions. Line-wrap hyphenation and recurring page headers were removed without modernizing wording. Several lectures span multiple chapters, so transition paragraphs begin the chapter they introduce. Spot-check the scan before public quotation.",
  };
});

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
console.log(`Ironside Romans commentary written to ${outputPath}.`);
console.table(entries.map((entry) => ({ reference: entry.reference, characters: entry.entry_text.length })));
console.log(`Total characters: ${entries.reduce((sum, entry) => sum + entry.entry_text.length, 0)}`);
