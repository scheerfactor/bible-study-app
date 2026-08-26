#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import verses1769 from "es-kjv/json/verses-1769.js";

const inventoryPath = "data/reports/webster-missing-word-inventory.csv";
const outputArg = process.argv.find((value) => value.startsWith("--output="));
const limitArg = process.argv.find((value) => value.startsWith("--limit="));
const outputPath = outputArg?.slice("--output=".length) || "data/reports/kjv-rare-term-review-queue.json";
const limit = Number(limitArg?.slice("--limit=".length) || 25);

if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
  console.error("--limit must be an integer from 1 to 200.");
  process.exit(1);
}

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

function relatedHeadings(entries, headingField, bodyField, word) {
  const normalizedWord = normalize(word);
  const exact = [];
  const related = [];

  for (const entry of entries) {
    const heading = String(entry?.[headingField] ?? "").trim();
    if (!heading) continue;
    const normalizedHeading = normalize(heading);
    if (normalizedHeading === normalizedWord) {
      exact.push(heading);
      continue;
    }
    const body = normalize(
      typeof entry?.[bodyField] === "string" ? entry[bodyField] : JSON.stringify(entry?.[bodyField] ?? ""),
    );
    if (normalizedHeading.includes(normalizedWord) || body.includes(normalizedWord)) related.push(heading);
  }

  return {
    exact: [...new Set(exact)].slice(0, 10),
    related: [...new Set(related)].slice(0, 10),
  };
}

const [inventoryText, eastonEntries, naveTopics] = await Promise.all([
  readFile(inventoryPath, "utf8"),
  readFile("data/generated/eastons-bible-dictionary.entries.json", "utf8").then(JSON.parse),
  readFile("data/generated/naves-topical-bible.topics.json", "utf8").then(JSON.parse),
]);

const rows = inventoryText
  .trim()
  .split("\n")
  .slice(1)
  .map(parseCsvLine)
  .filter((row) => row.length === 6 && !row[5])
  .slice(0, limit);

const entries = rows.map(([word, kjvCount, priority, lookupCandidates, sampleReferences]) => {
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${escapedWord}\\b`, "gi");
  const occurrences = [];
  let measuredCount = 0;

  for (const [reference, text] of Object.entries(verses1769)) {
    const matches = String(text).match(pattern) ?? [];
    if (!matches.length) continue;
    measuredCount += matches.length;
    occurrences.push({ reference, count: matches.length, text });
  }

  return {
    word,
    normalized_word: normalize(word),
    kjv_count: Number(kjvCount),
    measured_kjv_count: measuredCount,
    priority,
    lookup_candidates: lookupCandidates.split("; ").filter(Boolean),
    sample_references: sampleReferences.split("; ").filter(Boolean),
    occurrences,
    existing_source_candidates: {
      easton: relatedHeadings(eastonEntries, "headword", "definition", word),
      nave: relatedHeadings(naveTopics, "topic", "content", word),
    },
  };
});

const countMismatches = entries.filter((entry) => entry.kjv_count !== entry.measured_kjv_count);
if (countMismatches.length) {
  console.error(`Review queue generation stopped: ${countMismatches.length} KJV count mismatch(es).`);
  for (const entry of countMismatches) {
    console.error(`- ${entry.word}: inventory ${entry.kjv_count}, measured ${entry.measured_kjv_count}`);
  }
  process.exit(1);
}

const report = {
  generated_at: new Date().toISOString(),
  source_inventory: inventoryPath,
  source_bible: "King James Bible, standard 1769 text",
  purpose: "Human review queue only. Entries must not be published without source and identity review.",
  limit,
  entries,
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`KJV rare-term review queue written: ${outputPath}`);
console.log(`Entries: ${entries.length}; KJV occurrences: ${entries.reduce((sum, entry) => sum + entry.kjv_count, 0)}`);
