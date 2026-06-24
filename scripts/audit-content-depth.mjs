#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

async function safeReadJson(relativePath, fallback) {
  try {
    return await readJson(relativePath);
  } catch {
    return fallback;
  }
}

async function jsonFiles(directory) {
  try {
    return (await readdir(path.join(root, directory)))
      .filter((file) => file.endsWith(".json"))
      .map((file) => path.join(directory, file))
      .sort();
  } catch {
    return [];
  }
}

function isCommentaryFile(filePath, rows) {
  return filePath.endsWith("commentary.json") && Array.isArray(rows) && rows.every((row) => row.reference && row.author);
}

async function commentarySummary() {
  const files = await jsonFiles("data/imports");
  let entries = 0;
  const books = new Set();
  const authors = new Set();
  const chapters = new Set();
  let commentaryFiles = 0;

  for (const file of files) {
    const rows = await safeReadJson(file, []);
    if (!isCommentaryFile(file, rows)) continue;
    commentaryFiles += 1;
    entries += rows.length;
    for (const row of rows) {
      if (row.book) books.add(row.book);
      if (row.author) authors.add(row.author);
      if (row.book && row.chapter) chapters.add(`${row.book} ${row.chapter}`);
    }
  }

  return {
    files: commentaryFiles,
    entries,
    authors: authors.size,
    books: books.size,
    chapters: chapters.size,
  };
}

async function tskSummary() {
  const files = (await jsonFiles("data/imports")).filter((file) => file.includes("tsk") && !file.includes("needs-review"));
  let references = 0;
  const sourceVerses = new Set();
  for (const file of files) {
    const rows = await safeReadJson(file, []);
    references += Array.isArray(rows) ? rows.length : 0;
    for (const row of Array.isArray(rows) ? rows : []) {
      const sourceVerse = row.source_verse || row.sourceVerse || row.verse_ref;
      if (sourceVerse) sourceVerses.add(sourceVerse);
    }
  }
  return { files: files.length, references, sourceVerses: sourceVerses.size };
}

async function main() {
  const [library, strongEntries, strongShardManifest, websterEntries, audioCandidates, commentary, tsk] = await Promise.all([
    safeReadJson("data/library/manifests/curated-public-domain-resources.json", []),
    safeReadJson("data/strongs/sample-verified-strongs.json", []),
    safeReadJson("data/strongs/mappings-by-chapter/manifest.json", { rows: 0, chapters: 0 }),
    safeReadJson("data/generated/websters-1828.entries.json", []),
    readFile(path.join(root, "data/media/acquisition/public-domain-audio-candidates.csv"), "utf8").then((raw) => raw.trim().split(/\r?\n/).length - 1).catch(() => 0),
    commentarySummary(),
    tskSummary(),
  ]);

  const libraryResources = Array.isArray(library) ? library : library.resources ?? [];
  const categoryCounts = new Map();
  for (const resource of libraryResources) {
    const category = resource.category || "Uncategorized";
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  }

  console.log("Bible Study content depth audit");
  console.table({
    libraryResources: libraryResources.length,
    libraryCategories: categoryCounts.size,
    commentaryEntries: commentary.entries,
    commentaryAuthors: commentary.authors,
    commentaryBooks: commentary.books,
    commentaryChapters: commentary.chapters,
    tskReferences: tsk.references,
    tskSourceVerses: tsk.sourceVerses,
    strongsLexiconEntries: Array.isArray(strongEntries) ? strongEntries.length : 0,
    strongsMappingRows: strongShardManifest.rows,
    strongsMappingChapters: strongShardManifest.chapters,
    websterEntries: Array.isArray(websterEntries) ? websterEntries.length : 0,
    publicDomainAudioCandidates: audioCandidates,
  });

  console.log("Top library categories");
  console.table(
    [...categoryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([category, count]) => ({ category, count })),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
