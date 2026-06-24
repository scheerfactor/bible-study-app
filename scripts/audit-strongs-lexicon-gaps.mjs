#!/usr/bin/env node
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const entriesPath = path.join(root, "data", "strongs", "sample-verified-strongs.json");
const lexiconBatchIndexPath = path.join(root, "data", "strongs", "lexicon-batches", "index.json");
const batchesDir = path.join(root, "data", "strongs", "mapping-batches");
const outputDir = path.join(root, "data", "strongs", "reports");
const outputJson = path.join(outputDir, "strongs-lexicon-gaps.json");
const outputMd = path.join(outputDir, "STRONGS_LEXICON_GAPS.md");
const stopWords = new Set([
  "a",
  "am",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "but",
  "by",
  "for",
  "from",
  "had",
  "hath",
  "he",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "no",
  "not",
  "now",
  "of",
  "on",
  "or",
  "that",
  "the",
  "then",
  "there",
  "these",
  "they",
  "this",
  "thou",
  "to",
  "unto",
  "was",
  "were",
  "when",
  "which",
  "who",
  "whom",
  "with",
  "ye",
  "you",
]);

function normalizeWord(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function pushLimited(list, value, limit = 12) {
  if (!value || list.includes(value) || list.length >= limit) return;
  list.push(value);
}

async function mappingFiles() {
  const files = await readdir(batchesDir);
  return files
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => path.join(batchesDir, file));
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function lexiconEntries() {
  const baseEntries = await readJson(entriesPath, []);
  const batchIndex = await readJson(lexiconBatchIndexPath, { files: [] });
  const batchFiles = Array.isArray(batchIndex.files) ? batchIndex.files : [];
  const entriesByNumber = new Map();
  for (const entry of baseEntries) {
    if (entry?.strongs_number && !entriesByNumber.has(entry.strongs_number)) {
      entriesByNumber.set(entry.strongs_number, entry);
    }
  }
  for (const file of batchFiles) {
    const rows = await readJson(path.join(root, file), []);
    for (const entry of Array.isArray(rows) ? rows : []) {
      if (entry?.strongs_number && !entriesByNumber.has(entry.strongs_number)) {
        entriesByNumber.set(entry.strongs_number, entry);
      }
    }
  }
  return [...entriesByNumber.values()];
}

async function main() {
  const [entries, files] = await Promise.all([lexiconEntries(), mappingFiles()]);
  const verifiedNumbers = new Set(entries.filter((entry) => entry.review_status === "Verified").map((entry) => entry.strongs_number));
  const gaps = new Map();
  const covered = new Map();
  let rows = 0;
  let verifiedMappingRows = 0;

  for (const file of files) {
    const mappings = JSON.parse(await readFile(file, "utf8"));
    for (const mapping of mappings) {
      rows += 1;
      if (mapping.review_status !== "Verified") continue;
      verifiedMappingRows += 1;
      const number = mapping.strongs_number;
      const target = verifiedNumbers.has(number) ? covered : gaps;
      const record = target.get(number) ?? {
        strongs_number: number,
        language: String(number).startsWith("H") ? "Hebrew/Aramaic" : "Greek",
        mapping_rows: 0,
        verses: new Set(),
        books: new Set(),
        words: new Map(),
        examples: [],
      };
      record.mapping_rows += 1;
      if (mapping.verse_ref) {
        record.verses.add(mapping.verse_ref);
        const bookMatch = String(mapping.verse_ref).match(/^(.+) \d+:\d+$/);
        if (bookMatch) record.books.add(bookMatch[1]);
      }
      const word = normalizeWord(mapping.kjv_word || mapping.normalized_kjv_word);
      if (word) record.words.set(word, (record.words.get(word) ?? 0) + 1);
      pushLimited(record.examples, `${mapping.verse_ref} "${mapping.kjv_word}"`);
      target.set(number, record);
    }
  }

  function serialize(record) {
    const commonWords = [...record.words.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
    const study_word_rows = [...record.words.entries()]
      .filter(([word]) => !stopWords.has(word))
      .reduce((sum, [, count]) => sum + count, 0);
    return {
      strongs_number: record.strongs_number,
      language: record.language,
      mapping_rows: record.mapping_rows,
      study_word_rows,
      verses: record.verses.size,
      books: record.books.size,
      common_words: commonWords,
      examples: record.examples,
    };
  }

  const missing = [...gaps.values()]
    .map(serialize)
    .sort((a, b) => b.mapping_rows - a.mapping_rows || a.strongs_number.localeCompare(b.strongs_number, undefined, { numeric: true }));
  const coveredRows = [...covered.values()].reduce((sum, record) => sum + record.mapping_rows, 0);
  const missingRows = missing.reduce((sum, record) => sum + record.mapping_rows, 0);
  const report = {
    generated_at: new Date().toISOString(),
    source: "data/strongs/mapping-batches/*.json",
    lexicon_source: "data/strongs/sample-verified-strongs.json + data/strongs/lexicon-batches/index.json",
    totals: {
      mapping_files: files.length,
      mapping_rows: rows,
      verified_mapping_rows: verifiedMappingRows,
      verified_lexicon_entries: verifiedNumbers.size,
      missing_lexicon_numbers: missing.length,
      covered_mapping_rows: coveredRows,
      missing_mapping_rows: missingRows,
      covered_mapping_row_percent: verifiedMappingRows ? Math.round((coveredRows / verifiedMappingRows) * 1000) / 10 : 0,
    },
    next_review_batch: missing.slice(0, 75),
    study_value_batch: missing
      .filter((item) => item.study_word_rows > 0)
      .sort((a, b) => b.study_word_rows - a.study_word_rows || b.mapping_rows - a.mapping_rows || a.strongs_number.localeCompare(b.strongs_number, undefined, { numeric: true }))
      .slice(0, 75),
    missing_top_500: missing.slice(0, 500),
  };

  const md = `# Strong's Lexicon Gap Report

Generated: ${report.generated_at}

This report ranks Strong's numbers that appear in reviewed KJV word mappings but do not yet have verified lexicon cards.

## Summary

| Metric | Count |
| --- | ---: |
| Mapping files | ${report.totals.mapping_files.toLocaleString()} |
| Verified mapping rows | ${report.totals.verified_mapping_rows.toLocaleString()} |
| Verified lexicon entries | ${report.totals.verified_lexicon_entries.toLocaleString()} |
| Missing lexicon numbers | ${report.totals.missing_lexicon_numbers.toLocaleString()} |
| Mapping rows with lexicon cards | ${report.totals.covered_mapping_rows.toLocaleString()} |
| Mapping rows missing lexicon cards | ${report.totals.missing_mapping_rows.toLocaleString()} |
| Mapping-row definition coverage | ${report.totals.covered_mapping_row_percent}% |

## Next Review Batch

These are the highest-impact missing cards to verify first.

| Strong's | Language | Rows | Verses | Books | Common KJV words | Examples |
| --- | --- | ---: | ---: | ---: | --- | --- |
${report.next_review_batch
  .slice(0, 40)
  .map(
    (item) =>
      `| ${item.strongs_number} | ${item.language} | ${item.mapping_rows.toLocaleString()} | ${item.verses.toLocaleString()} | ${item.books.toLocaleString()} | ${item.common_words.map((word) => `${word.word} (${word.count})`).join(", ")} | ${item.examples.slice(0, 3).join("; ")} |`,
  )
  .join("\n")}

## Study-Value Batch

This list de-emphasizes common function words and prioritizes entries likely to matter more in Word Connection Mode, Passage Guide, and preaching/teaching study.

| Strong's | Language | Study-word rows | Total rows | Common KJV words | Examples |
| --- | --- | ---: | ---: | --- | --- |
${report.study_value_batch
  .slice(0, 40)
  .map(
    (item) =>
      `| ${item.strongs_number} | ${item.language} | ${item.study_word_rows.toLocaleString()} | ${item.mapping_rows.toLocaleString()} | ${item.common_words.map((word) => `${word.word} (${word.count})`).join(", ")} | ${item.examples.slice(0, 3).join("; ")} |`,
  )
  .join("\n")}

## Review Rules

- Do not import definitions from a modern digital dataset unless its license is documented.
- Prefer a public-domain Strong's source scan or a rights-cleared lexicon source.
- Keep entries plain-English and useful for KJV readers.
- Every new card must include source URL, rights status, and review status.
`;

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(outputMd, md);

  console.log("Strong's lexicon gap audit complete");
  console.table(report.totals);
  console.log(`Wrote ${path.relative(root, outputJson)}`);
  console.log(`Wrote ${path.relative(root, outputMd)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
