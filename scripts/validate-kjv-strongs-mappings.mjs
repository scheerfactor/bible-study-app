#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import verses1769 from "es-kjv/json/verses-1769.js";

const fileArg = process.argv.find((arg) => arg.startsWith("--file="));
const filePath = path.resolve(process.cwd(), fileArg?.split("=")[1] ?? "data/strongs/kjv-strongs-mapping.sample-reviewed.json");

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

function verseTokens(verseText) {
  return String(verseText ?? "").match(/[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?/g) ?? [];
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

const [raw, strongRaw] = await Promise.all([
  fs.readFile(filePath, "utf8"),
  fs.readFile(path.resolve(process.cwd(), "data/strongs/sample-verified-strongs.json"), "utf8"),
]);

const mappings = JSON.parse(raw);
const strongEntries = JSON.parse(strongRaw);
const verifiedStrongNumbers = new Set(
  strongEntries
    .filter((entry) => entry.review_status === "Verified")
    .map((entry) => entry.strongs_number),
);

if (!Array.isArray(mappings)) {
  fail("KJV Strong's mapping data must be a JSON array.");
} else {
  const seen = new Set();
  const errors = [];
  const warnings = [];
  const versesCovered = new Set();

  mappings.forEach((mapping, index) => {
    const row = index + 1;
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
      errors.push(`Row ${row} maps to a Strong's number not present in the verified lexicon sample: ${mapping.strongs_number}`);
    }

    if (mapping.review_status !== "Verified") {
      warnings.push(`Row ${row} is not Verified and should stay hidden from public lookup.`);
    }

    const key = `${verseRef}|${mapping.token_index}|${mapping.strongs_number}`;
    if (seen.has(key)) errors.push(`Duplicate mapping row: ${key}`);
    seen.add(key);
  });

  for (const warning of warnings) console.warn(`Warning: ${warning}`);
  for (const error of errors) console.error(`Error: ${error}`);

  console.log("KJV Strong's mapping validation complete");
  console.table({
    rows: mappings.length,
    versesCovered: versesCovered.size,
    errors: errors.length,
    warnings: warnings.length,
  });

  if (errors.length) process.exitCode = 1;
}
