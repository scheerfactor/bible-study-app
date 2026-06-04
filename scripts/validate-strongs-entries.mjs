import fs from "node:fs/promises";
import path from "node:path";

const fileArg = process.argv.find((arg) => arg.startsWith("--file="));
const filePath = path.resolve(process.cwd(), fileArg?.split("=")[1] ?? "data/strongs/sample-verified-strongs.json");

const required = [
  "strongs_number",
  "language",
  "original_word",
  "english_words",
  "plain_definition",
  "source_url",
  "rights_status",
  "review_status",
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

const raw = await fs.readFile(filePath, "utf8");
const entries = JSON.parse(raw);

if (!Array.isArray(entries)) {
  fail("Strong's data must be a JSON array.");
} else {
  const seen = new Set();
  const errors = [];
  const warnings = [];

  entries.forEach((entry, index) => {
    for (const field of required) {
      if (entry[field] === undefined || entry[field] === null || entry[field] === "") {
        errors.push(`Entry ${index + 1} is missing ${field}.`);
      }
    }

    if (!/^[GH][0-9]+$/.test(entry.strongs_number ?? "")) {
      errors.push(`Entry ${index + 1} has invalid Strong's number: ${entry.strongs_number}`);
    }

    if (!["Greek", "Hebrew", "Aramaic"].includes(entry.language)) {
      errors.push(`Entry ${entry.strongs_number} has invalid language: ${entry.language}`);
    }

    if (!Array.isArray(entry.english_words) || entry.english_words.length === 0) {
      errors.push(`Entry ${entry.strongs_number} needs at least one English word.`);
    }

    if (entry.review_status !== "Verified") {
      warnings.push(`Entry ${entry.strongs_number} is not Verified and should stay hidden from public lookup.`);
    }

    if (seen.has(entry.strongs_number)) {
      errors.push(`Duplicate Strong's number: ${entry.strongs_number}`);
    }
    seen.add(entry.strongs_number);
  });

  for (const warning of warnings) console.warn(`Warning: ${warning}`);
  for (const error of errors) console.error(`Error: ${error}`);

  console.log(`Strong's validation complete: ${entries.length} entries checked, ${errors.length} errors, ${warnings.length} warnings.`);
  if (errors.length) process.exitCode = 1;
}
