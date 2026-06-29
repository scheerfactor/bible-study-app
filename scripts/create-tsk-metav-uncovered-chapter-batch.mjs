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
  args.get("output") ?? "data/imports/tsk-metav-reviewed-uncovered-chapters.json",
);
const books = String(args.get("books") ?? "")
  .split("|")
  .map((book) => book.trim())
  .filter(Boolean);
const maxNewChaptersPerBook = Math.max(1, Number(args.get("max-new-chapters-per-book") ?? 12));
const maxRefsPerVerse = Math.max(1, Number(args.get("max-refs-per-verse") ?? 2));
const existingImportsDir = path.resolve(process.cwd(), args.get("existing-imports-dir") ?? "data/imports");

if (!books.length) {
  console.error('Usage: npm run create:tsk-metav-uncovered-batch -- --books="Psalms|Isaiah|Romans"');
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

function parseReference(reference) {
  const match = String(reference ?? "").match(/^(.+) (\d+):(\d+)$/);
  if (!match) return null;
  return { book: match[1], chapter: Number(match[2]), verse: Number(match[3]) };
}

async function loadExistingPairs(outputFileName) {
  const coveredChaptersByBook = new Map(books.map((book) => [book, new Set()]));
  const existingPairs = new Set();
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
      if (row?.verse_ref && row?.target_ref && row?.source) {
        existingPairs.add(`${row.verse_ref}|${row.target_ref}|${row.source}`);
      }
      const parsed = parseReference(row?.verse_ref);
      if (parsed && coveredChaptersByBook.has(parsed.book)) {
        coveredChaptersByBook.get(parsed.book).add(parsed.chapter);
      }
    }
  }

  return { coveredChaptersByBook, existingPairs };
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

  const outputFileName = path.basename(outputPath);
  const { coveredChaptersByBook, existingPairs } = await loadExistingPairs(outputFileName);
  const selectedChaptersByBook = new Map(books.map((book) => [book, new Set()]));
  const selectedVerseByBookChapter = new Map();
  const selectedRowsByVerse = new Map();
  let existingPairsAvoided = 0;

  for (const row of crossRefs) {
    const verseRef = verseById.get(String(row.VerseID));
    const targetRef = verseById.get(String(row.VerseRefID));
    if (!verseRef || !targetRef) continue;

    const parsed = parseReference(verseRef);
    if (!parsed || !books.includes(parsed.book)) continue;
    if (coveredChaptersByBook.get(parsed.book).has(parsed.chapter)) continue;

    const selectedChapters = selectedChaptersByBook.get(parsed.book);
    if (!selectedChapters.has(parsed.chapter) && selectedChapters.size >= maxNewChaptersPerBook) continue;

    const chapterKey = `${parsed.book} ${parsed.chapter}`;
    const selectedVerse = selectedVerseByBookChapter.get(chapterKey);
    if (selectedVerse && selectedVerse !== verseRef) continue;

    const currentRows = selectedRowsByVerse.get(verseRef) ?? [];
    if (currentRows.length >= maxRefsPerVerse) continue;

    const pairKey = `${verseRef}|${targetRef}|${sourceMetadata.source}`;
    if (existingPairs.has(pairKey)) {
      existingPairsAvoided += 1;
      continue;
    }

    existingPairs.add(pairKey);
    selectedChapters.add(parsed.chapter);
    selectedVerseByBookChapter.set(chapterKey, verseRef);
    currentRows.push({
      verse_ref: verseRef,
      target_ref: targetRef,
      label: "Reviewed TSK cross-reference pair for a previously uncovered chapter.",
      ...sourceMetadata,
    });
    selectedRowsByVerse.set(verseRef, currentRows);
  }

  const output = [...selectedRowsByVerse.values()]
    .flat()
    .sort((a, b) =>
      a.verse_ref.localeCompare(b.verse_ref, undefined, { numeric: true }) ||
      a.target_ref.localeCompare(b.target_ref, undefined, { numeric: true }),
    );

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log("TSK MetaV uncovered chapter batch created");
  console.table({
    output: path.relative(process.cwd(), outputPath),
    rows: output.length,
    books: books.length,
    maxNewChaptersPerBook,
    maxRefsPerVerse,
    existingPairsAvoided,
  });
  console.table(
    books.map((book) => ({
      book,
      newChapters: selectedChaptersByBook.get(book)?.size ?? 0,
      rows: output.filter((row) => parseReference(row.verse_ref)?.book === book).length,
    })),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
