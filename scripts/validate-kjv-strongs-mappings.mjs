#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import verses1769 from "es-kjv/json/verses-1769.js";

const fileArg = process.argv.find((arg) => arg.startsWith("--file="));
const dirArg = process.argv.find((arg) => arg.startsWith("--dir="));
const strictLexicon = process.argv.includes("--strict-lexicon");
const defaultDir = "data/strongs/mapping-batches";
const targetFilePath = fileArg ? path.resolve(process.cwd(), fileArg.split("=")[1]) : null;
const targetDirPath = path.resolve(process.cwd(), dirArg?.split("=")[1] ?? defaultDir);

const required = [
  "verse_ref",
  "token_index",
  "kjv_word",
  "normalized_kjv_word",
  "strongs_number",
  "source_id",
  "source_title",
  "source_url",
  "rights_status",
  "rights_basis",
  "review_status",
];

function normalizeWord(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function wordForms(value) {
  const raw = String(value ?? "").toLowerCase();
  const tokens = raw.match(/[a-z0-9]+/g) ?? [];
  const forms = new Set([normalizeWord(raw), ...tokens.map(normalizeWord)].filter(Boolean));

  for (const form of [...forms]) {
    for (const suffix of ["eth", "est", "ed", "ing", "es", "s"]) {
      if (form.endsWith(suffix) && form.length > suffix.length + 2) {
        forms.add(form.slice(0, -suffix.length));
      }
    }
  }

  return forms;
}

function verseTokens(verseText) {
  return String(verseText ?? "").match(/[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?/g) ?? [];
}

async function mappingFiles() {
  if (targetFilePath) return [targetFilePath];
  const entries = await fs.readdir(targetDirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(targetDirPath, entry.name))
    .sort();
}

const [files, strongRaw] = await Promise.all([
  mappingFiles(),
  fs.readFile(path.resolve(process.cwd(), "data/strongs/sample-verified-strongs.json"), "utf8"),
]);

const strongEntries = JSON.parse(strongRaw);
const verifiedStrongNumbers = new Set(
  strongEntries
    .filter((entry) => entry.review_status === "Verified")
    .map((entry) => entry.strongs_number),
);
const strongEntriesByNumber = new Map(strongEntries.map((entry) => [entry.strongs_number, entry]));

const seen = new Set();
const errors = [];
const warnings = [];
const versesCovered = new Set();
const missingLexiconNumbers = new Set();
const glossMismatchRows = [];
let rowCount = 0;

for (const file of files) {
  const relativeFile = path.relative(process.cwd(), file);
  const raw = await fs.readFile(file, "utf8");
  const mappings = JSON.parse(raw);
  if (!Array.isArray(mappings)) {
    errors.push(`${relativeFile} must contain a JSON array.`);
    continue;
  }

  mappings.forEach((mapping, index) => {
    rowCount += 1;
    const row = `${relativeFile} row ${index + 1}`;
    for (const field of required) {
      if (mapping[field] === undefined || mapping[field] === null || mapping[field] === "") {
        errors.push(`Row ${row} is missing ${field}.`);
      }
    }

    const verseRef = String(mapping.verse_ref ?? "").trim();
    const verseText = verses1769[verseRef];
    if (!verseText) {
      errors.push(`Row ${row} has invalid verse_ref: ${verseRef}`);
    } else {
      versesCovered.add(verseRef);
      const tokenIndex = Number(mapping.token_index);
      const tokens = verseTokens(verseText);
      if (!Number.isInteger(tokenIndex) || tokenIndex < 1) {
        errors.push(`Row ${row} has invalid token_index: ${mapping.token_index}`);
      } else if (tokenIndex > tokens.length) {
        errors.push(`Row ${row} token_index ${tokenIndex} is beyond ${verseRef} token count ${tokens.length}.`);
      } else {
        const verseWord = tokens[tokenIndex - 1];
        if (normalizeWord(verseWord) !== normalizeWord(mapping.kjv_word)) {
          errors.push(`Row ${row} token mismatch for ${verseRef} #${tokenIndex}: expected ${verseWord}, got ${mapping.kjv_word}.`);
        }
      }
    }

    const normalized = normalizeWord(mapping.kjv_word);
    if (normalized && normalizeWord(mapping.normalized_kjv_word) !== normalized) {
      errors.push(`Row ${row} normalized_kjv_word should be ${normalized}.`);
    }

    if (!/^[GH][0-9]+$/.test(mapping.strongs_number ?? "")) {
      errors.push(`Row ${row} has invalid Strong's number: ${mapping.strongs_number}`);
    } else if (!verifiedStrongNumbers.has(mapping.strongs_number)) {
      missingLexiconNumbers.add(mapping.strongs_number);
      if (strictLexicon) {
        errors.push(`Row ${row} maps to a Strong's number not present in the verified lexicon sample: ${mapping.strongs_number}`);
      }
    } else {
      const strongEntry = strongEntriesByNumber.get(mapping.strongs_number);
      const allowedForms = new Set((strongEntry?.english_words ?? []).flatMap((word) => [...wordForms(word)]));
      const mappedForms = wordForms(mapping.normalized_kjv_word || mapping.kjv_word);
      if (![...mappedForms].some((form) => allowedForms.has(form))) {
        glossMismatchRows.push(`${row} maps ${mapping.kjv_word} to ${mapping.strongs_number}`);
        if (strictLexicon) {
          errors.push(
            `Row ${row} maps ${mapping.kjv_word} to ${mapping.strongs_number}, but that word is not listed in the reviewed English glosses.`,
          );
        }
      }
    }

    if (mapping.review_status !== "Verified") {
      warnings.push(`Row ${row} is not Verified and should stay hidden from public lookup.`);
    }

    const key = `${verseRef}|${mapping.token_index}|${mapping.strongs_number}`;
    if (seen.has(key)) errors.push(`Duplicate mapping row: ${key}`);
    seen.add(key);
  });
}

for (const warning of warnings) console.warn(`Warning: ${warning}`);
if (missingLexiconNumbers.size) {
  console.warn(
    `Warning: ${missingLexiconNumbers.size} Strong's numbers in reviewed mappings do not yet have verified lexicon cards. ` +
      "The reader can still show Strong's numbers; definition cards will appear as lexicon coverage expands.",
  );
}
if (glossMismatchRows.length) {
  console.warn(
    `Warning: ${glossMismatchRows.length} reviewed mapping rows use KJV words not listed in the current starter lexicon glosses. ` +
      "Run with --strict-lexicon to fail on these while expanding lexicon cards.",
  );
}
for (const error of errors) console.error(`Error: ${error}`);

console.log("KJV Strong's mapping validation complete");
console.table({
  files: files.length,
  rows: rowCount,
  versesCovered: versesCovered.size,
  errors: errors.length,
  warnings: warnings.length,
  missingLexiconNumbers: missingLexiconNumbers.size,
  glossMismatches: glossMismatchRows.length,
  strictLexicon,
});

if (errors.length) process.exitCode = 1;
