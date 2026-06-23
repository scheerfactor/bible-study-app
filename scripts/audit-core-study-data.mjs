#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import verses1769 from "es-kjv/json/verses-1769.js";
import { readJsonOrCsv } from "./import-utils.mjs";

const bookOrder = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Solomon's Song", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation",
];

function pct(value, total) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 1000) / 10}%`;
}

function pctNumber(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 1000) / 10;
}

function parseReference(reference) {
  const match = String(reference ?? "").trim().match(/^(.+) (\d+):(\d+)$/);
  if (!match) return null;
  return {
    book: match[1],
    chapter: Number(match[2]),
    verse: Number(match[3]),
  };
}

function addCoverage(map, reference) {
  const parsed = parseReference(reference);
  if (!parsed) return;
  if (!map.has(parsed.book)) {
    map.set(parsed.book, {
      chapters: new Set(),
      verses: new Set(),
      rows: 0,
    });
  }
  const bucket = map.get(parsed.book);
  bucket.chapters.add(parsed.chapter);
  bucket.verses.add(`${parsed.book} ${parsed.chapter}:${parsed.verse}`);
  bucket.rows += 1;
}

function weakestBookCoverage(map, limit = 12) {
  return bookOrder
    .map((book) => {
      const totalBookChapters = chaptersByBook.get(book)?.size ?? 0;
      const bucket = map.get(book);
      const chaptersCovered = bucket?.chapters.size ?? 0;
      const versesCovered = bucket?.verses.size ?? 0;
      const rows = bucket?.rows ?? 0;
      return {
        book,
        chaptersCovered,
        totalChapters: totalBookChapters,
        chapterCoveragePercent: pctNumber(chaptersCovered, totalBookChapters),
        versesCovered,
        rows,
      };
    })
    .sort((a, b) =>
      a.chapterCoveragePercent - b.chapterCoveragePercent ||
      a.rows - b.rows ||
      bookOrder.indexOf(a.book) - bookOrder.indexOf(b.book),
    )
    .slice(0, limit);
}

const dictionaryAliases = {
  believest: "believe",
  believeth: "believe",
  believed: "believe",
  believing: "believe",
  loved: "love",
  loveth: "love",
  lovedst: "love",
  saved: "save",
  saveth: "save",
  condemneth: "condemn",
  condemned: "condemn",
  doeth: "do",
  doth: "do",
  didst: "do",
};

function normalizeDictionaryWord(value) {
  const cleaned = String(value ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (!cleaned) return "";
  if (dictionaryAliases[cleaned]) return dictionaryAliases[cleaned];

  const suffixRules = [
    [/eth$/, ""],
    [/est$/, ""],
    [/ies$/, "y"],
    [/ing$/, ""],
    [/ed$/, ""],
    [/s$/, ""],
  ];

  for (const [pattern, replacement] of suffixRules) {
    const candidate = cleaned.replace(pattern, replacement);
    if (candidate.length >= 3) return candidate;
  }

  return cleaned;
}

async function readJson(filePath, fallback = []) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function commentaryFiles() {
  const files = [];
  for (const directory of ["data/imports", "data/commentary/staging"]) {
    try {
      const names = await readdir(directory);
      files.push(
        ...names
          .filter((name) => name.endsWith(".json") && name.includes("commentary"))
          .map((name) => path.join(directory, name)),
      );
    } catch {
      // Optional directories can be absent in a stripped build.
    }
  }
  return files.sort();
}

async function tskFiles() {
  const files = [];
  for (const directory of ["data/imports"]) {
    try {
      const names = await readdir(directory);
      files.push(
        ...names
          .filter((name) => name.endsWith(".json") && name.includes("tsk"))
          .map((name) => path.join(directory, name)),
      );
    } catch {
      // Optional.
    }
  }
  return files.sort();
}

async function strongsMappingFiles() {
  try {
    const names = await readdir("data/strongs/mapping-batches");
    return names
      .filter((name) => name.endsWith(".json"))
      .map((name) => path.join("data/strongs/mapping-batches", name))
      .sort();
  } catch {
    return [];
  }
}

const allRefs = Object.keys(verses1769);
const chaptersByBook = new Map();
for (const ref of allRefs) {
  const match = ref.match(/^(.+) (\d+):(\d+)$/);
  if (!match) continue;
  const [, book, chapterText] = match;
  const chapter = Number(chapterText);
  if (!chaptersByBook.has(book)) chaptersByBook.set(book, new Set());
  chaptersByBook.get(book).add(chapter);
}
const totalChapters = [...chaptersByBook.values()].reduce((sum, chapters) => sum + chapters.size, 0);

const websterBaseEntries = await readJson("data/generated/websters-1828.entries.json");
const websterOverrideEntries = await readJson("data/generated/websters-1828-reviewed-overrides.json");
const websterEntries = [...websterOverrideEntries, ...websterBaseEntries];
const websterHeadwords = new Map();
for (const entry of websterEntries) {
  const key = String(entry.normalized_headword ?? "").trim();
  if (!key) continue;
  if (!websterHeadwords.has(key)) websterHeadwords.set(key, []);
  websterHeadwords.get(key).push(entry);
}

const normalizationChecks = ["believeth", "loved", "death", "doeth", "believe", "love"].map((word) => {
  const normalized = normalizeDictionaryWord(word);
  return {
    word,
    normalized,
    hasEntry: websterHeadwords.has(normalized),
  };
});

const suspiciousWebsterEntries = websterEntries.filter((entry) => /[�■]|\\bajie\\b|li'|\\bmanmr\\b/i.test(entry.definition ?? "")).length;

const strongsEntries = await readJson("data/strongs/sample-verified-strongs.json");
const verifiedStrongs = strongsEntries.filter((entry) => entry.review_status === "Verified");
const strongsWords = new Set(verifiedStrongs.flatMap((entry) => entry.english_words ?? []).map((word) => String(word).toLowerCase()));
const strongsChecks = ["believe", "faith", "love", "spirit", "flesh", "law", "beast", "kingdom", "worship"].map((word) => ({
  word,
  covered: strongsWords.has(word),
}));
const strongsMappingFilePaths = await strongsMappingFiles();
const strongsMappings = [];
for (const file of strongsMappingFilePaths) {
  const rows = await readJson(file, []);
  rows.forEach((row) => strongsMappings.push({ ...row, file }));
}
const verifiedStrongsMappings = strongsMappings.filter((row) => row.review_status === "Verified");
const strongsMappingByBook = new Map();
for (const row of verifiedStrongsMappings) addCoverage(strongsMappingByBook, row.verse_ref);
const weakestStrongsBooks = weakestBookCoverage(strongsMappingByBook, 12);

const commentaryRows = [];
for (const file of await commentaryFiles()) {
  const rows = await readJsonOrCsv(file);
  const publicRows = file.startsWith("data/imports/") ? rows : [];
  publicRows.forEach((row) => commentaryRows.push({ ...row, file }));
}
const commentaryChapters = new Set(commentaryRows.map((row) => `${row.book} ${row.chapter}`));
const commentaryAuthors = new Set(commentaryRows.map((row) => String(row.author ?? "").trim()).filter(Boolean));
const commentaryByBook = new Map(bookOrder.map((book) => [book, { rows: 0, chapters: new Set(), authors: new Set() }]));
for (const row of commentaryRows) {
  if (!commentaryByBook.has(row.book)) commentaryByBook.set(row.book, { rows: 0, chapters: new Set(), authors: new Set() });
  const bucket = commentaryByBook.get(row.book);
  bucket.rows += 1;
  bucket.chapters.add(Number(row.chapter));
  bucket.authors.add(row.author);
}

const weakestCommentaryBooks = bookOrder
  .map((book) => {
    const expected = chaptersByBook.get(book)?.size ?? 0;
    const bucket = commentaryByBook.get(book);
    const actual = bucket?.chapters.size ?? 0;
    const rows = bucket?.rows ?? 0;
    const authors = bucket?.authors.size ?? 0;
    const rowsPerChapter = expected ? rows / expected : 0;
    return { book, coveredChapters: actual, totalChapters: expected, coverage: expected ? actual / expected : 0, authors, rowsPerChapter };
  })
  .sort(
    (a, b) =>
      a.coverage - b.coverage ||
      a.authors - b.authors ||
      a.rowsPerChapter - b.rowsPerChapter ||
      a.book.localeCompare(b.book),
  )
  .slice(0, 12);

const tskRows = [];
for (const file of await tskFiles()) {
  const rows = await readJsonOrCsv(file);
  rows.forEach((row) => tskRows.push({ ...row, file }));
}
const publicTskRows = tskRows.filter((row) => !String(row.file).includes("needs-review"));
const stagedTskRows = tskRows.filter((row) => String(row.file).includes("needs-review"));
const tskSourceVerses = new Set(publicTskRows.map((row) => row.verse_ref));
const tskByBook = new Map();
for (const row of publicTskRows) addCoverage(tskByBook, row.verse_ref);
const weakestTskBooks = weakestBookCoverage(tskByBook, 12);
const tskFocusChecks = ["John 3:16", "Romans 8:28", "Amos 5:24", "Daniel 7:13", "Revelation 13:1"].map((ref) => ({
  ref,
  covered: tskSourceVerses.has(ref),
}));

const studyToolFiles = [
  "eastons-bible-dictionary.txt",
  "smiths-comprehensive-dictionary-of-the-bible.txt",
  "naves-topical-bible.txt",
  "bible-atlas-a-manual-of-biblical-geography-and-history-jesse-lyman-hurlbut-and-john-heyl-vincent.txt",
  "biblical-geography-and-history-kent-charles-foster.txt",
  "studies-in-old-testament-history-jesse-lyman-hurlbut.txt",
  "the-bible-period-by-period-a-manual-for-the-study-of-the-bible-by-periods-josiah-blake-tidwell.txt",
  "bible-animals-being-a-description-of-every-living-creature-mentioned-in-the-scripture-from-the-ape-to-the-cora.txt",
  "a-class-book-of-biblical-history-and-geography-with-numerous-maps-osborn-h-s-henry-stafford.txt",
];
const studyToolFileChecks = [];
for (const fileName of studyToolFiles) {
  try {
    const raw = await readFile(path.join("data/library/verified", fileName), "utf8");
    studyToolFileChecks.push({ fileName, exists: true, bytes: raw.length });
  } catch {
    studyToolFileChecks.push({ fileName, exists: false, bytes: 0 });
  }
}

const libraryResources = await readJson("data/library/manifests/curated-public-domain-resources.json");
const mediaCandidatesCsv = await readFile("data/media/acquisition/public-domain-audio-candidates.csv", "utf8").catch(() => "");
const mediaCandidateCount = Math.max(0, mediaCandidatesCsv.trim().split(/\r?\n/).length - 1);

const summary = {
  bible: {
    books: chaptersByBook.size,
    chapters: totalChapters,
    verses: allRefs.length,
  },
  library: {
    verifiedResources: libraryResources.length,
  },
  commentary: {
    publicRows: commentaryRows.length,
    publicChapterCoverage: `${commentaryChapters.size}/${totalChapters}`,
    publicChapterCoveragePercent: pct(commentaryChapters.size, totalChapters),
    authors: commentaryAuthors.size,
  },
  webster1828: {
    entries: websterEntries.length,
    baseEntries: websterBaseEntries.length,
    reviewedOverrides: websterOverrideEntries.length,
    uniqueNormalizedHeadwords: websterHeadwords.size,
    suspiciousOcrEntries: suspiciousWebsterEntries,
    normalizationChecks,
  },
  strongs: {
    verifiedEntries: verifiedStrongs.length,
    reviewedMappingFiles: strongsMappingFilePaths.length,
    reviewedMappingRows: verifiedStrongsMappings.length,
    reviewedMappedBooks: strongsMappingByBook.size,
    reviewedMappedChapters: [...strongsMappingByBook.values()].reduce((sum, bucket) => sum + bucket.chapters.size, 0),
    status: verifiedStrongs.length >= 8000 ? "broad import" : "starter data only",
    focusWordChecks: strongsChecks,
    weakestBooks: weakestStrongsBooks,
  },
  tsk: {
    rows: publicTskRows.length,
    stagedRows: stagedTskRows.length,
    sourceVersesCovered: tskSourceVerses.size,
    booksCovered: tskByBook.size,
    chaptersCovered: [...tskByBook.values()].reduce((sum, bucket) => sum + bucket.chapters.size, 0),
    status: tskSourceVerses.size >= allRefs.length * 0.8 ? "broad coverage" : "reviewed samples only",
    focusChecks: tskFocusChecks,
    weakestBooks: weakestTskBooks,
  },
  studyTools: {
    filesPresent: studyToolFileChecks.filter((item) => item.exists).length,
    filesExpected: studyToolFileChecks.length,
    missingFiles: studyToolFileChecks.filter((item) => !item.exists).map((item) => item.fileName),
  },
  audio: {
    publicDomainCandidateRows: mediaCandidateCount,
  },
  weakestCommentaryBooks,
};

const lines = [
  "# Core Study Data Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Summary",
  "",
  `- Bible text: ${summary.bible.books} books, ${summary.bible.chapters} chapters, ${summary.bible.verses} verses.`,
  `- Library: ${summary.library.verifiedResources} verified resources.`,
  `- Public commentary rows: ${summary.commentary.publicRows}.`,
  `- Public commentary chapter coverage: ${summary.commentary.publicChapterCoverage} (${summary.commentary.publicChapterCoveragePercent}).`,
  `- Commentary authors represented in public imports: ${summary.commentary.authors}.`,
  `- Webster 1828 entries: ${summary.webster1828.entries} (${summary.webster1828.uniqueNormalizedHeadwords} normalized headwords; ${summary.webster1828.reviewedOverrides} reviewed overlay).`,
  `- Strong's lexicon entries: ${summary.strongs.verifiedEntries}; reviewed KJV word mappings: ${summary.strongs.reviewedMappingRows} rows from ${summary.strongs.reviewedMappingFiles} batch files across ${summary.strongs.reviewedMappedBooks} books and ${summary.strongs.reviewedMappedChapters} chapters (${summary.strongs.status}).`,
  `- Public TSK rows: ${summary.tsk.rows}; staged TSK rows: ${summary.tsk.stagedRows}; source verses covered: ${summary.tsk.sourceVersesCovered}; chapters covered: ${summary.tsk.chaptersCovered}; books covered: ${summary.tsk.booksCovered} (${summary.tsk.status}).`,
  `- Study tool files present: ${summary.studyTools.filesPresent}/${summary.studyTools.filesExpected}.`,
  `- Public-domain audio candidates: ${summary.audio.publicDomainCandidateRows}.`,
  "",
  "## Webster Normalization Checks",
  "",
  "| Word | Normalized | Entry Present |",
  "| --- | --- | --- |",
  ...normalizationChecks.map((item) => `| ${item.word} | ${item.normalized} | ${item.hasEntry ? "yes" : "no"} |`),
  "",
  "## Strong's Focus Word Checks",
  "",
  "| Word | Covered |",
  "| --- | --- |",
  ...strongsChecks.map((item) => `| ${item.word} | ${item.covered ? "yes" : "no"} |`),
  "",
  "## Weakest Strong's Mapping Books",
  "",
  "| Book | Chapters Mapped | Total Chapters | Chapter Coverage | Mapped Verses | Mapping Rows |",
  "| --- | ---: | ---: | ---: | ---: | ---: |",
  ...weakestStrongsBooks.map((item) => `| ${item.book} | ${item.chaptersCovered} | ${item.totalChapters} | ${item.chapterCoveragePercent}% | ${item.versesCovered} | ${item.rows} |`),
  "",
  "## TSK Focus Reference Checks",
  "",
  "| Reference | Covered |",
  "| --- | --- |",
  ...tskFocusChecks.map((item) => `| ${item.ref} | ${item.covered ? "yes" : "no"} |`),
  "",
  "## Weakest TSK Books",
  "",
  "| Book | Chapters With References | Total Chapters | Chapter Coverage | Source Verses | Rows |",
  "| --- | ---: | ---: | ---: | ---: | ---: |",
  ...weakestTskBooks.map((item) => `| ${item.book} | ${item.chaptersCovered} | ${item.totalChapters} | ${item.chapterCoveragePercent}% | ${item.versesCovered} | ${item.rows} |`),
  "",
  "## Thinnest Commentary Books",
  "",
  "| Book | Chapters Covered | Total Chapters | Coverage | Authors | Rows/Chapter |",
  "| --- | ---: | ---: | ---: | ---: | ---: |",
  ...weakestCommentaryBooks.map((item) => `| ${item.book} | ${item.coveredChapters} | ${item.totalChapters} | ${pct(item.coveredChapters, item.totalChapters)} | ${item.authors} | ${item.rowsPerChapter.toFixed(1)} |`),
  "",
  "## Recommendations",
  "",
  "- Strong's should stay labeled as starter data until a full rights-safe dataset is imported, reviewed, mapped, and validated.",
  "- TSK is still sample/reviewed coverage, not a full TSK import. Build the next reviewed batches from the weakest-book table.",
  "- Webster is large enough to be useful, but OCR quality remains the main cleanup need. Favor reviewed entries first in user-facing displays.",
  "- Continue commentary expansion by thinnest books first rather than by raw count.",
  "- Public-domain audio should be piloted through the media intake workflow before becoming public.",
  "",
];

await mkdir("data/reports", { recursive: true });
await Promise.all([
  writeFile("CORE_STUDY_DATA_AUDIT.md", `${lines.join("\n")}\n`, "utf8"),
  writeFile("data/reports/core-study-data-audit.json", `${JSON.stringify(summary, null, 2)}\n`, "utf8"),
]);

console.log("Core study data audit complete");
console.table({
  library_resources: summary.library.verifiedResources,
  commentary_rows: summary.commentary.publicRows,
  commentary_chapter_coverage: summary.commentary.publicChapterCoveragePercent,
  webster_entries: summary.webster1828.entries,
  strongs_entries: summary.strongs.verifiedEntries,
  strongs_mapping_rows: summary.strongs.reviewedMappingRows,
  tsk_rows: summary.tsk.rows,
  audio_candidates: summary.audio.publicDomainCandidateRows,
});
console.log("Wrote CORE_STUDY_DATA_AUDIT.md");
console.log("Wrote data/reports/core-study-data-audit.json");
