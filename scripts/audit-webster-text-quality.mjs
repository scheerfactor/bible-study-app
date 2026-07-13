#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const websterPath = "data/generated/websters-1828.entries.json";
const overridesPath = "data/generated/websters-1828-reviewed-overrides.json";
const reportJsonPath = "data/reports/webster-text-quality-audit.json";
const reportMdPath = "data/reports/WEBSTER_TEXT_QUALITY_AUDIT.md";

const priorityHeadwords = [
  "atonement",
  "adoption",
  "adversary",
  "amen",
  "baptism",
  "baptize",
  "believe",
  "blessing",
  "charity",
  "church",
  "christ",
  "commentary",
  "conversion",
  "convert",
  "covenant",
  "damnation",
  "dispensation",
  "eternal",
  "faith",
  "forgive",
  "grace",
  "glorification",
  "hell",
  "high-priest",
  "holy",
  "iniquity",
  "judgment",
  "justification",
  "intercessor",
  "intercession",
  "mediator",
  "mercy",
  "messiah",
  "offering",
  "ordinance",
  "prayer",
  "preach",
  "preaching",
  "prophecy",
  "propitiation",
  "reconcile",
  "repent",
  "repentance",
  "righteousness",
  "salvation",
  "sanctification",
  "sermon",
  "sin",
  "testimony",
  "text",
  "truth",
  "witness",
];

const qualityPatterns = [
  {
    id: "split_the",
    label: "Split the/that/this OCR",
    pattern: /\b(?:tlje|tlie|tliat|tliis|tliese|tliem|tliere)\b/i,
    severity: "high",
  },
  {
    id: "split_wh_words",
    label: "Split wh- words",
    pattern: /\b(?:whicli|wliich|whicb|wliat|wlio|wliere|wlieii|witli)\b/i,
    severity: "high",
  },
  {
    id: "replacement_marks",
    label: "Replacement marks or black boxes",
    pattern: /[�■]/,
    severity: "high",
  },
  {
    id: "known_common_ocr",
    label: "Known common OCR substitutions",
    pattern: /\b(?:ajie|manmr|insigniticant|trilling|liiw|aiid|aiiy|iiot|iiito|api\)ears|inijilied|peniiission)\b/i,
    severity: "medium",
  },
  {
    id: "sacred_name_spacing",
    label: "Sacred name spacing",
    pattern: /\b(?:Ood|G od|L ord|J esus|C hrist)\b/,
    severity: "medium",
  },
  {
    id: "hyphenated_scan_breaks",
    label: "Hyphenated scan line breaks",
    pattern: /[A-Za-z]{3,}-\s+[a-z]{2,}/,
    severity: "low",
  },
];

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function snippet(value, limit = 300) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

async function readJson(filePath, fallback = []) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

const baseEntries = await readJson(websterPath, []);
const reviewedOverrides = await readJson(overridesPath, []);
const reviewedHeadwords = new Set(reviewedOverrides.map((entry) => normalize(entry.normalized_headword || entry.headword)));

const rowsWithFlags = [];
const counts = Object.fromEntries(qualityPatterns.map((item) => [item.id, 0]));

for (const entry of baseEntries) {
  const flags = qualityPatterns.filter((item) => item.pattern.test(entry.definition ?? ""));
  if (!flags.length) continue;

  for (const flag of flags) counts[flag.id] += 1;

  rowsWithFlags.push({
    headword: entry.headword,
    normalized_headword: normalize(entry.normalized_headword || entry.headword),
    flags: flags.map((flag) => flag.id),
    highest_severity: flags.some((flag) => flag.severity === "high")
      ? "high"
      : flags.some((flag) => flag.severity === "medium")
        ? "medium"
        : "low",
    has_reviewed_override: reviewedHeadwords.has(normalize(entry.normalized_headword || entry.headword)),
    sample: snippet(entry.definition),
    source_line_start: entry.source_line_start,
    source_line_end: entry.source_line_end,
  });
}

const priorityRows = priorityHeadwords.map((word) => {
  const normalized = normalize(word);
  const entries = baseEntries.filter((entry) => normalize(entry.normalized_headword || entry.headword) === normalized);
  const dirtyEntries = rowsWithFlags.filter((entry) => entry.normalized_headword === normalized);
  return {
    word,
    entries: entries.length,
    flagged_entries: dirtyEntries.length,
    has_reviewed_override: reviewedHeadwords.has(normalized),
    flags: [...new Set(dirtyEntries.flatMap((entry) => entry.flags))],
    sample: dirtyEntries[0]?.sample ?? snippet(entries[0]?.definition ?? ""),
  };
});

const highPriorityCleanup = rowsWithFlags
  .filter((entry) => entry.highest_severity !== "low" && !entry.has_reviewed_override)
  .sort((a, b) => {
    const severityRank = { high: 0, medium: 1, low: 2 };
    return severityRank[a.highest_severity] - severityRank[b.highest_severity] || a.headword.localeCompare(b.headword);
  })
  .slice(0, 80);

const summary = {
  generated_at: new Date().toISOString(),
  base_entries: baseEntries.length,
  reviewed_overrides: reviewedOverrides.length,
  entries_with_quality_flags: rowsWithFlags.length,
  entries_with_high_or_medium_flags: rowsWithFlags.filter((entry) => entry.highest_severity !== "low").length,
  pattern_counts: counts,
};

await mkdir(path.dirname(reportJsonPath), { recursive: true });
await writeFile(
  reportJsonPath,
  `${JSON.stringify(
    {
      summary,
      patterns: qualityPatterns.map((item) => ({
        id: item.id,
        label: item.label,
        severity: item.severity,
      })),
      priority_words: priorityRows,
      high_priority_cleanup: highPriorityCleanup,
    },
    null,
    2,
  )}\n`,
);

const md = [
  "# Webster 1828 Text Quality Audit",
  "",
  `Generated: ${summary.generated_at}`,
  "",
  "This audit looks for scan/OCR patterns in the structured Webster 1828 data. It does not change Webster's wording. It helps us decide which entries need reviewed overlays or safe display-time cleanup before users rely on them for Bible study.",
  "",
  "## Summary",
  "",
  `- Webster base entries: ${summary.base_entries.toLocaleString()}`,
  `- Reviewed overlays: ${summary.reviewed_overrides.toLocaleString()}`,
  `- Entries with any quality flag: ${summary.entries_with_quality_flags.toLocaleString()}`,
  `- Entries with high/medium quality flags: ${summary.entries_with_high_or_medium_flags.toLocaleString()}`,
  "",
  "## Pattern Counts",
  "",
  "| Pattern | Severity | Entries |",
  "| --- | --- | ---: |",
  ...qualityPatterns.map((item) => `| ${item.label} | ${item.severity} | ${(counts[item.id] ?? 0).toLocaleString()} |`),
  "",
  "## Priority Doctrine And Study Words",
  "",
  "| Word | Entries | Flagged | Reviewed overlay | Flags |",
  "| --- | ---: | ---: | --- | --- |",
  ...priorityRows.map(
    (row) =>
      `| ${row.word} | ${row.entries} | ${row.flagged_entries} | ${row.has_reviewed_override ? "yes" : "no"} | ${row.flags.join(", ") || "-"} |`,
  ),
  "",
  "## Top Cleanup Queue",
  "",
  "| Headword | Severity | Flags | Reviewed overlay | Sample |",
  "| --- | --- | --- | --- | --- |",
  ...highPriorityCleanup
    .slice(0, 40)
    .map(
      (row) =>
        `| ${row.headword} | ${row.highest_severity} | ${row.flags.join(", ")} | ${row.has_reviewed_override ? "yes" : "no"} | ${row.sample.replace(/\|/g, "/")} |`,
    ),
  "",
  "## Guardrails",
  "",
  "- Keep the original OCR file unchanged unless the source is re-imported from a better edition.",
  "- Use reviewed overlays for doctrine-sensitive headwords.",
  "- Use only conservative display cleanup for obvious OCR artifacts.",
  "- Do not invent definitions when Webster data is missing or unclear.",
  "",
].join("\n");

await writeFile(reportMdPath, `${md}\n`);

console.log("Webster text quality audit complete");
console.table({
  base_entries: summary.base_entries,
  reviewed_overrides: summary.reviewed_overrides,
  quality_flags: summary.entries_with_quality_flags,
  high_medium_flags: summary.entries_with_high_or_medium_flags,
});
console.log(`Wrote ${reportMdPath}`);
console.log(`Wrote ${reportJsonPath}`);
