#!/usr/bin/env node
import { createAdminClient, getSourceId, normalizeHeadword, readJsonOrCsv } from "./import-utils.mjs";

const dryRun = process.argv.includes("--dry-run");
const filePath = process.argv.find((arg, index) => index > 1 && arg !== "--dry-run");

if (!filePath) {
  console.error("Usage: npm run import:webster -- <path-to-websters-json-or-csv> [--dry-run]");
  process.exit(1);
}

const supabase = dryRun ? null : createAdminClient();
const rows = await readJsonOrCsv(filePath);
const defaultSourceTitle = "American Dictionary of the English Language";
const sourceIdCache = new Map();
const summary = {
  total_entries_found: rows.length,
  imported_entries: 0,
  skipped_entries: 0,
  errors: 0,
};

async function sourceIdFor(title) {
  if (dryRun) return null;
  const sourceTitle = title || defaultSourceTitle;
  if (!sourceIdCache.has(sourceTitle)) {
    sourceIdCache.set(sourceTitle, await getSourceId(supabase, sourceTitle));
  }
  return sourceIdCache.get(sourceTitle);
}

const entries = [];

for (const row of rows) {
  const headword = String(row.headword ?? row.word ?? "").trim();
  const definition = String(row.definition ?? "").trim();
  if (!headword || !definition) {
    summary.skipped_entries += 1;
    continue;
  }

  entries.push({
    headword,
    normalized_headword: normalizeHeadword(row.normalized_headword || headword),
    definition,
    source_id: await sourceIdFor(row.source_title),
  });
}

if (!entries.length) {
  console.log("Webster import summary");
  console.table(summary);
  console.log("No valid Webster entries found.");
  process.exit(0);
}

if (dryRun) {
  console.log(`Dry run OK: parsed ${entries.length} Webster entries from ${filePath}.`);
  console.log(
    entries
      .slice(0, 3)
      .map((entry) => `- ${entry.headword} -> ${entry.normalized_headword}`)
      .join("\n"),
  );
  console.log("Webster import summary");
  console.table(summary);
  process.exit(0);
}

const batchSize = 500;
let imported = 0;

for (let index = 0; index < entries.length; index += batchSize) {
  const batch = entries.slice(index, index + batchSize);
  try {
    const { error } = await supabase
      .from("dictionary_entries")
      .upsert(batch, { onConflict: "normalized_headword,definition" });

    if (error) throw error;
    imported += batch.length;
    summary.imported_entries += batch.length;
  } catch (error) {
    summary.errors += batch.length;
    console.error(error);
  }
}

console.log(`Imported ${imported} Webster entries from ${filePath}.`);
console.log("Webster import summary");
console.table(summary);

if (summary.errors > 0) process.exit(1);
