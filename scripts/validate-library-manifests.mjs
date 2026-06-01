#!/usr/bin/env node
import { readLibraryManifest, validateLibraryEntry } from "./library-utils.mjs";

const manifestPath = process.argv[2] || "data/library/manifests/curated-public-domain-resources.json";
const entries = await readLibraryManifest(manifestPath);
const errors = entries.flatMap((entry, index) => validateLibraryEntry(entry, index));

const duplicateKeys = new Set();
const seenKeys = new Set();
for (const entry of entries) {
  const key = `${entry.title}::${entry.author}::${entry.source_url}`;
  if (seenKeys.has(key)) duplicateKeys.add(key);
  seenKeys.add(key);
}

for (const key of duplicateKeys) {
  errors.push(`duplicate manifest entry: ${key}`);
}

if (errors.length) {
  console.error(`Library manifest validation failed for ${manifestPath}`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Library manifest validation OK: ${entries.length} verified resources in ${manifestPath}.`);
