#!/usr/bin/env node
import { createAdminClient, getSourceId, readJsonOrCsv } from "./import-utils.mjs";

const dryRun = process.argv.includes("--dry-run");
const filePath = process.argv.find((arg, index) => index > 1 && arg !== "--dry-run");

if (!filePath) {
  console.error("Usage: npm run import:commentary -- <path-to-commentary-json-or-csv> [--dry-run]");
  process.exit(1);
}

const rows = await readJsonOrCsv(filePath);
const supabase = dryRun ? null : createAdminClient();
const sourceIdCache = new Map();
let imported = 0;
let skipped = 0;

async function sourceIdFor(title) {
  if (dryRun) return null;
  if (!sourceIdCache.has(title)) {
    sourceIdCache.set(title, await getSourceId(supabase, title));
  }
  return sourceIdCache.get(title);
}

const entries = [];

for (const row of rows) {
  const book = String(row.book ?? "").trim();
  const chapter = Number(row.chapter);
  const verseStart = Number(row.verse_start);
  const verseEnd = Number(row.verse_end);
  const author = String(row.author ?? "").trim();
  const resourceTitle = String(row.resource_title ?? "").trim();
  const entryText = String(row.entry_text ?? "").trim();
  const sourceTitle = String(row.source_title ?? resourceTitle).trim();

  if (!book || !chapter || !verseStart || !verseEnd || !author || !resourceTitle || !entryText || !sourceTitle) {
    skipped += 1;
    continue;
  }

  entries.push({
    source_id: await sourceIdFor(sourceTitle),
    book,
    chapter,
    verse_start: verseStart,
    verse_end: verseEnd,
    author,
    resource_title: resourceTitle,
    entry_text: entryText,
    public_domain_status: String(row.public_domain_status ?? "needs review").trim(),
    source_url: String(row.source_url ?? "").trim() || null,
  });
}

if (dryRun) {
  console.log(`Dry run OK: parsed ${entries.length} commentary entries from ${filePath}.`);
  console.table({ parsed_entries: entries.length, skipped_entries: skipped });
  process.exit(0);
}

for (const entry of entries) {
  const { error } = await supabase
    .from("commentary_entries")
    .upsert(entry, { onConflict: "book,chapter,verse_start,verse_end,author,resource_title" });

  if (error) throw error;
  imported += 1;
}

console.log(`Imported ${imported} commentary entries from ${filePath}.`);
console.table({ imported_entries: imported, skipped_entries: skipped });
