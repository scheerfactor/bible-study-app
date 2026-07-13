#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import verses1769 from "es-kjv/json/verses-1769.js";

const importDirectory = "data/imports";
const reportPath = "data/commentary/reports/major-commentary-family-coverage-audit.json";
const dashboardPath = "data/commentary/reports/commentary-family-coverage-dashboard.json";
const newTestamentBooks = new Set([
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians",
  "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter",
  "1 John", "2 John", "3 John", "Jude", "Revelation",
]);
const families = [
  { name: "The Pulpit Commentary", titles: ["The Pulpit Commentary"], scope: "Whole Bible" },
  { name: "The Biblical Illustrator", titles: ["The Biblical Illustrator"], scope: "Whole Bible" },
  { name: "Poole's English Annotations on the Holy Bible", titles: ["Poole's English Annotations on the Holy Bible"], scope: "Whole Bible" },
  { name: "Adam Clarke's Commentary on the Bible", titles: ["Adam Clarke's Commentary on the Bible"], scope: "Whole Bible" },
  { name: "Barnes' Notes on the Bible", titles: ["Barnes' Notes on the Bible"], scope: "Whole Bible" },
  {
    name: "Commentary Critical and Explanatory on the Whole Bible",
    titles: ["Commentary Critical and Explanatory on the Whole Bible", "Commentary Critical and Explanatory on the Whole Bible - Unabridged"],
    scope: "Whole Bible",
  },
  { name: "Morgan's Exposition on the Whole Bible", titles: ["Morgan's Exposition on the Whole Bible"], scope: "Whole Bible" },
  { name: "Matthew Henry's Commentary on the Whole Bible", titles: ["Matthew Henry's Commentary on the Whole Bible"], scope: "Whole Bible" },
  {
    name: "Wesley's Notes on the Bible / Wesley's Explanatory Notes on the Whole Bible",
    titles: ["Wesley's Notes on the Bible", "Wesley's Explanatory Notes on the Whole Bible"],
    scope: "Whole Bible",
  },
  { name: "American Commentary on the New Testament", titles: ["American Commentary on the New Testament"], scope: "New Testament" },
];

const canon = new Set();
for (const reference of Object.keys(verses1769)) {
  const match = reference.match(/^(.+) (\d+):\d+$/);
  if (match) canon.add(`${match[1]} ${Number(match[2])}`);
}
const expectedFor = (scope) =>
  new Set([...canon].filter((reference) => scope === "Whole Bible" || newTestamentBooks.has(reference.replace(/ \d+$/, ""))));

const files = (await readdir(importDirectory)).filter((name) => name.endsWith(".json")).sort();
const entries = [];
for (const file of files) {
  try {
    const payload = JSON.parse(await readFile(path.join(importDirectory, file), "utf8"));
    if (Array.isArray(payload)) entries.push(...payload.map((entry) => ({ ...entry, source_file: file })));
  } catch {
    // Non-commentary JSON files are ignored by this focused audit.
  }
}

function isPublicImportable(entry) {
  const reviewStatus = String(entry.review_status ?? "").trim();
  return !reviewStatus || reviewStatus === "Verified";
}

const results = families.map((family) => {
  const matching = entries.filter((entry) => family.titles.includes(entry.resource_title));
  // Keep this aligned with import-commentary-entries.mjs, including older reviewed rows
  // that predate the explicit import_status field.
  const publicRows = matching.filter(isPublicImportable);
  const expected = expectedFor(family.scope);
  const covered = new Set(
    publicRows
      .map((entry) => `${entry.book} ${Number(entry.chapter)}`)
      .filter((reference) => expected.has(reference)),
  );
  const publicRowsByChapter = publicRows.reduce((groups, entry) => {
    const reference = `${entry.book} ${Number(entry.chapter)}`;
    const key = `${entry.resource_title}|${reference}`;
    (groups[key] ??= []).push(entry);
    return groups;
  }, {});
  const duplicatePublicChapters = Object.entries(publicRowsByChapter)
    .filter(([, rows]) => rows.length > 1)
    .map(([key, rows]) => ({
      resource_title: rows[0]?.resource_title ?? key.split("|", 1)[0],
      reference: `${rows[0]?.book} ${Number(rows[0]?.chapter)}`,
      rows: rows.length,
      source_files: [...new Set(rows.map((entry) => entry.source_file))],
    }));
  const missing = [...expected].filter((reference) => !covered.has(reference));
  const stagedRows = matching.filter((entry) => !isPublicImportable(entry));
  const staged = stagedRows.map((entry) => entry.reference).filter(Boolean);
  return {
    resource_title: family.name,
    scope: family.scope,
    covered_chapters: covered.size,
    expected_chapters: expected.size,
    coverage_percent: Math.round((covered.size / expected.size) * 1000) / 10,
    missing_chapters: missing,
    missing_details: missing.map((reference) => {
      const stagedEntry = stagedRows.find((entry) => entry.reference === reference);
      return {
        reference,
        review_status: stagedEntry?.review_status ?? null,
        import_status: stagedEntry?.import_status ?? null,
        source_recovery_status: stagedEntry?.source_recovery_status ?? null,
        review_notes: stagedEntry?.review_notes ?? null,
        source_file: stagedEntry?.source_file ?? null,
      };
    }),
    staged_chapters: [...new Set(staged)].sort(),
    duplicate_public_chapters: duplicatePublicChapters,
    public_source_file_count: new Set(publicRows.map((entry) => entry.source_file)).size,
  };
});

const report = {
  audited_at: new Date().toISOString(),
  review_status: "public_verified_coverage_audit_complete",
  method:
    "Compared rows accepted by the commentary importer against the 1,189 KJV chapters. Staged, quarantined, and needs-review rows do not count as reader coverage; legacy reviewed rows without a review_status remain importable by design.",
  duplicate_safety_note:
    "Duplicate checks are scoped to the same displayed resource title and chapter. Distinct named editions such as standard and unabridged JFB are not treated as duplicates. Do not add chapter rows merely to increase counts; restore a gap only from the exact verified public-domain work with chapter-level provenance.",
  duplicate_public_chapter_keys: results.reduce(
    (total, family) => total + family.duplicate_public_chapters.length,
    0,
  ),
  complete_families: results.filter((family) => family.missing_chapters.length === 0),
  incomplete_families: results.filter((family) => family.missing_chapters.length > 0),
};
const dashboard = {
  generated_at: report.audited_at,
  canon_chapters: canon.size,
  counting_rule: "Public Verified rows only; staged rows are shown as gaps.",
  families: Object.fromEntries(results.map((family) => [family.resource_title, family])),
};

await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
await writeFile(dashboardPath, `${JSON.stringify(dashboard, null, 2)}\n`);

console.log("Major commentary family coverage audit complete.");
console.table(
  results.map((family) => ({
    family: family.resource_title,
    coverage: `${family.covered_chapters}/${family.expected_chapters}`,
    missing: family.missing_chapters.length,
    staged: family.staged_chapters.length,
    duplicates: family.duplicate_public_chapters.length,
  })),
);
