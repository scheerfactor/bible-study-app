import fs from "node:fs/promises";
import path from "node:path";

const fileArg = process.argv.find((arg) => arg.startsWith("--file="));
const root = process.cwd();
const baseFile = "data/strongs/sample-verified-strongs.json";
const batchIndexFile = "data/strongs/lexicon-batches/index.json";

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

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadEntriesForValidation() {
  if (fileArg) {
    const filePath = path.resolve(root, fileArg.split("=")[1]);
    const raw = await fs.readFile(filePath, "utf8");
    return { entries: JSON.parse(raw), files: [path.relative(root, filePath)] };
  }

  const files = [baseFile];
  const batchIndexPath = path.resolve(root, batchIndexFile);
  if (await fileExists(batchIndexPath)) {
    const batchIndex = JSON.parse(await fs.readFile(batchIndexPath, "utf8"));
    if (Array.isArray(batchIndex.files)) {
      files.push(...batchIndex.files);
    }
  }

  const entries = [];
  for (const file of files) {
    const raw = await fs.readFile(path.resolve(root, file), "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      fail(`${file} must be a JSON array.`);
      continue;
    }
    for (const entry of parsed) entries.push({ ...entry, __sourceFile: file });
  }

  return { entries, files };
}

const { entries, files } = await loadEntriesForValidation();

if (!Array.isArray(entries)) {
  fail("Strong's data must be a JSON array.");
} else {
  const seen = new Set();
  const errors = [];
  const warnings = [];

  entries.forEach((entry, index) => {
    const sourceFile = entry.__sourceFile ?? "provided file";
    for (const field of required) {
      if (entry[field] === undefined || entry[field] === null || entry[field] === "") {
        errors.push(`${sourceFile}: entry ${index + 1} is missing ${field}.`);
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
      errors.push(`Duplicate Strong's number: ${entry.strongs_number} in ${sourceFile}`);
    }
    seen.add(entry.strongs_number);
  });

  for (const warning of warnings) console.warn(`Warning: ${warning}`);
  for (const error of errors) console.error(`Error: ${error}`);

  console.log(
    `Strong's validation complete: ${entries.length} entries checked across ${files.length} file(s), ${errors.length} errors, ${warnings.length} warnings.`,
  );
  if (errors.length) process.exitCode = 1;
}
