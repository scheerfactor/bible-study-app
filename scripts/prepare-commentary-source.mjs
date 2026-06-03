#!/usr/bin/env node
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import verses1769 from "es-kjv/json/verses-1769.js";

const execFileAsync = promisify(execFile);
const manifestPath = process.argv.find((arg) => arg.endsWith(".json")) ?? "data/commentary/jfb/source-manifest.json";
const dryRun = process.argv.includes("--dry-run");
const outputArg = process.argv.find((arg) => arg.startsWith("--output="));
const reportArg = process.argv.find((arg) => arg.startsWith("--report="));

const bookOrder = Array.from(new Set(Object.keys(verses1769).map((reference) => reference.replace(/ \d+:\d+$/, ""))));
const bookFileNumbers = Object.fromEntries(bookOrder.map((book, index) => [book, String(index + 1).padStart(2, "0")]));
const chapterCounts = new Map();
const verseCounts = new Map();

for (const reference of Object.keys(verses1769)) {
  const match = reference.match(/^(.+) (\d+):(\d+)$/);
  if (!match) continue;
  const [, book, chapterRaw, verseRaw] = match;
  const chapter = Number(chapterRaw);
  const verse = Number(verseRaw);
  chapterCounts.set(book, Math.max(chapterCounts.get(book) ?? 0, chapter));
  verseCounts.set(`${book} ${chapter}`, Math.max(verseCounts.get(`${book} ${chapter}`) ?? 0, verse));
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const defaultOutput = `data/commentary/staging/${slugify(manifest.author)}-complete-commentary-needs-review.json`;
const defaultReport = `data/commentary/reports/${slugify(manifest.author)}-complete-commentary-coverage.json`;
const outputPath = outputArg?.replace("--output=", "") ?? defaultOutput;
const reportPath = reportArg?.replace("--report=", "") ?? defaultReport;

let entries;

if (manifest.parser === "jfb-html-archive") {
  entries = await prepareJfbHtmlArchive(manifest);
} else if (manifest.parser === "chapter-heading-txt" || manifest.parser === "chapter-heading-html") {
  entries = await prepareChapterHeadingFiles(manifest);
} else {
  throw new Error(`Unsupported commentary parser: ${manifest.parser}`);
}

const report = buildReport(entries);

if (dryRun) {
  console.log(`Dry run OK for ${manifest.id}.`);
  console.table({
    entries: entries.length,
    books_covered: report.books_covered,
    chapters_covered: report.chapters_covered,
    duplicate_entries: report.duplicate_entries.length,
    output: outputPath,
  });
  process.exit(report.duplicate_entries.length ? 1 : 0);
}

await mkdir(path.dirname(outputPath), { recursive: true });
await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(entries, null, 2)}\n`);
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Prepared ${entries.length} staged commentary entries.`);
console.log(`Staging file: ${outputPath}`);
console.log(`Coverage report: ${reportPath}`);
console.table({
  books_covered: report.books_covered,
  chapters_covered: report.chapters_covered,
  missing_chapters: report.missing_chapters,
  duplicate_entries: report.duplicate_entries.length,
});

async function prepareJfbHtmlArchive(sourceManifest) {
  const archivePath = sourceManifest.archive_path;
  await ensureArchive(sourceManifest.download_url, archivePath);

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "commentary-jfb-"));
  try {
    await execFileAsync("unzip", ["-q", archivePath, "-d", tempDir]);
    const stagedEntries = [];

    for (const book of bookOrder) {
      const fileNumber = bookFileNumbers[book];
      const sourceFile = `JFB${fileNumber}.htm`;
      const html = await readFile(path.join(tempDir, sourceFile), "utf8");
      const chapterSections = splitJfbChapters(html);
      const expectedChapters = chapterCounts.get(book) ?? 0;

      for (let chapter = 1; chapter <= expectedChapters; chapter += 1) {
        const sectionHtml = chapterSections.get(chapter) ?? (expectedChapters === 1 ? singleChapterBody(html) : "");
        if (!sectionHtml) continue;
        const entryText = normalizeText(htmlToText(sectionHtml).replace(new RegExp(`^CHAPTER\\s+${chapter}\\b`, "i"), ""));
        if (!entryText) continue;

        stagedEntries.push(buildEntry({
          sourceManifest,
          book,
          chapter,
          sourceFile,
          sourceUrl: `https://www.ccel.org/j/jfb/jfb/JFB${fileNumber}.htm#Chapter${chapter}`,
          entryText,
        }));
      }
    }

    return stagedEntries;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function prepareChapterHeadingFiles(sourceManifest) {
  const files = sourceManifest.source_files ?? [];
  const stagedEntries = [];

  for (const sourceFile of files) {
    const raw = await readFile(sourceFile.path, "utf8");
    const text = sourceFile.path.toLowerCase().endsWith(".html") || sourceFile.path.toLowerCase().endsWith(".htm")
      ? htmlToText(raw)
      : raw;
    const sections = splitByBookChapterHeading(text);

    for (const section of sections) {
      stagedEntries.push(buildEntry({
        sourceManifest,
        book: section.book,
        chapter: section.chapter,
        sourceFile: sourceFile.path,
        sourceUrl: sourceFile.source_url ?? sourceManifest.source_url,
        entryText: section.entryText,
      }));
    }
  }

  return stagedEntries;
}

function splitJfbChapters(html) {
  const matches = Array.from(html.matchAll(/<A\s+NAME=["']Chapter(\d+)["'][^>]*>/gi));
  const chapters = new Map();

  matches.forEach((match, index) => {
    const chapter = Number(match[1]);
    const start = match.index ?? 0;
    const next = matches[index + 1]?.index ?? html.search(/<HR>\s*<TABLE/i);
    const end = next > start ? next : html.length;
    chapters.set(chapter, html.slice(start, end));
  });

  return chapters;
}

function singleChapterBody(html) {
  const bodyStart = html.search(/<A\s+NAME=["']Introduction["'][^>]*>/i);
  const contentStart = bodyStart >= 0 ? bodyStart : html.search(/<BODY\b[^>]*>/i);
  const footerStart = html.search(/<HR>\s*<TABLE/i);
  const start = contentStart >= 0 ? contentStart : 0;
  const end = footerStart > start ? footerStart : html.length;
  return html.slice(start, end);
}

function splitByBookChapterHeading(text) {
  const headingPattern = /(?:^|\n)\s*([1-3]?\s?[A-Za-z ]+)\s+(?:chapter|ch\.?)\s+(\d+)\s*(?:\n|$)/gi;
  const matches = Array.from(text.matchAll(headingPattern));

  return matches.flatMap((match, index) => {
    const book = normalizeBookName(match[1]);
    const chapter = Number(match[2]);
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? text.length;
    const entryText = normalizeText(text.slice(start, end));

    if (!book || !chapter || !entryText) return [];
    return [{ book, chapter, entryText }];
  });
}

function buildEntry({ sourceManifest, book, chapter, sourceFile, sourceUrl, entryText }) {
  const verseEnd = verseCounts.get(`${book} ${chapter}`) ?? 1;
  return {
    id: `${slugify(sourceManifest.author)}-${slugify(book)}-${chapter}`,
    reference: `${book} ${chapter}`,
    book,
    chapter,
    verse_start: 1,
    verse_end: verseEnd,
    author: sourceManifest.author,
    resource_title: sourceManifest.resource_title,
    source_title: sourceManifest.source_title ?? sourceManifest.resource_title,
    source_url: sourceUrl,
    public_domain_status: sourceManifest.public_domain_status,
    rights_basis: sourceManifest.rights_basis,
    recommended_use: sourceManifest.recommended_use,
    entry_text: entryText,
    review_status: "Needs Review",
    import_status: "Staged",
    parser: sourceManifest.parser,
    source_file: sourceFile,
    source_checksum: sha256(entryText),
  };
}

function buildReport(rows) {
  const covered = new Set(rows.map((entry) => `${entry.book} ${entry.chapter}`));
  const duplicateKeys = new Set();
  const seen = new Set();
  const chaptersByBook = {};

  for (const entry of rows) {
    const key = `${entry.book}|${entry.chapter}|${entry.verse_start}|${entry.verse_end}|${entry.author}|${entry.resource_title}`;
    if (seen.has(key)) duplicateKeys.add(key);
    seen.add(key);

    chaptersByBook[entry.book] ??= {
      covered: [],
      missing: [],
      review_status: entry.review_status,
    };
    chaptersByBook[entry.book].covered.push(entry.chapter);
  }

  let missingChapters = 0;
  for (const book of bookOrder) {
    const total = chapterCounts.get(book) ?? 0;
    const coveredChapters = new Set(chaptersByBook[book]?.covered ?? []);
    const missing = [];
    for (let chapter = 1; chapter <= total; chapter += 1) {
      if (!coveredChapters.has(chapter)) missing.push(chapter);
    }
    if (chaptersByBook[book]) {
      chaptersByBook[book].covered = Array.from(coveredChapters).sort((a, b) => a - b);
      chaptersByBook[book].missing = missing;
    }
    missingChapters += missing.length;
  }

  return {
    generated_at: new Date().toISOString(),
    author: manifest.author,
    resource_title: manifest.resource_title,
    review_status: "Needs Review",
    total_entries: rows.length,
    books_covered: new Set(rows.map((entry) => entry.book)).size,
    chapters_covered: covered.size,
    total_bible_chapters: Array.from(chapterCounts.values()).reduce((total, count) => total + count, 0),
    missing_chapters: missingChapters,
    duplicate_entries: Array.from(duplicateKeys).sort(),
    books: chaptersByBook,
  };
}

async function ensureArchive(downloadUrl, archivePath) {
  try {
    await readFile(archivePath);
    return;
  } catch {
    if (!downloadUrl) throw new Error(`Missing archive file: ${archivePath}`);
  }

  console.log(`Downloading commentary source archive: ${downloadUrl}`);
  const response = await fetch(downloadUrl);
  if (!response.ok) throw new Error(`Download failed ${response.status}: ${downloadUrl}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await mkdir(path.dirname(archivePath), { recursive: true });
  await writeFile(archivePath, buffer);
}

function htmlToText(html) {
  return decodeEntities(String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " "));
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&([a-z]+);/gi, " ");
}

function normalizeText(value) {
  return String(value)
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function normalizeBookName(value) {
  const compact = String(value).trim().replace(/\s+/g, " ").toLowerCase();
  return bookOrder.find((book) => book.toLowerCase() === compact) ?? "";
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
