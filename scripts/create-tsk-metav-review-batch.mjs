#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import verses1769 from "es-kjv/json/verses-1769.js";
import { readJsonOrCsv } from "./import-utils.mjs";

const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => {
      const [key, ...valueParts] = arg.slice(2).split("=");
      return [key, valueParts.join("=") || "true"];
    }),
);

const sourceDir = path.resolve(process.cwd(), args.get("source-dir") ?? "data/sources/tsk/metav");
const outputPath = path.resolve(
  process.cwd(),
  args.get("output") ?? "data/imports/tsk-metav-reviewed-weak-books-phase-1.json",
);
const books = String(args.get("books") ?? "")
  .split("|")
  .map((book) => book.trim())
  .filter(Boolean);
const maxVersesPerBook = Math.max(1, Number(args.get("max-verses-per-book") ?? 10));
const maxRefsPerVerse = Math.max(1, Number(args.get("max-refs-per-verse") ?? 2));
const spreadByChapter = args.get("spread-by-chapter") === "true";
const avoidExisting = args.get("avoid-existing") === "true";
const existingImportsDir = path.resolve(process.cwd(), args.get("existing-imports-dir") ?? "data/imports");

if (!books.length) {
  console.error('Usage: npm run create:tsk-metav-review-batch -- --books="Leviticus|Numbers|Mark"');
  process.exit(1);
}

const sourceMetadata = {
  source: "TSK MetaV",
  source_title: "Treasury of Scripture Knowledge / MetaV CrossRefIndex reviewed batch",
  source_url: "https://github.com/theonize/KJV-bible-database-with-metadata-MetaV-/tree/master/CSV",
  public_domain_status:
    "Reviewed reference-pair batch from the TSK source tradition. MetaV distribution is CC BY-SA 3.0; preserve attribution and share-alike notes.",
  rights_basis:
    "Reference pairs only; no Bible text or commentary text imported. MetaV says CrossRefIndex is compiled from public-domain TSK tradition, but the distributed dataset carries CC BY-SA 3.0 terms.",
  review_status: "Verified",
};

const osisToBook = new Map([
  ["Gen", "Genesis"], ["Exod", "Exodus"], ["Lev", "Leviticus"], ["Num", "Numbers"],
  ["Deut", "Deuteronomy"], ["Josh", "Joshua"], ["Judg", "Judges"], ["Ruth", "Ruth"],
  ["1Sam", "1 Samuel"], ["2Sam", "2 Samuel"], ["1Kgs", "1 Kings"], ["2Kgs", "2 Kings"],
  ["1Chr", "1 Chronicles"], ["2Chr", "2 Chronicles"], ["Ezra", "Ezra"], ["Neh", "Nehemiah"],
  ["Esth", "Esther"], ["Job", "Job"], ["Ps", "Psalms"], ["Prov", "Proverbs"],
  ["Eccl", "Ecclesiastes"], ["Song", "Solomon's Song"], ["Isa", "Isaiah"], ["Jer", "Jeremiah"],
  ["Lam", "Lamentations"], ["Ezek", "Ezekiel"], ["Dan", "Daniel"], ["Hos", "Hosea"],
  ["Joel", "Joel"], ["Amos", "Amos"], ["Obad", "Obadiah"], ["Jonah", "Jonah"],
  ["Mic", "Micah"], ["Nah", "Nahum"], ["Hab", "Habakkuk"], ["Zeph", "Zephaniah"],
  ["Hag", "Haggai"], ["Zech", "Zechariah"], ["Mal", "Malachi"], ["Matt", "Matthew"],
  ["Mark", "Mark"], ["Luke", "Luke"], ["John", "John"], ["Acts", "Acts"], ["Rom", "Romans"],
  ["1Cor", "1 Corinthians"], ["2Cor", "2 Corinthians"], ["Gal", "Galatians"], ["Eph", "Ephesians"],
  ["Phil", "Philippians"], ["Col", "Colossians"], ["1Thess", "1 Thessalonians"],
  ["2Thess", "2 Thessalonians"], ["1Tim", "1 Timothy"], ["2Tim", "2 Timothy"],
  ["Titus", "Titus"], ["Phlm", "Philemon"], ["Heb", "Hebrews"], ["Jas", "James"],
  ["1Pet", "1 Peter"], ["2Pet", "2 Peter"], ["1John", "1 John"], ["2John", "2 John"],
  ["3John", "3 John"], ["Jude", "Jude"], ["Rev", "Revelation"],
]);

function osisToReference(osisRef) {
  const [book, chapter, verse] = String(osisRef ?? "").split(".");
  const bookName = osisToBook.get(book);
  if (!bookName || !chapter || !verse) return null;
  const reference = `${bookName} ${Number(chapter)}:${Number(verse)}`;
  return verses1769[reference] ? reference : null;
}

function bookFromReference(reference) {
  const match = String(reference).match(/^(.+) \d+:\d+$/);
  return match?.[1] ?? "";
}

function chapterFromReference(reference) {
  const match = String(reference).match(/^.+ (\d+):\d+$/);
  return match?.[1] ? Number(match[1]) : null;
}

async function loadExistingPairs(outputFileName) {
  if (!avoidExisting) return new Set();

  const pairs = new Set();
  const entries = await fs.readdir(existingImportsDir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json") || entry.name === outputFileName) continue;
    const filePath = path.join(existingImportsDir, entry.name);
    let rows = [];
    try {
      rows = JSON.parse(await fs.readFile(filePath, "utf8"));
    } catch {
      continue;
    }
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      if (!row?.verse_ref || !row?.target_ref || !row?.source) continue;
      pairs.add(`${row.verse_ref}|${row.target_ref}|${row.source}`);
    }
  }
  return pairs;
}

async function main() {
  const [verses, crossRefs] = await Promise.all([
    readJsonOrCsv(path.join(sourceDir, "Verses.csv")),
    readJsonOrCsv(path.join(sourceDir, "CrossRefIndex.csv")),
  ]);

  const verseById = new Map();
  for (const verse of verses) {
    const reference = osisToReference(verse.OsisRef);
    if (reference) verseById.set(String(verse.VerseID), reference);
  }

  const wantedBooks = new Set(books);
  const rowsByVerse = new Map();
  const selectedVerseRefsByBook = new Map();
  const selectedChaptersByBook = new Map();
  const outputFileName = path.basename(outputPath);
  const seenPairs = await loadExistingPairs(outputFileName);
  let existingPairsAvoided = 0;

  for (const row of crossRefs) {
    const verseRef = verseById.get(String(row.VerseID));
    const targetRef = verseById.get(String(row.VerseRefID));
    if (!verseRef || !targetRef) continue;

    const book = bookFromReference(verseRef);
    if (!wantedBooks.has(book)) continue;

    const selectedVerses = selectedVerseRefsByBook.get(book) ?? new Set();
    const selectedChapters = selectedChaptersByBook.get(book) ?? new Set();
    const chapter = chapterFromReference(verseRef);
    const existingRows = rowsByVerse.get(verseRef) ?? [];
    const pairKey = `${verseRef}|${targetRef}|${sourceMetadata.source}`;
    if (seenPairs.has(pairKey)) {
      existingPairsAvoided += 1;
      continue;
    }
    if (!selectedVerses.has(verseRef) && selectedVerses.size >= maxVersesPerBook) continue;
    if (
      spreadByChapter &&
      chapter &&
      !selectedVerses.has(verseRef) &&
      selectedChapters.has(chapter) &&
      selectedChapters.size < maxVersesPerBook
    ) {
      continue;
    }
    if (existingRows.length >= maxRefsPerVerse) continue;

    seenPairs.add(pairKey);
    selectedVerses.add(verseRef);
    if (chapter) selectedChapters.add(chapter);
    selectedVerseRefsByBook.set(book, selectedVerses);
    selectedChaptersByBook.set(book, selectedChapters);
    existingRows.push({
      verse_ref: verseRef,
      target_ref: targetRef,
      label: "Reviewed TSK cross-reference pair.",
      ...sourceMetadata,
    });
    rowsByVerse.set(verseRef, existingRows);
  }

  const output = [...rowsByVerse.values()]
    .flat()
    .sort((a, b) =>
      a.verse_ref.localeCompare(b.verse_ref, undefined, { numeric: true }) ||
      a.target_ref.localeCompare(b.target_ref, undefined, { numeric: true }),
    );

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  const coverage = books.map((book) => ({
    book,
    chapters: selectedChaptersByBook.get(book)?.size ?? 0,
    sourceVerses: selectedVerseRefsByBook.get(book)?.size ?? 0,
    rows: output.filter((row) => bookFromReference(row.verse_ref) === book).length,
  }));

  console.log("TSK MetaV reviewed batch created");
  console.table({
    output: path.relative(process.cwd(), outputPath),
    rows: output.length,
    books: books.length,
    maxVersesPerBook,
    maxRefsPerVerse,
    spreadByChapter,
    avoidExisting,
    existingPairsAvoided,
  });
  console.table(coverage);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
