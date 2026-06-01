#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { downloadTextFile, readLibraryManifest, validateLibraryEntry } from "./library-utils.mjs";

const dryRun = process.argv.includes("--dry-run");
const manifestPath =
  process.argv.find((arg, index) => index > 1 && arg !== "--dry-run") ||
  "data/library/manifests/curated-public-domain-resources.json";

const entries = await readLibraryManifest(manifestPath);
const errors = entries.flatMap((entry, index) => validateLibraryEntry(entry, index));

if (errors.length) {
  console.error("Refusing to download until manifest validation passes.");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const updatedEntries = [];
const summary = {
  total_entries_found: entries.length,
  downloaded_entries: 0,
  skipped_entries: 0,
  errors: 0,
};

for (const entry of entries) {
  if (!entry.download_url) {
    summary.skipped_entries += 1;
    updatedEntries.push(entry);
    continue;
  }

  if (dryRun) {
    console.log(`[dry-run] ${entry.download_url} -> ${entry.file_path}`);
    updatedEntries.push(entry);
    continue;
  }

  try {
    const metadata = await downloadTextFile(entry.download_url, entry.file_path);
    summary.downloaded_entries += 1;
    updatedEntries.push({
      ...entry,
      ...metadata,
      import_status: "imported_file",
    });
    console.log(`Downloaded ${entry.title}`);
  } catch (error) {
    summary.errors += 1;
    updatedEntries.push(entry);
    console.error(error);
  }
}

if (!dryRun) {
  const existing = await readFile(manifestPath, "utf8");
  const newline = existing.endsWith("\n") ? "\n" : "";
  await writeFile(manifestPath, `${JSON.stringify(updatedEntries, null, 2)}${newline}`, "utf8");
}

console.log("Library download summary");
console.table(summary);

if (summary.errors > 0) process.exit(1);
