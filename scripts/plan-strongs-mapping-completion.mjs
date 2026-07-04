#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import verses1769 from "es-kjv/json/verses-1769.js";

const outJsonPath = "data/strongs/reports/strongs-mapping-completion-plan.json";
const outMdPath = "STRONGS_MAPPING_COMPLETION_PLAN.md";
const mappingDir = "data/strongs/mapping-batches";
const shardDir = "data/strongs/mappings-by-chapter";

const bookOrder = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Solomon's Song", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation",
];

const priorityGroups = [
  {
    name: "Teaching focus books",
    books: ["Amos", "Hosea", "Romans", "John", "Daniel", "Revelation", "Isaiah", "Genesis", "Exodus", "Psalms"],
  },
  {
    name: "Pentateuch completion",
    books: ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy"],
  },
  {
    name: "Historical books",
    books: ["Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther"],
  },
  {
    name: "Wisdom books",
    books: ["Job", "Psalms", "Proverbs", "Ecclesiastes", "Solomon's Song"],
  },
  {
    name: "Prophets",
    books: ["Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi"],
  },
  {
    name: "New Testament remaining checks",
    books: ["Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"],
  },
];

function parseReference(reference) {
  const match = String(reference ?? "").trim().match(/^(.+) (\d+):(\d+)$/);
  if (!match) return null;
  return {
    book: match[1],
    chapter: Number(match[2]),
    verse: Number(match[3]),
  };
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 1000) / 10;
}

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function jsonFiles(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => path.join(directory, entry.name))
      .sort();
  } catch {
    return [];
  }
}

const chaptersByBook = new Map();
for (const ref of Object.keys(verses1769)) {
  const parsed = parseReference(ref);
  if (!parsed) continue;
  if (!chaptersByBook.has(parsed.book)) chaptersByBook.set(parsed.book, new Set());
  chaptersByBook.get(parsed.book).add(parsed.chapter);
}

const coverageByBook = new Map(
  bookOrder.map((book) => [
    book,
    {
      book,
      totalChapters: chaptersByBook.get(book)?.size ?? 0,
      mappedChapters: new Set(),
      mappedVerses: new Set(),
      rows: 0,
      sourceFiles: new Set(),
    },
  ]),
);

const mappingFiles = await jsonFiles(mappingDir);
let mappingRows = 0;
let verifiedRows = 0;
let skippedRows = 0;

for (const file of mappingFiles) {
  const rows = await readJson(file, []);
  if (!Array.isArray(rows)) continue;
  mappingRows += rows.length;

  for (const row of rows) {
    if (row.review_status !== "Verified") {
      skippedRows += 1;
      continue;
    }
    const parsed = parseReference(row.verse_ref);
    if (!parsed || !coverageByBook.has(parsed.book)) {
      skippedRows += 1;
      continue;
    }
    verifiedRows += 1;
    const bucket = coverageByBook.get(parsed.book);
    bucket.mappedChapters.add(parsed.chapter);
    bucket.mappedVerses.add(`${parsed.book} ${parsed.chapter}:${parsed.verse}`);
    bucket.rows += 1;
    bucket.sourceFiles.add(path.relative(process.cwd(), file));
  }
}

const shardManifest = await readJson(path.join(shardDir, "manifest.json"), { chapters: 0, rows: 0, files: [] });
const totalChapters = [...chaptersByBook.values()].reduce((sum, chapters) => sum + chapters.size, 0);
const bookCoverage = bookOrder.map((book) => {
  const bucket = coverageByBook.get(book);
  const missingChapters = [...(chaptersByBook.get(book) ?? [])]
    .filter((chapter) => !bucket.mappedChapters.has(chapter))
    .sort((a, b) => a - b);
  return {
    book,
    totalChapters: bucket.totalChapters,
    mappedChapters: bucket.mappedChapters.size,
    missingChapters,
    mappedVerses: bucket.mappedVerses.size,
    rows: bucket.rows,
    chapterCoveragePercent: percent(bucket.mappedChapters.size, bucket.totalChapters),
    sourceFiles: [...bucket.sourceFiles].sort(),
  };
});

const mappedChapters = bookCoverage.reduce((sum, book) => sum + book.mappedChapters, 0);
const completeBooks = bookCoverage.filter((book) => book.totalChapters > 0 && book.mappedChapters === book.totalChapters);
const weakestBooks = bookCoverage
  .filter((book) => book.totalChapters > 0 && book.missingChapters.length)
  .sort((a, b) => a.chapterCoveragePercent - b.chapterCoveragePercent || b.totalChapters - a.totalChapters || a.book.localeCompare(b.book));

const phases = priorityGroups.map((group) => {
  const books = group.books
    .map((bookName) => bookCoverage.find((book) => book.book === bookName))
    .filter(Boolean)
    .filter((book) => book.missingChapters.length)
    .sort((a, b) => a.chapterCoveragePercent - b.chapterCoveragePercent || b.missingChapters.length - a.missingChapters.length);

  return {
    name: group.name,
    missingChapters: books.reduce((sum, book) => sum + book.missingChapters.length, 0),
    books: books.map((book) => ({
      book: book.book,
      mappedChapters: book.mappedChapters,
      totalChapters: book.totalChapters,
      missingChapters: book.missingChapters,
      chapterCoveragePercent: book.chapterCoveragePercent,
    })),
  };
});

const nextRecommendedBooks = weakestBooks.slice(0, 12).map((book) => ({
  book: book.book,
  missingChapters: book.missingChapters,
  reason:
    book.chapterCoveragePercent === 0
      ? "No reviewed Strong's mapping chapters yet."
      : `Only ${book.chapterCoveragePercent}% of chapters have reviewed Strong's mappings.`,
}));

const summary = {
  generated_at: new Date().toISOString(),
  bibleChapters: totalChapters,
  mappingBatchFiles: mappingFiles.length,
  mappingRows,
  verifiedRows,
  skippedRows,
  mappedChapters,
  missingChapters: totalChapters - mappedChapters,
  chapterCoveragePercent: percent(mappedChapters, totalChapters),
  completeBooks: completeBooks.length,
  incompleteBooks: weakestBooks.length,
  shardManifest: {
    chapters: shardManifest.chapters ?? 0,
    rows: shardManifest.rows ?? 0,
    sourceBatchFiles: shardManifest.source_batch_files ?? null,
  },
  nextRecommendedBooks,
};

const md = [
  "# Strong's Mapping Completion Plan",
  "",
  `Generated: ${summary.generated_at}`,
  "",
  "This plan tracks the reviewed KJV-to-Strong's word mapping gap. The lexicons are broad, but a Bible reader only feels complete when each chapter has clean word-level mapping attached to the KJV text.",
  "",
  "## Current State",
  "",
  `- Reviewed mapping batch files: ${summary.mappingBatchFiles}`,
  `- Reviewed mapping rows: ${summary.verifiedRows.toLocaleString()}`,
  `- Chapter coverage: ${summary.mappedChapters}/${summary.bibleChapters} chapters (${summary.chapterCoveragePercent}%).`,
  `- Complete Bible books: ${summary.completeBooks}/${bookOrder.length}.`,
  `- Generated chapter shards: ${summary.shardManifest.chapters} chapters, ${Number(summary.shardManifest.rows ?? 0).toLocaleString()} rows.`,
  "",
  "## Recommended Next Books",
  "",
  "| Book | Missing Chapters | Reason |",
  "| --- | ---: | --- |",
  ...nextRecommendedBooks.map((item) => `| ${item.book} | ${item.missingChapters.length} | ${item.reason} |`),
  "",
  "## Completion Phases",
  "",
  ...phases.flatMap((phase) => [
    `### ${phase.name}`,
    "",
    phase.books.length
      ? `Missing chapters in this phase: ${phase.missingChapters}`
      : "All chapters in this phase have reviewed Strong's mappings.",
    "",
    ...(phase.books.length
      ? [
          "| Book | Mapped | Total | Missing Chapters | Coverage |",
          "| --- | ---: | ---: | --- | ---: |",
          ...phase.books.map(
            (book) =>
              `| ${book.book} | ${book.mappedChapters} | ${book.totalChapters} | ${book.missingChapters.join(", ")} | ${book.chapterCoveragePercent}% |`,
          ),
          "",
        ]
      : []),
  ]),
  "## Safety Rules",
  "",
  "- Continue importing Strong's mapping by reviewed book/chapter batches, not by unreviewed whole-Bible dumps.",
  "- Keep source URL, rights status, rights basis, and review status on every mapping row.",
  "- Validate every batch against the KJV token positions before it becomes public.",
  "- Use generated per-chapter shards in the app; do not load one giant Strong's mapping file into the reader.",
  "- If full Bible mapping grows beyond the deployment bundle comfortably, move the chapter shards to R2 and keep the app fetching one chapter at a time.",
  "",
].join("\n");

await mkdir(path.dirname(outJsonPath), { recursive: true });
await writeFile(outJsonPath, `${JSON.stringify({ summary, bookCoverage, phases }, null, 2)}\n`, "utf8");
await writeFile(outMdPath, `${md}\n`, "utf8");

console.log("Strong's mapping completion plan complete");
console.table({
  mapped_chapters: `${summary.mappedChapters}/${summary.bibleChapters}`,
  coverage: `${summary.chapterCoveragePercent}%`,
  complete_books: `${summary.completeBooks}/${bookOrder.length}`,
  next_books: nextRecommendedBooks.map((item) => item.book).join(", "),
});
