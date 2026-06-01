#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { readJsonOrCsv } from "./import-utils.mjs";

const [versesPath, crossRefsPath, outputPath] = process.argv.slice(2);

if (!versesPath || !crossRefsPath || !outputPath) {
  console.error(
    "Usage: npm run prepare:tsk-metav -- <Verses.csv> <CrossRefIndex.csv> <output-json>",
  );
  process.exit(1);
}

function osisToReference(osisRef) {
  const [book, chapter, verse] = String(osisRef).split(".");
  const bookNames = {
    Gen: "Genesis",
    Exod: "Exodus",
    Lev: "Leviticus",
    Num: "Numbers",
    Deut: "Deuteronomy",
    Josh: "Joshua",
    Judg: "Judges",
    Ruth: "Ruth",
    "1Sam": "1 Samuel",
    "2Sam": "2 Samuel",
    "1Kgs": "1 Kings",
    "2Kgs": "2 Kings",
    "1Chr": "1 Chronicles",
    "2Chr": "2 Chronicles",
    Ezra: "Ezra",
    Neh: "Nehemiah",
    Esth: "Esther",
    Job: "Job",
    Ps: "Psalm",
    Prov: "Proverbs",
    Eccl: "Ecclesiastes",
    Song: "Song of Solomon",
    Isa: "Isaiah",
    Jer: "Jeremiah",
    Lam: "Lamentations",
    Ezek: "Ezekiel",
    Dan: "Daniel",
    Hos: "Hosea",
    Joel: "Joel",
    Amos: "Amos",
    Obad: "Obadiah",
    Jonah: "Jonah",
    Mic: "Micah",
    Nah: "Nahum",
    Hab: "Habakkuk",
    Zeph: "Zephaniah",
    Hag: "Haggai",
    Zech: "Zechariah",
    Mal: "Malachi",
    Matt: "Matthew",
    Mark: "Mark",
    Luke: "Luke",
    John: "John",
    Acts: "Acts",
    Rom: "Romans",
    "1Cor": "1 Corinthians",
    "2Cor": "2 Corinthians",
    Gal: "Galatians",
    Eph: "Ephesians",
    Phil: "Philippians",
    Col: "Colossians",
    "1Thess": "1 Thessalonians",
    "2Thess": "2 Thessalonians",
    "1Tim": "1 Timothy",
    "2Tim": "2 Timothy",
    Titus: "Titus",
    Phlm: "Philemon",
    Heb: "Hebrews",
    Jas: "James",
    "1Pet": "1 Peter",
    "2Pet": "2 Peter",
    "1John": "1 John",
    "2John": "2 John",
    "3John": "3 John",
    Jude: "Jude",
    Rev: "Revelation",
  };

  const bookName = bookNames[book];
  if (!bookName || !chapter || !verse) return null;
  return `${bookName} ${Number(chapter)}:${Number(verse)}`;
}

const verses = await readJsonOrCsv(versesPath);
const verseById = new Map();

for (const verse of verses) {
  const reference = osisToReference(verse.OsisRef);
  if (!reference) continue;
  verseById.set(String(verse.VerseID), reference);
}

const crossRefs = await readJsonOrCsv(crossRefsPath);
const output = [];
let skipped = 0;

for (const crossRef of crossRefs) {
  const verseRef = verseById.get(String(crossRef.VerseID));
  const targetRef = verseById.get(String(crossRef.VerseRefID));

  if (!verseRef || !targetRef) {
    skipped += 1;
    continue;
  }

  output.push({
    verse_ref: verseRef,
    target_ref: targetRef,
    label: "",
    source: "TSK",
    source_title: "Treasury of Scripture Knowledge",
  });
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log("TSK MetaV preparation summary");
console.table({
  verses_found: verses.length,
  cross_references_found: crossRefs.length,
  output_entries: output.length,
  skipped_entries: skipped,
});
