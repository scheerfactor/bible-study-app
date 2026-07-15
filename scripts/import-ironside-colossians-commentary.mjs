#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const sourcePath =
  "data/library/verified/lectures-on-the-epistle-to-the-colossians-ironside-h-a-henry-allan-1876-1951.txt";
const outputPath = "data/imports/h-a-ironside-reviewed-colossians-commentary.json";
const sourceUrl =
  "https://archive.org/download/lecturesonepistl0000iron/lecturesonepistl0000iron_djvu.txt";
const companionEditionUrl =
  "https://archive.org/download/lecturesonepistl0000hiro/lecturesonepistl0000hiro_djvu.txt";
const resourceTitle = "Lectures on the Epistle to the Colossians";

const romanLectures = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
  "XIV",
  "XV",
  "XVI",
];

const chapterVerseCounts = { 1: 29, 2: 23, 3: 25, 4: 18 };

function cleanParagraphs(text) {
  const pageHeaderPatterns = [
    /^\d+\s+Lectures on Colossians$/i,
    /^(?:General Considerations and Analysis|The Salutation and Introduction|Paul['’]s Prayer and Thanksgiving|Christ the Firstborn|Paul['’]s Twofold Ministry|Christ the True Wisdom.*|Christ the Antidote.*|Christ the Believer['’]s Life and Object|Practical Holiness.*|The Earthly Relationships of the New Man|Concluding Exhortations|Closing Salutations)\s+\d+$/i,
    /^School of Theology$/i,
    /^at Claremont$/i,
    /^\d{1,3}$/,
    /^[|{}]+$/,
  ];

  return text
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph
        .split("\n")
        .map((line) => line.trim().replace(/\s*\|\s*/g, " ").trim())
        .filter((line) => line && !pageHeaderPatterns.some((pattern) => pattern.test(line)))
        .reduce((joined, line) => {
          if (!joined) return line;
          if (joined.endsWith("-") && /^[a-z]/.test(line)) return `${joined.slice(0, -1)}${line}`;
          return `${joined} ${line}`;
        }, ""),
    )
    .filter(Boolean)
    .map((paragraph) => paragraph.replace("If T set at nought", "If I set at nought"));
}

function lectureSections(source) {
  const bodyStart = source.indexOf("LECTURES ON COLOSSIANS");
  if (bodyStart < 0) throw new Error("Could not find the commentary body.");

  const body = source.slice(bodyStart);
  const markers = romanLectures.map((roman) => {
    const pattern = new RegExp(`^LECTURE ${roman}\\s*$`, "m");
    const match = pattern.exec(body);
    if (!match) throw new Error(`Could not find LECTURE ${roman}.`);
    return { roman, index: match.index };
  });

  const backMatterIndex = body.indexOf("The Complete Writings of H. A. IRONSIDE");
  if (backMatterIndex < 0) throw new Error("Could not find the back-matter boundary.");

  return Object.fromEntries(
    markers.map((marker, index) => {
      const end = markers[index + 1]?.index ?? backMatterIndex;
      return [marker.roman, cleanParagraphs(body.slice(marker.index, end))];
    }),
  );
}

function joinSections(...sections) {
  return sections.flat().join("\n\n").trim();
}

function entryFor(chapter, entryText) {
  return {
    id: `h-a-ironside-colossians-${chapter}-reviewed-1929`,
    reference: `Colossians ${chapter}`,
    book: "Colossians",
    chapter,
    verse_start: 1,
    verse_end: chapterVerseCounts[chapter],
    author: "H. A. Ironside",
    resource_title: resourceTitle,
    source_title: `${resourceTitle} (First Edition, 1929)`,
    source_url: sourceUrl,
    public_domain_status:
      "Verified public domain in the United States. The companion scan identifies the work as the first edition, January 1929.",
    rights_basis: `H. A. Ironside's first edition was published in January 1929 and is public domain in the United States. Commentary wording is drawn from the Internet Archive OCR at ${sourceUrl}; first-edition evidence was cross-checked against ${companionEditionUrl}. Modern edited editions were not used.`,
    recommended_use:
      "Use as a dispensational, expository, and preaching-oriented comparison after reading the KJV text and reviewed cross references. Spot-check the page scan before using a quotation in print.",
    entry_text: entryText,
    review_status: "Verified",
    import_status: "Public Verified",
    review_batch: "Ironside Colossians 1929 Chapter Integration",
    review_notes:
      "All sixteen printed lecture headings and passage ranges were checked. Line-wrap hyphenation, page headers, and scan stamps were removed without rewriting the author's wording. Lecture XIV was split at the author's explicit discussion of the chapter 4 boundary so Colossians 3:18-25 and 4:1 remain discoverable without repeating the full lecture.",
  };
}

const source = await readFile(sourcePath, "utf8");
const lectures = lectureSections(source);
const lectureFourteenTransition = lectures.XIV.findIndex((paragraph) =>
  paragraph.startsWith("It is unfortunate that the chapter break comes just where it does."),
);

if (lectureFourteenTransition < 4) {
  throw new Error("Could not verify the Colossians 3/4 transition in LECTURE XIV.");
}

const lectureFourteenHeading = lectures.XIV.slice(0, 2);
const lectureFourteenChapterThree = lectures.XIV.slice(0, lectureFourteenTransition);
const lectureFourteenChapterFour = [
  ...lectureFourteenHeading,
  ...lectures.XIV.slice(lectureFourteenTransition),
];

const entries = [
  entryFor(1, joinSections(lectures.I, lectures.II, lectures.III, lectures.IV, lectures.V)),
  entryFor(2, joinSections(lectures.VI, lectures.VII, lectures.VIII, lectures.IX, lectures.X)),
  entryFor(3, joinSections(lectures.XI, lectures.XII, lectures.XIII, lectureFourteenChapterThree)),
  entryFor(4, joinSections(lectureFourteenChapterFour, lectures.XV, lectures.XVI)),
];

for (const entry of entries) {
  if (entry.entry_text.length < 5_000) {
    throw new Error(`${entry.reference} is unexpectedly short (${entry.entry_text.length} characters).`);
  }
}

await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");

console.log(`Wrote ${entries.length} verified chapter entries to ${outputPath}.`);
console.table(
  entries.map((entry) => ({
    reference: entry.reference,
    characters: entry.entry_text.length,
    words: entry.entry_text.split(/\s+/).length,
  })),
);
