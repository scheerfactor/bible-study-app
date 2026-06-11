#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import verses1769 from "es-kjv/json/verses-1769.js";

const authorArg = valueFor("--author");
const sourceArg = valueFor("--source");
const refsArg = valueFor("--refs");
const outputArg = valueFor("--output");
const prunePublicConflicts = process.argv.includes("--prune-public-conflicts");
const dryRun = process.argv.includes("--dry-run");

if (!authorArg || !sourceArg || !refsArg || !outputArg) {
  console.error("Usage: node scripts/create-commentary-source-batch.mjs --author=Barnes --source=studylight-bnb --refs=\"John 1-5\" --output=data/imports/file.json [--prune-public-conflicts]");
  process.exit(1);
}

const bookOrder = Array.from(new Set(Object.keys(verses1769).map((reference) => reference.replace(/ \d+:\d+$/, ""))));
const verseEndByChapter = new Map();
for (const reference of Object.keys(verses1769)) {
  const match = reference.match(/^(.+) (\d+):(\d+)$/);
  if (!match) continue;
  const [, book, chapterRaw, verseRaw] = match;
  const key = `${book} ${Number(chapterRaw)}`;
  verseEndByChapter.set(key, Math.max(verseEndByChapter.get(key) ?? 0, Number(verseRaw)));
}

const sources = {
  "studylight-bnb": {
    author: "Albert Barnes",
    resourceTitle: "Barnes' Notes on the Bible",
    sourceTitle: "Barnes' Notes on the Whole Bible",
    abbr: "bnb",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. Barnes died in 1870; source pages cite the work as 1870.",
    rightsBasis: "Public-domain StudyLight chapter pages for Barnes' Notes on the Whole Bible. Preserve chapter URL and do not mix with modern edited editions.",
    recommendedUse: "Use as a concise explanatory comparison after reading the KJV text and primary study helps.",
  },
  "studylight-acc": {
    author: "Adam Clarke",
    resourceTitle: "Adam Clarke's Commentary on the Bible",
    sourceTitle: "Clarke's Commentary",
    abbr: "acc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. Source pages cite Clarke's commentary as 1832.",
    rightsBasis: "Public-domain StudyLight chapter pages for Clarke's Commentary. Preserve chapter URL and do not mix with modern edited editions.",
    recommendedUse: "Use as a Methodist historical comparison with visible discernment labels; keep Scripture primary.",
  },
  "studylight-mpc": {
    author: "Matthew Poole",
    resourceTitle: "Poole's English Annotations on the Holy Bible",
    sourceTitle: "Poole's Annotations",
    abbr: "mpc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. Text Courtesy of BibleSupport.com. Used by Permission. Source pages cite Poole's annotations as 1685.",
    rightsBasis: "Public-domain StudyLight chapter pages for Matthew Poole's English Annotations. Preserve chapter URL and BibleSupport permission note; do not mix with modern edited editions.",
    recommendedUse: "Use as a concise Puritan-era explanatory comparison after reading the KJV text and primary study helps.",
  },
  "studylight-tpc": {
    author: "Joseph S. Exell and H. D. M. Spence-Jones",
    resourceTitle: "The Pulpit Commentary",
    sourceTitle: "The Pulpit Commentary",
    abbr: "tpc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. Text Courtesy of BibleSupport.com. Used by Permission. Source pages cite The Pulpit Commentary as 1897.",
    rightsBasis: "Public-domain StudyLight chapter pages for The Pulpit Commentary. Preserve chapter URL and BibleSupport permission note; do not mix with modern edited editions.",
    recommendedUse: "Use as a larger homiletic and expository comparison source for teaching and preaching preparation.",
  },
  "studylight-tbi": {
    author: "Joseph S. Exell",
    resourceTitle: "The Biblical Illustrator",
    sourceTitle: "The Biblical Illustrator",
    abbr: "tbi",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. Text Courtesy of BibleSupport.com. Used by Permission. Source pages cite The Biblical Illustrator as 1905-1909.",
    rightsBasis: "Public-domain StudyLight chapter pages for The Biblical Illustrator. Preserve chapter URL and BibleSupport permission note; do not mix with modern edited editions.",
    recommendedUse: "Use as a preaching and teaching illustration source, secondary to Scripture and doctrinally reviewed commentary.",
  },
  "ccel-wesley-xml": {
    author: "John Wesley",
    resourceTitle: "Wesley's Notes on the Bible",
    sourceTitle: "Wesley's Notes on the Bible",
    sourceUrl: "https://www.ccel.org/ccel/w/wesley/notes.xml",
    xmlUrl: "https://www.ccel.org/ccel/w/wesley/notes.xml",
    publicDomainStatus: "CCEL XML metadata lists Wesley's Notes on the Bible as Public Domain.",
    rightsBasis: "Public-domain CCEL ThML/XML source for Wesley's Notes on the Bible. Preserve CCEL source URL and perspective labels.",
    recommendedUse: "Use as compact Methodist historical notes after the KJV text, with doctrinal discernment labels visible.",
  },
};

const source = sources[sourceArg];
if (!source) throw new Error(`Unsupported source: ${sourceArg}`);
if (authorArg !== source.author && authorArg.toLowerCase() !== source.author.toLowerCase()) {
  throw new Error(`Author/source mismatch. ${sourceArg} is configured for ${source.author}.`);
}

const targetRefs = parseReferenceList(refsArg);
const rows = sourceArg.startsWith("studylight")
  ? await buildStudyLightRows(source, targetRefs)
  : await buildWesleyRows(source, targetRefs);

const publicImportFiles = await findPublicCommentaryImportFiles();
const reviewedKeys = new Set(rows.map(publicKey));
const duplicateConflicts = [];
const prunedFiles = [];

for (const filePath of publicImportFiles) {
  if (path.resolve(filePath) === path.resolve(outputArg)) continue;
  const existingRows = JSON.parse(await readFile(filePath, "utf8"));
  if (!Array.isArray(existingRows)) continue;
  const keptRows = existingRows.filter((row) => !reviewedKeys.has(publicKey(row)));
  const removedCount = existingRows.length - keptRows.length;
  if (!removedCount) continue;
  duplicateConflicts.push({ filePath, removedCount });
  if (prunePublicConflicts && !dryRun) {
    await writeFile(filePath, `${JSON.stringify(keptRows, null, 2)}\n`);
    prunedFiles.push({ filePath, removedCount });
  }
}

if (duplicateConflicts.length && !prunePublicConflicts) {
  console.error("Duplicate public commentary conflicts found. Re-run with --prune-public-conflicts after reviewing removals.");
  console.table(duplicateConflicts);
  process.exit(1);
}

if (!dryRun) {
  await mkdir(path.dirname(outputArg), { recursive: true });
  await writeFile(outputArg, `${JSON.stringify(rows, null, 2)}\n`);
}

console.log(`${dryRun ? "Dry run OK" : "Created"} source commentary batch.`);
console.table({
  author: source.author,
  source: sourceArg,
  chapters: rows.length,
  output: outputArg,
  public_conflict_files: duplicateConflicts.length,
  pruned_files: prunedFiles.length,
});
if (duplicateConflicts.length) console.table(duplicateConflicts);

async function buildStudyLightRows(sourceConfig, references) {
  const rows = [];
  for (const reference of references) {
    const [book, chapterRaw] = splitChapterReference(reference);
    const chapter = Number(chapterRaw);
    const sourceUrl = `https://www.studylight.org/commentaries/eng/${sourceConfig.abbr}/${studyLightBookSlug(book)}-${chapter}.html`;
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error(`Failed ${response.status}: ${sourceUrl}`);
    const html = await response.text();
    if (!/These files are public domain/i.test(html)) throw new Error(`Missing public-domain statement: ${sourceUrl}`);
    const entryText = normalizeText(cleanStudyLightText(htmlToText(extractStudyLightCommentary(html))));
    if (!entryText) throw new Error(`No commentary text extracted: ${sourceUrl}`);
    rows.push(buildRow({ sourceConfig, book, chapter, sourceUrl, entryText }));
  }
  return rows;
}

async function buildWesleyRows(sourceConfig, references) {
  const response = await fetch(sourceConfig.xmlUrl);
  if (!response.ok) throw new Error(`Failed ${response.status}: ${sourceConfig.xmlUrl}`);
  const xml = await response.text();
  if (!/<DC\.Rights>Public Domain<\/DC\.Rights>/i.test(xml)) throw new Error("Missing CCEL public-domain rights statement in Wesley XML.");
  const chapterSections = extractWesleyChapterSections(xml);
  return references.map((reference) => {
    const [book, chapterRaw] = splitChapterReference(reference);
    const chapter = Number(chapterRaw);
    const entryText = chapterSections.get(`${book} ${chapter}`);
    if (!entryText) throw new Error(`Missing Wesley XML commentary section: ${book} ${chapter}`);
    return buildRow({
      sourceConfig,
      book,
      chapter,
      sourceUrl: `${sourceConfig.sourceUrl}#${slugify(book)}-${chapter}`,
      entryText,
    });
  });
}

function extractStudyLightCommentary(html) {
  const start = html.indexOf("<div class=\"commentaries-entries\">");
  const end = html.indexOf("<div class=\"clear-both copyright\">");
  if (start < 0 || end < start) return "";
  return html.slice(start, end)
    .replace(/<div class="floating-resources">[\s\S]*?<\/div>\s*<\/div>/i, " ")
    .replace(/<div id="navigation"[\s\S]*?<\/div>\s*<\/div>/i, " ");
}

function extractWesleyChapterSections(xml) {
  const sections = new Map();
  const matches = Array.from(xml.matchAll(/<div3\b[^>]*>[\s\S]*?<scripCom\b[^>]*osisRef="Bible:([^."]+)\.(\d+)"[^>]*\/>[\s\S]*?(?=<div3\b|<\/div2>|<\/div1>)/g));
  const osisToBook = new Map(bookOrder.map((book) => [osisBook(book), book]));

  for (const match of matches) {
    const osis = match[1];
    const chapter = Number(match[2]);
    const book = osisToBook.get(osis);
    if (!book) continue;
    const entryText = normalizeText(htmlToText(match[0]));
    if (entryText) sections.set(`${book} ${chapter}`, entryText);
  }

  return sections;
}

function buildRow({ sourceConfig, book, chapter, sourceUrl, entryText }) {
  const verseEnd = verseEndByChapter.get(`${book} ${chapter}`) ?? 1;
  return {
    id: `${slugify(sourceConfig.author)}-${slugify(book)}-${chapter}-phase-3-reviewed`,
    reference: `${book} ${chapter}`,
    book,
    chapter,
    verse_start: 1,
    verse_end: verseEnd,
    author: sourceConfig.author,
    resource_title: sourceConfig.resourceTitle,
    source_title: sourceConfig.sourceTitle,
    source_url: sourceUrl,
    public_domain_status: sourceConfig.publicDomainStatus,
    rights_basis: sourceConfig.rightsBasis,
    recommended_use: sourceConfig.recommendedUse,
    entry_text: entryText,
    review_status: "Verified",
    import_status: "Public Verified",
    review_batch: "Commentary Expansion Phase 3",
    review_notes: "Chapter source, public-domain statement, and reference metadata reviewed for this expansion batch.",
  };
}

function valueFor(name) {
  const argument = process.argv.find((arg) => arg.startsWith(`${name}=`));
  return argument?.slice(name.length + 1);
}

function parseReferenceList(value) {
  return value
    .split(",")
    .flatMap((part) => {
      const trimmed = part.trim();
      const match = trimmed.match(/^(.+?)\s+(\d+)(?:-(\d+))?$/);
      if (!match) throw new Error(`Invalid reference range: ${trimmed}`);
      const [, bookRaw, startRaw, endRaw] = match;
      const book = normalizeBookName(bookRaw);
      const start = Number(startRaw);
      const end = Number(endRaw ?? startRaw);
      const references = [];
      for (let chapter = start; chapter <= end; chapter += 1) references.push(`${book} ${chapter}`);
      return references;
    });
}

function normalizeBookName(value) {
  const compact = String(value).trim().replace(/\s+/g, " ").toLowerCase();
  const book = bookOrder.find((candidate) => candidate.toLowerCase() === compact);
  if (!book) throw new Error(`Unknown Bible book: ${value}`);
  return book;
}

function splitChapterReference(reference) {
  const match = reference.match(/^(.+) (\d+)$/);
  if (!match) throw new Error(`Invalid chapter reference: ${reference}`);
  return [match[1], match[2]];
}

function studyLightBookSlug(book) {
  return book.toLowerCase().replace(/^\d /, (value) => value.trim()).replace(/\s+/g, "-");
}

function osisBook(book) {
  const special = {
    Psalms: "Ps",
    Revelation: "Rev",
    Romans: "Rom",
    John: "John",
    Luke: "Luke",
    Amos: "Amos",
  };
  if (special[book]) return special[book];
  return book.replace(/\s+/g, "");
}

async function findPublicCommentaryImportFiles() {
  const files = await readdir("data/imports");
  return files
    .filter((file) => file.endsWith(".json") && file.includes("commentary"))
    .map((file) => path.join("data/imports", file))
    .sort();
}

function publicKey(row) {
  return [row.book, row.chapter, row.verse_start, row.verse_end, row.author, row.resource_title].join("|");
}

function htmlToText(html) {
  return decodeEntities(String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|h[1-6]|li|tr|ol|ul)>/gi, "\n")
    .replace(/<[^>]+>/g, " "));
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&mdash;/gi, " - ")
    .replace(/&ndash;/gi, " - ")
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

function cleanStudyLightText(value) {
  let text = String(value);
  const toolboxIndex = text.search(/Resource Toolbox/i);
  const firstVerseIndex = text.search(/\bVerse\s+1\b/i);
  if (toolboxIndex >= 0 && firstVerseIndex > toolboxIndex && firstVerseIndex < 12000) {
    text = text.slice(firstVerseIndex);
  }
  return text
    .replace(/\bResource Toolbox\b/gi, " ")
    .replace(/\bPrint version\b/gi, " ")
    .replace(/\bOverview\b/gi, " ")
    .replace(/\bCopyright\b/gi, " ")
    .replace(/\bBibliography\b/gi, " ")
    .replace(/\bAdditional Authors\b/gi, " ")
    .replace(/return to ['"‘’]? Top of Page ['"‘’]?/gi, " ");
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
