import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const appPath = "src/app/page.tsx";
const eastonPath = "data/library/verified/eastons-bible-dictionary.txt";
const smithPath = "data/library/verified/smiths-comprehensive-dictionary-of-the-bible.txt";
const navePath = "data/library/verified/naves-topical-bible.txt";

const eastonOutPath = "data/generated/eastons-bible-dictionary.entries.json";
const studyIndexOutPath = "data/generated/bible-reference-study-word-index.json";
const reportJsonPath = "data/reports/bible-dictionary-indexes.json";
const reportMdPath = "data/reports/BIBLE_DICTIONARY_INDEXES.md";

const priorityWords = [
  "aaron",
  "abraham",
  "believe",
  "covenant",
  "faith",
  "grace",
  "holy",
  "jesus",
  "judgment",
  "kingdom",
  "law",
  "mercy",
  "moses",
  "prayer",
  "repentance",
  "salvation",
  "sanctification",
  "shepherd",
  "truth",
  "vision",
  "zion",
];

const sourceMetadata = {
  easton: {
    title: "Easton's Bible Dictionary",
    source_file: eastonPath,
    rights_status: "public_domain",
    review_status: "parsed_from_verified_public_domain_text",
  },
  smith: {
    title: "Smith's Comprehensive Dictionary of the Bible",
    source_file: smithPath,
    rights_status: "public_domain",
    review_status: "ocr_text_index_needs_article_split_review",
  },
  nave: {
    title: "Nave's Topical Bible",
    source_file: navePath,
    rights_status: "public_domain",
    review_status: "ocr_text_index_needs_topic_split_review",
  },
};

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
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

function isEastonHeading(line) {
  if (!/^   \S/.test(line) || /^ {4,}\S/.test(line)) return false;

  const heading = line.trim();
  if (!heading || heading.length > 70) return false;
  if (/[.;,]$/.test(heading)) return false;
  if (!/^[A-Z][A-Za-z0-9 .,'’:-]+$/.test(heading)) return false;
  if (/^(Easton's Bible Dictionary|Illustrated Bible Dictionary)$/i.test(heading)) return false;

  return true;
}

function parseEaston(raw) {
  const lines = raw.split(/\r?\n/);
  const entries = [];
  let current = null;
  let started = false;

  function flush(endLine) {
    if (!current) return;

    const definition = cleanText(current.body.join("\n"));
    if (definition.length >= 40) {
      entries.push({
        headword: current.headword,
        normalized_headword: normalize(current.headword),
        definition,
        source: sourceMetadata.easton.title,
        source_file: eastonPath,
        rights_status: sourceMetadata.easton.rights_status,
        review_status: sourceMetadata.easton.review_status,
        line_start: current.line_start,
        line_end: endLine,
      });
    }
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineNumber = index + 1;

    if (!started && /^   A$/.test(line)) started = true;
    if (!started) continue;

    if (isEastonHeading(line)) {
      flush(lineNumber - 1);
      current = {
        headword: line.trim(),
        line_start: lineNumber,
        body: [],
      };
      continue;
    }

    if (current) current.body.push(line.trimEnd());
  }

  flush(lines.length);

  const seen = new Map();
  for (const entry of entries) {
    const existing = seen.get(entry.normalized_headword);
    if (!existing || entry.definition.length > existing.definition.length) {
      seen.set(entry.normalized_headword, entry);
    }
  }

  return [...seen.values()].sort((a, b) => a.normalized_headword.localeCompare(b.normalized_headword));
}

function containsTerm(line, term) {
  const normalizedLine = normalize(line);
  const normalizedTerm = normalize(term);
  if (!normalizedLine || !normalizedTerm) return false;

  const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\s)${escaped}(\\s|$)`, "i").test(normalizedLine);
}

function buildTextEvidenceIndex(raw, terms, sourceId, skipLines = 0) {
  const lines = raw.split(/\r?\n/);
  const rows = [];

  for (const term of terms) {
    const matches = [];
    for (let index = skipLines; index < lines.length && matches.length < 6; index += 1) {
      if (!containsTerm(lines[index], term)) continue;

      const start = Math.max(skipLines, index - 2);
      const end = Math.min(lines.length - 1, index + 4);
      const snippet = cleanText(lines.slice(start, end + 1).join("\n"));

      matches.push({
        line_start: start + 1,
        line_end: end + 1,
        snippet,
      });
    }

    rows.push({
      term,
      normalized_term: normalize(term),
      source: sourceMetadata[sourceId].title,
      source_file: sourceMetadata[sourceId].source_file,
      rights_status: sourceMetadata[sourceId].rights_status,
      review_status: sourceMetadata[sourceId].review_status,
      match_count_sampled: matches.length,
      matches,
    });
  }

  return rows;
}

function summarizeStudyIndex(studyIndex) {
  const summary = {};
  for (const [sourceId, rows] of Object.entries(studyIndex)) {
    const hasMatch = (row) => (Array.isArray(row.matches) ? row.matches.length > 0 : Boolean(row.exact_entry));
    summary[sourceId] = {
      source: sourceMetadata[sourceId].title,
      indexed_terms: rows.length,
      terms_with_matches: rows.filter(hasMatch).length,
      terms_without_matches: rows.filter((row) => !hasMatch(row)).map((row) => row.term),
    };
  }
  return summary;
}

const appSource = await readFile(appPath, "utf8");
const [eastonRaw, smithRaw, naveRaw] = await Promise.all([
  readFile(eastonPath, "utf8"),
  readFile(smithPath, "utf8"),
  readFile(navePath, "utf8"),
]);

const studyWords = extractAppStudyWords(appSource);
const eastonEntries = parseEaston(eastonRaw);
const eastonByHeadword = new Map(eastonEntries.map((entry) => [entry.normalized_headword, entry]));

const eastonStudyRows = studyWords.map((term) => {
  const exact = eastonByHeadword.get(term);
  return {
    term,
    normalized_term: term,
    source: sourceMetadata.easton.title,
    source_file: eastonPath,
    rights_status: sourceMetadata.easton.rights_status,
    review_status: sourceMetadata.easton.review_status,
    exact_entry: Boolean(exact),
    entry: exact
      ? {
          headword: exact.headword,
          line_start: exact.line_start,
          line_end: exact.line_end,
          definition_preview: exact.definition.slice(0, 600),
        }
      : null,
  };
});

const studyIndex = {
  easton: eastonStudyRows,
  smith: buildTextEvidenceIndex(smithRaw, studyWords, "smith", 450),
  nave: buildTextEvidenceIndex(naveRaw, studyWords, "nave", 590),
};

const summary = {
  generated_at: new Date().toISOString(),
  study_word_count: studyWords.length,
  easton_entry_count: eastonEntries.length,
  easton_exact_study_word_matches: eastonStudyRows.filter((row) => row.exact_entry).length,
  study_index: summarizeStudyIndex(studyIndex),
};

const report = {
  summary,
  source_files: {
    app: appPath,
    easton: eastonPath,
    smith: smithPath,
    nave: navePath,
  },
  output_files: {
    easton_entries: eastonOutPath,
    study_word_index: studyIndexOutPath,
  },
  notes: [
    "Easton is parsed into normalized entries because the source has reliable single-column headword structure.",
    "Smith and Nave are currently indexed by study-word evidence windows because the available texts are OCR-heavy and need article/topic split review before public-facing article parsing.",
    "These indexes are source-backed and rights-safe; they are not doctrine-generated summaries.",
  ],
};

await mkdir(dirname(eastonOutPath), { recursive: true });
await mkdir(dirname(reportJsonPath), { recursive: true });
await writeFile(eastonOutPath, JSON.stringify(eastonEntries, null, 2) + "\n");
await writeFile(studyIndexOutPath, JSON.stringify(studyIndex, null, 2) + "\n");
await writeFile(reportJsonPath, JSON.stringify(report, null, 2) + "\n");

const md = [
  "# Bible Dictionary Resource Indexes",
  "",
  `Generated: ${summary.generated_at}`,
  "",
  "This build creates source-backed lookup indexes for the public-domain Bible reference tools already in the app.",
  "",
  "## Summary",
  "",
  `- Study words indexed: ${summary.study_word_count}`,
  `- Easton normalized entries: ${summary.easton_entry_count}`,
  `- Easton exact study-word matches: ${summary.easton_exact_study_word_matches}/${summary.study_word_count}`,
  `- Smith study-word evidence matches: ${summary.study_index.smith.terms_with_matches}/${summary.study_word_count}`,
  `- Nave study-word evidence matches: ${summary.study_index.nave.terms_with_matches}/${summary.study_word_count}`,
  "",
  "## Output Files",
  "",
  `- \`${eastonOutPath}\``,
  `- \`${studyIndexOutPath}\``,
  `- \`${reportJsonPath}\``,
  "",
  "## Review Notes",
  "",
  "- Easton is parsed into normalized entries because its headword structure is reliable.",
  "- Smith and Nave remain evidence indexes for now. Their OCR text should be cleaned before treating article/topic splits as finished.",
  "- All entries keep source files, rights status, and review status so these can be safely wired into the Bible Tools Hub later.",
  "",
  "## Smith Missing Study Words",
  "",
  summary.study_index.smith.terms_without_matches.length
    ? summary.study_index.smith.terms_without_matches.map((term) => `- ${term}`).join("\n")
    : "- None",
  "",
  "## Nave Missing Study Words",
  "",
  summary.study_index.nave.terms_without_matches.length
    ? summary.study_index.nave.terms_without_matches.map((term) => `- ${term}`).join("\n")
    : "- None",
  "",
].join("\n");

await writeFile(reportMdPath, md);

console.log(`Dictionary resource indexes built.`);
console.log(`Easton entries: ${summary.easton_entry_count}`);
console.log(`Study words: ${summary.study_word_count}`);
console.log(`Reports written: ${reportMdPath}`);
