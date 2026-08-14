import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const entries = JSON.parse(await readFile(resolve(root, "data", "archaeology", "verified-evidence.json"), "utf8"));
const errors = [];
const ids = new Set();

for (const entry of entries) {
  if (!entry.id || ids.has(entry.id)) errors.push("Missing or duplicate evidence id: " + entry.id);
  ids.add(entry.id);
  if (!entry.sourceUrl || !entry.apiUrl || !entry.imageSourceUrl) errors.push("Missing source links: " + entry.id);
  if (!entry.rights?.includes("CC0") || !entry.rights?.includes("isPublicDomain true")) errors.push("Incomplete rights evidence: " + entry.id);
  if (!entry.studyNote || !entry.studyNote.match(/context|setting/i)) errors.push("Missing careful context note: " + entry.id);
  if (!Array.isArray(entry.bibleReferences) || !entry.bibleReferences.length) errors.push("Missing Bible references: " + entry.id);
  try {
    await access(resolve(root, "public", entry.assetUrl.replace(/^\//, "")));
  } catch {
    errors.push("Missing local image: " + entry.assetUrl);
  }
}

if (entries.length !== 3) errors.push("Expected exactly 3 reviewed archaeology entries in this batch.");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Archaeology validation passed: 3 sourced CC0 images with careful Bible-context notes.");
