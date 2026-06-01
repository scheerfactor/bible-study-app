#!/usr/bin/env node
import { createAdminClient, getSourceId, readJsonOrCsv } from "./import-utils.mjs";

const dryRun = process.argv.includes("--dry-run");
const filePath = process.argv.find((arg, index) => index > 1 && arg !== "--dry-run");

if (!filePath) {
  console.error("Usage: npm run import:tsk -- <path-to-tsk-json-or-csv> [--dry-run]");
  process.exit(1);
}

const supabase = dryRun ? null : createAdminClient();
const rows = await readJsonOrCsv(filePath);
const defaultSourceTitle = "Treasury of Scripture Knowledge";
const sourceIdCache = new Map();

async function sourceIdFor(title) {
  if (dryRun) return null;
  const sourceTitle = title || defaultSourceTitle;
  if (!sourceIdCache.has(sourceTitle)) {
    sourceIdCache.set(sourceTitle, await getSourceId(supabase, sourceTitle));
  }
  return sourceIdCache.get(sourceTitle);
}

const references = [];

for (const row of rows) {
  const verseRef = String(row.verse_ref ?? "").trim();
  const targetRef = String(row.target_ref ?? "").trim();
  if (!verseRef || !targetRef) continue;

  references.push({
    verse_ref: verseRef,
    target_ref: targetRef,
    label: String(row.label ?? "").trim() || null,
    source: String(row.source ?? "TSK").trim() || "TSK",
    source_id: await sourceIdFor(row.source_title),
  });
}

if (!references.length) {
  console.log("No valid TSK cross references found.");
  process.exit(0);
}

if (dryRun) {
  console.log(`Dry run OK: parsed ${references.length} TSK cross references from ${filePath}.`);
  console.log(
    references
      .slice(0, 3)
      .map((reference) => `- ${reference.verse_ref} -> ${reference.target_ref} (${reference.source})`)
      .join("\n"),
  );
  process.exit(0);
}

const batchSize = 500;
let imported = 0;

for (let index = 0; index < references.length; index += batchSize) {
  const batch = references.slice(index, index + batchSize);
  const { error } = await supabase
    .from("cross_references")
    .upsert(batch, { onConflict: "verse_ref,target_ref,source" });

  if (error) throw error;
  imported += batch.length;
}

console.log(`Imported ${imported} TSK cross references from ${filePath}.`);
