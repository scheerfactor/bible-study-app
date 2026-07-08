#!/usr/bin/env node
import { createAdminClient } from "./import-utils.mjs";
import { fileMetadata, isStorageBackedLibraryEntry, readLibraryManifest, validateLibraryEntry } from "./library-utils.mjs";

const dryRun = process.argv.includes("--dry-run");
const manifestPath =
  process.argv.find((arg, index) => index > 1 && arg !== "--dry-run") ||
  "data/library/manifests/curated-public-domain-resources.json";

const entries = await readLibraryManifest(manifestPath);
const errors = entries.flatMap((entry, index) => validateLibraryEntry(entry, index));

if (errors.length) {
  console.error("Refusing to import until manifest validation passes.");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const rows = [];

for (const entry of entries) {
  const metadata = isStorageBackedLibraryEntry(entry)
    ? {
        checksum_sha256: entry.checksum_sha256,
        file_size_bytes: entry.file_size_bytes,
        word_count: entry.word_count,
      }
    : await fileMetadata(entry.file_path);
  rows.push({
    ...entry,
    ...metadata,
  });
}

if (dryRun) {
  console.log(`Dry run OK: ${rows.length} library resources are ready to import from ${manifestPath}.`);
  console.log(rows.slice(0, 5).map((row) => `- ${row.title} (${row.word_count} words)`).join("\n"));
  process.exit(0);
}

const supabase = createAdminClient();
let imported = 0;

for (const row of rows) {
  const { data: source, error: sourceError } = await supabase
    .from("resource_sources")
    .upsert(
      {
        title: row.title,
        author: row.author,
        year: row.year,
        source_url: row.source_url,
        copyright_status: row.public_domain_status,
        commercial_use_notes: row.commercial_use_status,
        attribution_notes: row.attribution_required ? row.rights_basis : "No attribution required.",
      },
      { onConflict: "title" },
    )
    .select("id")
    .single();

  if (sourceError) throw sourceError;

  const { error: libraryError } = await supabase.from("library_resources").upsert(
    {
      source_id: source.id,
      title: row.title,
      author: row.author,
      year: row.year,
      category: row.category,
      source_url: row.source_url,
      download_url: row.download_url,
      source_license_url: row.source_license_url,
      file_path: row.file_path,
      public_domain_status: row.public_domain_status,
      commercial_use_status: row.commercial_use_status,
      attribution_required: row.attribution_required,
      rights_basis: row.rights_basis,
      notes: row.notes,
      import_status: "imported_metadata",
      word_count: row.word_count,
      file_size_bytes: row.file_size_bytes,
      checksum_sha256: row.checksum_sha256,
    },
    { onConflict: "file_path" },
  );

  if (libraryError) throw libraryError;
  imported += 1;
}

console.log(`Imported ${imported} library resource metadata rows from ${manifestPath}.`);
