import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const dryRun = process.argv.includes("--dry-run");
const fileArg = process.argv.find((arg) => arg.startsWith("--file="));
const filePath = path.resolve(process.cwd(), fileArg?.split("=")[1] ?? "data/strongs/sample-verified-strongs.json");
const manifestPath = path.resolve(process.cwd(), "data/strongs/source-manifest.json");

const entries = JSON.parse(await fs.readFile(filePath, "utf8"));
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));

if (!Array.isArray(entries)) {
  console.error("Strong's import file must be a JSON array.");
  process.exit(1);
}

const verifiedEntries = entries.filter((entry) => entry.review_status === "Verified");
const skippedEntries = entries.length - verifiedEntries.length;

console.log(`Strong's import summary`);
console.log(`Source: ${filePath}`);
console.log(`Entries found: ${entries.length}`);
console.log(`Verified entries ready: ${verifiedEntries.length}`);
console.log(`Skipped entries: ${skippedEntries}`);

if (dryRun) {
  console.log("Dry run only. No Supabase writes were attempted.");
  process.exit(0);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY locally before importing.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const source = manifest.approved_sample_source;
const { data: sourceData, error: sourceError } = await supabase
  .from("strongs_sources")
  .upsert({
    title: source.title,
    author: source.author,
    year: source.year,
    source_url: source.source_url,
    rights_status: source.rights_status,
    commercial_use_notes: source.commercial_use_notes,
    attribution_notes: source.attribution_notes,
    review_status: source.review_status,
  }, { onConflict: "title,source_url" })
  .select("id")
  .single();

if (sourceError || !sourceData) {
  console.error(sourceError?.message ?? "Could not upsert Strong's source.");
  process.exit(1);
}

const rows = verifiedEntries.map((entry) => ({
  source_id: sourceData.id,
  strongs_number: entry.strongs_number,
  language: entry.language,
  original_word: entry.original_word,
  transliteration: entry.transliteration ?? null,
  pronunciation: entry.pronunciation ?? null,
  english_words: entry.english_words,
  root: entry.root ?? null,
  related_numbers: entry.related_numbers ?? [],
  plain_definition: entry.plain_definition,
  first_occurrence: entry.first_occurrence ?? null,
  key_verses: entry.key_verses ?? [],
  source_url: entry.source_url,
  rights_status: entry.rights_status,
  review_status: entry.review_status,
}));

const { error: entriesError } = await supabase
  .from("strongs_entries")
  .upsert(rows, { onConflict: "strongs_number,source_id" });

if (entriesError) {
  console.error(entriesError.message);
  process.exit(1);
}

console.log(`Imported ${rows.length} verified Strong's entries.`);
