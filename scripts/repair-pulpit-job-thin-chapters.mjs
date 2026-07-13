#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const importPath = "data/imports/pulpit-commentary-reviewed-job-13-42-commentary.json";
const sourceUrl = "https://archive.org/download/cu31924101104986/cu31924101104986_djvu.txt";
const argumentsList = process.argv.slice(2);
const localSourcePath = argumentsList.find((argument) => !argument.startsWith("--"));
const chapterArgument = argumentsList.find((argument) => argument.startsWith("--chapters="));
const writeChanges = process.argv.includes("--write");
const targetChapters = (chapterArgument?.split("=")[1] ?? "")
  .split(",")
  .map(Number)
  .filter((chapter) => Number.isInteger(chapter) && chapter >= 1 && chapter <= 42);

if (!localSourcePath || !targetChapters.length) {
  console.error(
    "Usage: node scripts/repair-pulpit-job-thin-chapters.mjs /path/to/job-ocr.txt --chapters=13,14 [--write]",
  );
  process.exit(1);
}

const sourceText = await readFile(localSourcePath, "utf8");
const lines = sourceText.split(/\r?\n/);
const headingPattern = /^(?:CH|OH|r\s+)APT[A-Z]+\s+[A-ZnrTvL]+\.?$/i;
const normalizeLine = (line) => line.trim().replace(/\s+/g, " ");
const indexLineIndex = lines.findIndex((line) => /^HOMILETICAL\s+INDEX(?:\.|$)/i.test(normalizeLine(line)));
if (indexLineIndex < 0) throw new Error("The post-commentary homiletical index boundary was not found.");

const headings = lines
  .map((line, index) => ({ line: index + 1, rawHeading: normalizeLine(line) }))
  .filter(({ line, rawHeading }) => line <= indexLineIndex && headingPattern.test(rawHeading));
if (headings.length !== 42) throw new Error(`Expected 42 chapter headings; found ${headings.length}.`);

const parsedChapters = headings.map((heading, index) => {
  const sourceLineStart = heading.line;
  const sourceLineEnd = index + 1 < headings.length ? headings[index + 1].line - 1 : indexLineIndex;
  const exactText = lines.slice(sourceLineStart - 1, sourceLineEnd).join("\n").trim();
  const readableText = exactText
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{4,}/g, "\n\n\n");
  return {
    chapter: index + 1,
    sourceLineStart,
    sourceLineEnd,
    readableText,
    sha256: createHash("sha256").update(exactText).digest("hex"),
  };
});

const rows = JSON.parse(await readFile(importPath, "utf8"));
const changed = [];
for (const chapter of targetChapters) {
  const matchingRows = rows.filter(
    (row) => row.resource_title === "The Pulpit Commentary" && row.book === "Job" && row.chapter === chapter,
  );
  if (matchingRows.length !== 1) throw new Error(`Expected one Pulpit Job ${chapter} row; found ${matchingRows.length}.`);

  const row = matchingRows[0];
  if (String(row.entry_text ?? "").length >= 100) {
    throw new Error(`Refusing to replace non-thin Pulpit Job ${chapter} row.`);
  }

  const parsed = parsedChapters[chapter - 1];
  if (!parsed || parsed.readableText.length < 10_000) {
    throw new Error(`Parsed Pulpit Job ${chapter} text did not pass the substantial-text gate.`);
  }

  row.entry_text = parsed.readableText;
  row.source_url = sourceUrl;
  row.public_domain_status =
    "Cornell University Library scan states that there are no known copyright restrictions in the United States on use of the text.";
  row.rights_basis =
    "Public-domain historical volume from the unrestricted Cornell University Library and Internet Archive scan cu31924101104986; preserve source attribution and OCR provenance.";
  row.review_batch = "Pulpit Job Cornell Thin-Source Repair";
  row.review_notes =
    "Replaced a heading-only fallback with source-traceable Cornell OCR. Source wording is preserved; only trailing whitespace and runs of blank lines are normalized for reading.";
  row.source_line_start = parsed.sourceLineStart;
  row.source_line_end = parsed.sourceLineEnd;
  row.source_text_sha256 = parsed.sha256;
  changed.push({
    chapter,
    characters: parsed.readableText.length,
    source_line_start: parsed.sourceLineStart,
    source_line_end: parsed.sourceLineEnd,
    source_text_sha256: parsed.sha256,
  });
}

if (writeChanges) await writeFile(importPath, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`${writeChanges ? "Repaired" : "Dry-run verified"} ${changed.length} Pulpit Job thin chapter rows.`);
console.table(changed);
