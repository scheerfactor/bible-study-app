import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);
const manifestArg = args.find((argument) => argument.startsWith("--manifest="));
const apply = args.includes("--apply");
if (!manifestArg) {
  throw new Error("Usage: node scripts/import-preaching-help-batch.mjs --manifest=path/to/batch.json [--apply]");
}

const targetPath = path.join(root, "data/preaching-helps/verified-preaching-helps.json");
const manifest = JSON.parse(fs.readFileSync(path.resolve(root, manifestArg.slice("--manifest=".length)), "utf8"));
const existing = JSON.parse(fs.readFileSync(targetPath, "utf8"));
const allowedTypes = new Set(["Quote", "Poem", "Illustration"]);
const blockedAuthors = ["c. s. lewis", "c.s. lewis"];

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}

const knownIds = new Set(existing.map((entry) => entry.id));
const knownText = new Set(existing.map((entry) => normalize(entry.text).toLowerCase()));
const additions = [];

if (!manifest.batchId || !manifest.reviewedAt || !Array.isArray(manifest.entries) || manifest.entries.length === 0) {
  throw new Error("The batch requires batchId, reviewedAt, and at least one entry.");
}

for (const candidate of manifest.entries) {
  const entry = { ...manifest.defaults, ...candidate };
  for (const field of [
    "id", "type", "title", "author", "text", "slideText", "sourceTitle", "sourceLocator",
    "sourceUrl", "sourceLicenseUrl", "sourceFile", "rightsStatus", "rightsBasis", "recommendedUse", "reviewNote",
  ]) {
    if (typeof entry[field] !== "string" || !entry[field].trim()) {
      throw new Error((entry.id ?? "unknown") + ": " + field + " required");
    }
  }
  if (!allowedTypes.has(entry.type)) throw new Error(entry.id + ": unsupported type " + entry.type);
  if (blockedAuthors.some((author) => normalize(entry.author).toLowerCase().includes(author))) {
    throw new Error(entry.id + ": blocked author requested by catalog owner");
  }
  if (entry.rightsStatus !== "Verified Public Domain") throw new Error(entry.id + ": rights must be verified public domain");
  if (!Array.isArray(entry.bibleReferences) || entry.bibleReferences.length === 0) {
    throw new Error(entry.id + ": Bible references required");
  }
  if (!Array.isArray(entry.topics) || entry.topics.length === 0) throw new Error(entry.id + ": topics required");
  if (knownIds.has(entry.id) || additions.some((item) => item.id === entry.id)) {
    throw new Error("Duplicate preaching-help id: " + entry.id);
  }
  const normalizedText = normalize(entry.text).toLowerCase();
  if (knownText.has(normalizedText) || additions.some((item) => normalize(item.text).toLowerCase() === normalizedText)) {
    throw new Error(entry.id + ": duplicate preaching-help text");
  }

  const sourcePath = path.resolve(root, entry.sourceFile);
  if (!sourcePath.startsWith(root + path.sep) || !fs.existsSync(sourcePath)) {
    throw new Error(entry.id + ": source file missing");
  }
  const sourceText = normalize(fs.readFileSync(sourcePath, "utf8"));
  for (const field of ["text", "slideText"]) {
    if (!sourceText.includes(normalize(entry[field]))) throw new Error(entry.id + ": " + field + " does not match the stored source");
  }
  additions.push(entry);
}

console.log("Verified " + additions.length + " nonduplicate, source-exact preaching helps from " + manifest.batchId + ".");
if (!apply) {
  console.log("Dry run only. Re-run with --apply to update the verified manifest.");
  process.exit(0);
}

fs.writeFileSync(targetPath, JSON.stringify([...existing, ...additions], null, 2) + "\n");
console.log("Imported " + additions.length + " preaching helps. Run npm run validate:preaching-helps to recheck the complete catalog.");
