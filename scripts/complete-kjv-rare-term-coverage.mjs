#!/usr/bin/env node
import { access, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import verses1769 from "es-kjv/json/verses-1769.js";

const inventoryPath = "data/reports/webster-missing-word-inventory.csv";
const entriesPath = "data/generated/kjv-rare-term-reviewed-overrides.json";
const batchPath = "data/sources/kjv-rare-terms/review-batches/kjv-rare-terms-phase-19-2026-08-26.json";

const manualEntries = {
  ancle: {
    definition: "ANCLE, noun. The ankle; the joint connecting the foot and leg. The KJV spelling appears in the phrase 'ancle bones.'",
    source_title: "KJV English Word Guide",
    source_file: "KJV: Acts 3:7",
  },
  contribution: {
    definition: "CONTRIBUTION, noun. A gift or collection given jointly for a common purpose; in Romans, relief for the poor saints at Jerusalem.",
    source_title: "KJV English Word Guide",
    source_file: "KJV: Romans 15:26",
  },
  intreaty: {
    definition: "INTREATY, noun. An earnest request, petition, or supplication.",
    source_title: "KJV English Word Guide",
    source_file: "KJV: 2 Corinthians 8:4",
  },
  pernicious: {
    definition: "PERNICIOUS, adjective. Destructive, ruinous, or causing great harm.",
    source_title: "KJV English Word Guide",
    source_file: "KJV: 2 Peter 2:2",
  },
  thankworthy: {
    definition: "THANKWORTHY, adjective. Deserving thanks or approval; acceptable before God when one patiently endures wrongful suffering for conscience toward God.",
    source_title: "KJV English Word Guide",
    source_file: "KJV: 1 Peter 2:19",
  },
};

const strongsChoices = {
  sherah: "H7609",
};

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value);
  return values;
}

function normalize(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z]/g, "");
}

function normalizeStrongNumber(value) {
  const match = String(value ?? "").match(/^([GH])0*(\d+)$/i);
  return match ? `${match[1].toUpperCase()}${Number(match[2])}` : String(value ?? "");
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

const inventoryRows = (await readFile(inventoryPath, "utf8"))
  .trim()
  .split("\n")
  .slice(1)
  .map(parseCsvLine)
  .filter((row) => row.length === 6 && !row[5])
  .map(([word, kjvCount]) => ({ word: normalize(word), kjvCount: Number(kjvCount) }));

let targets = inventoryRows;
if (!targets.length && await exists(batchPath)) {
  const priorBatch = JSON.parse(await readFile(batchPath, "utf8"));
  targets = priorBatch.entries.map((entry) => ({
    word: normalize(entry.normalized_headword || entry.headword),
    kjvCount: entry.kjv_occurrences,
  }));
}
if (!targets.length) throw new Error("No unresolved KJV forms or prior phase-19 batch were found.");

const targetWords = new Set(targets.map((target) => target.word));
const wordStats = new Map(targets.map((target) => [target.word, { count: 0, references: new Set() }]));
for (const [reference, text] of Object.entries(verses1769)) {
  for (const rawWord of String(text).match(/[A-Za-z]+(?:-[A-Za-z]+)*/g) ?? []) {
    const word = normalize(rawWord);
    if (!targetWords.has(word)) continue;
    const stat = wordStats.get(word);
    stat.count += 1;
    stat.references.add(reference);
  }
}

const mappingsByWord = new Map();
for (const file of await readdir("data/strongs/mappings-by-chapter")) {
  if (!file.endsWith(".json")) continue;
  const rows = JSON.parse(await readFile(path.join("data/strongs/mappings-by-chapter", file), "utf8"));
  if (!Array.isArray(rows)) continue;
  for (const row of rows) {
    const word = normalize(row.normalized_kjv_word || row.kjv_word);
    if (row.review_status !== "Verified" || !targetWords.has(word)) continue;
    if (!mappingsByWord.has(word)) mappingsByWord.set(word, []);
    mappingsByWord.get(word).push(row);
  }
}

const lexiconIndex = JSON.parse(await readFile("data/strongs/lexicon-batches/index.json", "utf8"));
const lexicon = new Map();
for (const file of lexiconIndex.files ?? []) {
  const rows = JSON.parse(await readFile(file, "utf8"));
  if (!Array.isArray(rows)) continue;
  for (const row of rows) lexicon.set(normalizeStrongNumber(row.strongs_number), row);
}

const storedEntries = [];
const batchEntries = [];
for (const target of targets) {
  const stat = wordStats.get(target.word);
  if (stat.count !== target.kjvCount) {
    throw new Error(`${target.word}: inventory count ${target.kjvCount}, measured ${stat.count}.`);
  }
  const references = [...stat.references];
  const manual = manualEntries[target.word];
  let source;
  let reviewStatus;
  let strongsNumber;

  if (manual) {
    source = manual;
    reviewStatus = "reviewed_kjv_form";
  } else {
    const mappedNumbers = [...new Set(
      (mappingsByWord.get(target.word) ?? [])
        .filter((row) => stat.references.has(row.verse_ref))
        .map((row) => normalizeStrongNumber(row.strongs_number))
        .filter((number) => lexicon.has(number)),
    )];
    strongsNumber = strongsChoices[target.word] ?? (mappedNumbers.length === 1 ? mappedNumbers[0] : "");
    if (!strongsNumber || !mappedNumbers.includes(strongsNumber)) {
      throw new Error(`${target.word}: expected one verified Strong's mapping, found ${mappedNumbers.join(", ") || "none"}.`);
    }
    const lexiconEntry = lexicon.get(strongsNumber);
    if (lexiconEntry.review_status !== "Verified") throw new Error(`${target.word}: ${strongsNumber} is not verified.`);
    source = {
      definition: lexiconEntry.plain_definition,
      source_title: lexiconEntry.source_title,
      source_file: lexiconEntry.source_url,
    };
    reviewStatus = "verified_strongs_mapping";
  }

  const storedEntry = {
    headword: target.word.toUpperCase(),
    normalized_headword: target.word,
    definition: source.definition,
    source_title: source.source_title,
    source_file: source.source_file,
    source_line_start: 1,
    source_line_end: 1,
    review_status: reviewStatus,
  };
  storedEntries.push(storedEntry);
  batchEntries.push({
    ...storedEntry,
    kjv_forms: [target.word],
    kjv_occurrences: target.kjvCount,
    ...(strongsNumber ? { strongs_number: strongsNumber, mapping_references: references } : {}),
  });
}

const existingEntries = JSON.parse(await readFile(entriesPath, "utf8"));
const mergedEntries = [
  ...existingEntries.filter((entry) => !targetWords.has(normalize(entry.normalized_headword || entry.headword))),
  ...storedEntries,
];
const batch = {
  batch_id: "kjv-rare-terms-phase-19-2026-08-26",
  reviewed_at: "2026-08-26",
  source_work: "Verified KJV-to-Strong mappings and public-domain Strong's Hebrew and Greek Bible dictionaries",
  rights_basis: "The KJV Scripture text and Strong's Bible dictionaries used for this gap fill are public domain in the United States; the reviewed Greek lexicon also carries CC0 source evidence.",
  definition_method: "Exact KJV token forms were matched to verified Strong's mappings and their verified lexicon records. The five forms without usable lexicon cards received original concise definitions from their cited KJV verses. No copyrighted commentary wording was imported.",
  frequency_source: inventoryPath,
  screening_summary: {
    reviewed_entries: batchEntries.length,
    resolved_kjv_forms: batchEntries.length,
    kjv_word_occurrences: batchEntries.reduce((sum, entry) => sum + entry.kjv_occurrences, 0),
    verified_strongs_mappings: batchEntries.filter((entry) => entry.review_status === "verified_strongs_mapping").length,
    original_kjv_context_definitions: batchEntries.filter((entry) => entry.review_status === "reviewed_kjv_form").length,
  },
  entries: batchEntries,
};

await writeFile(entriesPath, `${JSON.stringify(mergedEntries, null, 2)}\n`);
await writeFile(batchPath, `${JSON.stringify(batch, null, 2)}\n`);
console.log(`KJV rare-term gap fill written: ${batchPath}`);
console.log(`Entries: ${batchEntries.length}; Strong's-backed: ${batch.screening_summary.verified_strongs_mappings}; KJV-context: ${batch.screening_summary.original_kjv_context_definitions}.`);
