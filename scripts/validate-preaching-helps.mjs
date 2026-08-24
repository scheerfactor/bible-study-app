import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const manifestPath = path.join(projectRoot, "data/preaching-helps/verified-preaching-helps.json");
const entries = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const allowedTypes = new Set(["Quote", "Poem", "Illustration"]);
const seenIds = new Set();
const errors = [];

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}

function requireText(entry, field) {
  if (typeof entry[field] !== "string" || !entry[field].trim()) {
    errors.push(`${entry.id ?? "unknown"}: ${field} is required`);
  }
}

if (!Array.isArray(entries)) {
  throw new Error("Preaching helps manifest must be an array.");
}

for (const entry of entries) {
  for (const field of [
    "id",
    "type",
    "title",
    "author",
    "text",
    "slideText",
    "sourceTitle",
    "sourceLocator",
    "sourceUrl",
    "sourceLicenseUrl",
    "sourceFile",
    "rightsStatus",
    "rightsBasis",
    "recommendedUse",
    "reviewNote",
  ]) {
    requireText(entry, field);
  }

  if (seenIds.has(entry.id)) errors.push(`${entry.id}: duplicate id`);
  seenIds.add(entry.id);

  if (!allowedTypes.has(entry.type)) errors.push(`${entry.id}: unsupported type ${entry.type}`);
  if (entry.rightsStatus !== "Verified Public Domain") errors.push(`${entry.id}: rights status is not verified public domain`);
  if (!entry.sourceUrl?.startsWith("https://")) errors.push(`${entry.id}: sourceUrl must use HTTPS`);
  if (!entry.sourceLicenseUrl?.startsWith("https://")) errors.push(`${entry.id}: sourceLicenseUrl must use HTTPS`);
  if (!Array.isArray(entry.bibleReferences) || entry.bibleReferences.length === 0) errors.push(`${entry.id}: at least one Bible reference is required`);
  if (!Array.isArray(entry.topics) || entry.topics.length === 0) errors.push(`${entry.id}: at least one topic is required`);

  const sourcePath = path.join(projectRoot, entry.sourceFile ?? "");
  if (!fs.existsSync(sourcePath)) {
    errors.push(`${entry.id}: source file does not exist: ${entry.sourceFile}`);
    continue;
  }

  const sourceText = normalize(fs.readFileSync(sourcePath, "utf8"));
  for (const field of ["text", "slideText"]) {
    const excerpt = normalize(entry[field] ?? "").replace(/^\d+\s+/, "");
    if (excerpt && !sourceText.includes(excerpt)) {
      errors.push(`${entry.id}: ${field} does not match the stored source text`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Preaching helps validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const counts = Object.fromEntries([...allowedTypes].map((type) => [type, entries.filter((entry) => entry.type === type).length]));
console.log(`Preaching helps validation OK: ${entries.length} source-verified public-domain entries.`);
console.log(`- Quotes: ${counts.Quote}`);
console.log(`- Poems: ${counts.Poem}`);
console.log(`- Illustrations: ${counts.Illustration}`);
