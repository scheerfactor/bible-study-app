#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sourceUrl = "https://archive.org/download/cu31924101104986/cu31924101104986_djvu.txt";
const outputPath = "data/commentary/reports/pulpit-job-cornell-parser-audit.json";
const localSourcePath = process.argv[2];

const sourceText = localSourcePath
  ? await readFile(localSourcePath, "utf8")
  : await fetch(sourceUrl).then((response) => {
      if (!response.ok) throw new Error(`Pulpit Job OCR download failed: ${response.status}`);
      return response.text();
    });

const lines = sourceText.split(/\r?\n/);
const headingPattern = /^(?:CH|OH|r\s+)APT[A-Z]+\s+[A-ZnrTvL]+\.?$/i;
const normalizeLine = (line) => line.trim().replace(/\s+/g, " ");

const headingCandidates = lines
  .map((line, index) => ({ line: index + 1, raw_heading: normalizeLine(line) }))
  .filter(({ raw_heading }) => headingPattern.test(raw_heading));

const firstHeading = headingCandidates[0];
if (!firstHeading) throw new Error("No chapter heading was found in the Pulpit Job OCR.");

const indexLineIndex = lines.findIndex(
  (line, index) =>
    index + 1 > firstHeading.line && /^HOMILETICAL\s+INDEX(?:\.|$)/i.test(normalizeLine(line)),
);
if (indexLineIndex < 0) throw new Error("The post-commentary homiletical index boundary was not found.");

const indexLine = indexLineIndex + 1;
const chapterHeadings = headingCandidates.filter(({ line }) => line < indexLine);
if (chapterHeadings.length !== 42) {
  throw new Error(`Expected 42 Job chapter headings before the index; found ${chapterHeadings.length}.`);
}

const chapters = chapterHeadings.map((heading, index) => {
  const startLine = heading.line;
  const endLine = index + 1 < chapterHeadings.length ? chapterHeadings[index + 1].line - 1 : indexLine - 1;
  const text = lines.slice(startLine - 1, endLine).join("\n").trim();
  return {
    chapter: index + 1,
    raw_heading: heading.raw_heading,
    source_line_start: startLine,
    source_line_end: endLine,
    characters: text.length,
    sha256: createHash("sha256").update(text).digest("hex"),
  };
});

const shortChapters = chapters.filter(({ characters }) => characters < 10_000);
const overlappingRanges = chapters.filter(
  (chapter, index) => index > 0 && chapter.source_line_start <= chapters[index - 1].source_line_end,
);
if (shortChapters.length) {
  throw new Error(`Substantial-text gate failed for chapters: ${shortChapters.map(({ chapter }) => chapter).join(", ")}`);
}
if (overlappingRanges.length) throw new Error("One or more parsed chapter ranges overlap.");

const report = {
  audit_date: new Date().toISOString().slice(0, 10),
  resource_title: "The Pulpit Commentary",
  bible_book: "Job",
  archive_identifier: "cu31924101104986",
  source_url: sourceUrl,
  local_source_path: localSourcePath ?? null,
  source_bytes: Buffer.byteLength(sourceText),
  source_sha256: createHash("sha256").update(sourceText).digest("hex"),
  index_line: indexLine,
  chapter_count: chapters.length,
  all_chapters_substantial: true,
  ranges_overlap: false,
  parser_status: "Verified for staged replacement preparation; no commentary rows written.",
  normalization_policy:
    "The audit preserves source text exactly. Only line ending boundaries and heading whitespace are normalized in report metadata.",
  chapters,
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Pulpit Job parser audit passed: ${chapters.length} chapters, index begins at line ${indexLine}.`);
console.log(`Report: ${outputPath}`);
