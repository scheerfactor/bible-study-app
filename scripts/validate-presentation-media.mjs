import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const manifestPath = resolve(root, "public", "media", "sermon-slides", "media-assets.json");
const entries = JSON.parse(await readFile(manifestPath, "utf8"));
const errors = [];
const files = new Set();
const slots = new Set();
const referencePattern = /^(?:[1-3] )?[A-Z][A-Za-z' ]+ \d+:\d+(?:-\d+)?$/;

if (!Array.isArray(entries) || !entries.length) errors.push("Presentation media manifest must contain at least one entry.");

for (const [index, entry] of entries.entries()) {
  const label = entry.slot || `record ${index + 1}`;
  if (!entry.file || files.has(entry.file)) errors.push(`Missing or duplicate file: ${label}`);
  if (!entry.slot || slots.has(entry.slot)) errors.push(`Missing or duplicate slot: ${label}`);
  files.add(entry.file);
  slots.add(entry.slot);

  for (const field of ["category", "source", "source_url", "rightsStatus", "artist", "credit", "recommendedUse", "optimized"]) {
    if (typeof entry[field] !== "string" || !entry[field].trim()) errors.push(`Missing ${field}: ${label}`);
  }
  if (!Array.isArray(entry.themes) || entry.themes.length < 2 || entry.themes.some((theme) => typeof theme !== "string" || !theme.trim())) {
    errors.push(`At least two themes are required: ${label}`);
  }
  if (!Array.isArray(entry.bibleReferences) || entry.bibleReferences.length < 1) {
    errors.push(`At least one Bible reference is required: ${label}`);
  } else {
    for (const reference of entry.bibleReferences) {
      if (typeof reference !== "string" || !referencePattern.test(reference)) errors.push(`Invalid Bible reference '${reference}': ${label}`);
    }
  }
  if (!/public domain|cc0|original generated asset/i.test(entry.rightsStatus ?? "")) errors.push(`Unclear image rights: ${label}`);
  try {
    await access(resolve(root, "public", "media", "sermon-slides", entry.file));
  } catch {
    errors.push(`Missing local presentation image: ${entry.file}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Presentation media validation passed: ${entries.length} unique local backgrounds with rights, themes, and Bible references.`);
