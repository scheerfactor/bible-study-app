import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const appPath = "src/app/page.tsx";
const websterPath = "data/generated/websters-1828.entries.json";
const websterOverridesPath = "data/generated/websters-1828-reviewed-overrides.json";
const reportJsonPath = "data/reports/dictionary-coverage-audit.json";
const reportMdPath = "data/reports/DICTIONARY_COVERAGE_AUDIT.md";

const referenceTools = [
  {
    id: "easton",
    label: "Easton's Bible Dictionary",
    path: "data/library/verified/eastons-bible-dictionary.txt",
  },
  {
    id: "smith",
    label: "Smith's Comprehensive Dictionary of the Bible",
    path: "data/library/verified/smiths-comprehensive-dictionary-of-the-bible.txt",
  },
  {
    id: "nave",
    label: "Nave's Topical Bible",
    path: "data/library/verified/naves-topical-bible.txt",
  },
];

const priorityWords = [
  "believe",
  "faith",
  "grace",
  "prayer",
  "judgment",
  "repentance",
  "salvation",
  "mercy",
  "covenant",
  "holy",
  "sanctification",
  "truth",
  "law",
  "shepherd",
  "prophecy",
  "vision",
  "transgression",
  "Zion",
];

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

async function readJson(path, fallback = []) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

function extractAppStudyWords(source) {
  const words = [];

  for (const match of source.matchAll(/websterWords:\s*\[([^\]]+)\]/g)) {
    for (const word of match[1].matchAll(/"([^"]+)"/g)) words.push(word[1]);
  }

  for (const match of source.matchAll(/websterWord:\s*"([^"]+)"/g)) {
    words.push(match[1]);
  }

  for (const word of priorityWords) words.push(word);

  return uniqueSorted(words.map((word) => normalize(word)));
}

function textHasTerm(text, term) {
  const normalizedTerm = normalize(term);
  if (!normalizedTerm) return false;

  const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 1000) / 10;
}

const appSource = await readFile(appPath, "utf8");
const studyWords = extractAppStudyWords(appSource);

const websterEntries = await readJson(websterPath, []);
const websterOverrides = await readJson(websterOverridesPath, []);
const websterHeadwords = new Set([...websterOverrides, ...websterEntries].map((entry) => normalize(entry.normalized_headword ?? entry.headword)));

const toolTexts = {};
for (const tool of referenceTools) {
  try {
    toolTexts[tool.id] = normalize(await readFile(tool.path, "utf8"));
  } catch {
    toolTexts[tool.id] = "";
  }
}

const rows = studyWords.map((word) => {
  const tools = Object.fromEntries(referenceTools.map((tool) => [tool.id, textHasTerm(toolTexts[tool.id], word)]));
  return {
    word,
    webster: websterHeadwords.has(word),
    ...tools,
  };
});

const summary = {
  checked_at: new Date().toISOString(),
  study_word_count: rows.length,
  webster_exact_matches: rows.filter((row) => row.webster).length,
  easton_text_matches: rows.filter((row) => row.easton).length,
  smith_text_matches: rows.filter((row) => row.smith).length,
  nave_text_matches: rows.filter((row) => row.nave).length,
  webster_coverage_percent: percent(rows.filter((row) => row.webster).length, rows.length),
  easton_text_coverage_percent: percent(rows.filter((row) => row.easton).length, rows.length),
  smith_text_coverage_percent: percent(rows.filter((row) => row.smith).length, rows.length),
  nave_text_coverage_percent: percent(rows.filter((row) => row.nave).length, rows.length),
};

const missing = {
  webster: rows.filter((row) => !row.webster).map((row) => row.word),
  easton: rows.filter((row) => !row.easton).map((row) => row.word),
  smith: rows.filter((row) => !row.smith).map((row) => row.word),
  nave: rows.filter((row) => !row.nave).map((row) => row.word),
};

const report = {
  summary,
  source_files: {
    app: appPath,
    webster: websterPath,
    webster_overrides: websterOverridesPath,
    easton: referenceTools[0].path,
    smith: referenceTools[1].path,
    nave: referenceTools[2].path,
  },
  rows,
  missing,
};

await mkdir(dirname(reportJsonPath), { recursive: true });
await writeFile(reportJsonPath, JSON.stringify(report, null, 2) + "\n");

const md = [
  "# Dictionary Coverage Audit",
  "",
  `Generated: ${summary.checked_at}`,
  "",
  "This report checks the app's common study words against the structured Webster 1828 data and text-searchable Easton, Smith, and Nave resources. Easton/Smith/Nave are not yet parsed into normalized dictionary entries, so their matches are text-presence checks.",
  "",
  "## Summary",
  "",
  `- Study words checked: ${summary.study_word_count}`,
  `- Webster exact coverage: ${summary.webster_exact_matches}/${summary.study_word_count} (${summary.webster_coverage_percent}%)`,
  `- Easton text coverage: ${summary.easton_text_matches}/${summary.study_word_count} (${summary.easton_text_coverage_percent}%)`,
  `- Smith text coverage: ${summary.smith_text_matches}/${summary.study_word_count} (${summary.smith_text_coverage_percent}%)`,
  `- Nave text coverage: ${summary.nave_text_matches}/${summary.study_word_count} (${summary.nave_text_coverage_percent}%)`,
  "",
  "## Webster Missing Exact Headwords",
  "",
  missing.webster.length ? missing.webster.map((word) => `- ${word}`).join("\n") : "- None",
  "",
  "## Next Work",
  "",
  "- Parse Easton, Smith, and Nave into normalized headword/topic indexes.",
  "- Add reviewed aliases for KJV forms that point to existing dictionary headwords.",
  "- Keep Webster overlays small and reviewed; do not use OCR guesses for doctrine-critical definitions.",
  "",
  "## Coverage Rows",
  "",
  "| Word | Webster | Easton text | Smith text | Nave text |",
  "| --- | --- | --- | --- | --- |",
  ...rows.map((row) => `| ${row.word} | ${row.webster ? "yes" : "no"} | ${row.easton ? "yes" : "no"} | ${row.smith ? "yes" : "no"} | ${row.nave ? "yes" : "no"} |`),
  "",
].join("\n");

await writeFile(reportMdPath, md);

console.log(`Dictionary coverage audit complete: ${summary.study_word_count} study words checked.`);
console.log(`Webster exact coverage: ${summary.webster_exact_matches}/${summary.study_word_count} (${summary.webster_coverage_percent}%)`);
console.log(`Reports written: ${reportJsonPath}, ${reportMdPath}`);
