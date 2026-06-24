#!/usr/bin/env node
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readJsonOrCsv } from "./import-utils.mjs";

const COMMENTARY_DIRECTORIES = ["data/imports", "data/commentary/staging"];
const REPORT_DIR = "data/commentary/reports";
const REPORT_PATH = path.join(REPORT_DIR, "COMMENTARY_TEXT_QUALITY.md");

const qualityPatterns = [
  { key: "navigation-prefix", label: "Website navigation prefix", pattern: /^(Whole Bible|Old Testament|New Testament|Individual Books|Bible Commentaries\s+Verse-by-Verse)\s/i },
  { key: "table-footer", label: "Table-of-contents footer", pattern: /\[ Table of Contents \]/i },
  { key: "previous-next-footer", label: "Previous/next footer", pattern: /\[ Previous \]|\[ Next \]/i },
  { key: "editorial-footer", label: "External editor footer", pattern: /Send Addenda, Corrigenda/i },
  { key: "source-menu", label: "Source menu text", pattern: /Choose a verse from|return to ' Top of Page '/i },
];

async function commentaryFiles() {
  const files = [];
  for (const directory of COMMENTARY_DIRECTORIES) {
    try {
      const directoryFiles = await readdir(directory);
      files.push(
        ...directoryFiles
          .filter((file) => file.endsWith(".json") && file.includes("commentary"))
          .map((file) => path.join(directory, file)),
      );
    } catch {
      // Optional staging directory may not exist in a local checkout.
    }
  }
  return files.sort();
}

function rowReference(row) {
  return row.reference || `${row.book ?? "Unknown"} ${row.chapter ?? "?"}`;
}

function findIssues(row) {
  const text = String(row.entry_text ?? "");
  const searchText = `${text.slice(0, 8000)}\n${text.slice(-1500)}`;
  return qualityPatterns.filter(({ pattern }) => pattern.test(searchText));
}

const files = await commentaryFiles();
const fileSummaries = [];
const examples = [];
let totalRows = 0;
let rowsWithIssues = 0;

for (const file of files) {
  const rows = await readJsonOrCsv(file);
  let issueCount = 0;
  const issueTypes = new Map();

  rows.forEach((row, index) => {
    totalRows += 1;
    const issues = findIssues(row);
    if (!issues.length) return;

    issueCount += 1;
    rowsWithIssues += 1;
    issues.forEach((issue) => issueTypes.set(issue.key, (issueTypes.get(issue.key) ?? 0) + 1));

    if (examples.length < 40) {
      examples.push({
        file,
        row: index + 1,
        reference: rowReference(row),
        author: row.author ?? "Unknown",
        issueLabels: issues.map((issue) => issue.label),
        preview: String(row.entry_text ?? "").slice(0, 220).replace(/\s+/g, " ").trim(),
      });
    }
  });

  if (issueCount) {
    fileSummaries.push({
      file,
      rows: rows.length,
      issueCount,
      issueTypes: Array.from(issueTypes.entries()).map(([key, count]) => ({ key, count })),
    });
  }
}

fileSummaries.sort((a, b) => b.issueCount - a.issueCount || a.file.localeCompare(b.file));

const reportLines = [
  "# Commentary Text Quality Audit",
  "",
  "This report flags imported commentary rows that likely contain website navigation, previous/next links, table-of-contents footers, or other non-commentary wrapper text. It does not prove the commentary text itself is invalid; it identifies rows that need cleanup or source review before quotation.",
  "",
  "## Summary",
  "",
  `- Commentary files scanned: ${files.length}`,
  `- Commentary rows scanned: ${totalRows}`,
  `- Rows with quality flags: ${rowsWithIssues}`,
  `- Files with quality flags: ${fileSummaries.length}`,
  "",
  "## Files With Flags",
  "",
  fileSummaries.length
    ? "| File | Flagged Rows | Total Rows | Issue Types |\n| --- | ---: | ---: | --- |\n" +
      fileSummaries
        .map((summary) => {
          const issueText = summary.issueTypes.map((issue) => `${issue.key}: ${issue.count}`).join("; ");
          return `| \`${summary.file}\` | ${summary.issueCount} | ${summary.rows} | ${issueText} |`;
        })
        .join("\n")
    : "No quality flags found.",
  "",
  "## Sample Rows",
  "",
  examples.length
    ? examples
        .map((example) => [
          `### ${example.reference} - ${example.author}`,
          "",
          `- File: \`${example.file}\``,
          `- Row: ${example.row}`,
          `- Flags: ${example.issueLabels.join(", ")}`,
          `- Preview: ${example.preview}`,
        ].join("\n"))
        .join("\n\n")
    : "No samples.",
  "",
  "## Current Mitigation",
  "",
  "The app normalizes commentary entries at load time and strips known navigation prefixes/footers from display, listening, export, and search contexts. Public import files are also cleaned when wrappers can be removed without changing commentary wording; staging files remain available for source review.",
  "",
];

await mkdir(REPORT_DIR, { recursive: true });
await writeFile(REPORT_PATH, reportLines.join("\n"), "utf8");

console.log(`Commentary text quality audit complete.`);
console.log(`Rows scanned: ${totalRows}`);
console.log(`Rows with quality flags: ${rowsWithIssues}`);
console.log(`Report: ${REPORT_PATH}`);
