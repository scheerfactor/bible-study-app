import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

function argument(name) {
  return process.argv.find((value) => value.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const book = argument("book")?.trim();
const baseUrl = (argument("base-url") ?? process.env.CONTENT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_CONTENT_BASE_URL)?.replace(/\/+$/, "");
const concurrency = Math.max(1, Math.min(12, Number(argument("concurrency") ?? 6)));
const recordProgress = process.argv.includes("--record");
const progressPath = "data/storage/strongs-mapping-storage-progress.json";

if (!book || !baseUrl) {
  throw new Error(
    "Usage: npm run audit:strongs-storage:live -- --book=Exodus --base-url=https://public-content.example",
  );
}

const inventory = JSON.parse(await readFile("data/storage/public-content-storage-inventory.json", "utf8"));
const prefix = `data/strongs/mappings-by-chapter/${slug(book)}-`;
const items = inventory.items
  .filter((item) => item.kind === "strongs_mapping_chapter" && item.storage_path.startsWith(prefix) && !item.missing)
  .sort((left, right) => left.storage_path.localeCompare(right.storage_path, undefined, { numeric: true }));

if (!items.length) throw new Error(`No inventoried Strong's chapter shards found for ${book}.`);

let nextIndex = 0;
const failures = [];
let verifiedBytes = 0;

async function worker() {
  while (nextIndex < items.length) {
    const item = items[nextIndex];
    nextIndex += 1;

    try {
      const response = await fetch(`${baseUrl}/${item.storage_path}`, { signal: AbortSignal.timeout(60_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = Buffer.from(await response.arrayBuffer());
      const digest = createHash("sha256").update(body).digest("hex");
      if (body.length !== item.size_bytes) throw new Error(`size ${body.length}; expected ${item.size_bytes}`);
      if (digest !== item.checksum_sha256) throw new Error("SHA-256 mismatch");
      verifiedBytes += body.length;
    } catch (error) {
      failures.push({
        path: item.storage_path,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  throw new Error(`Strong's live storage audit failed for ${failures.length} of ${items.length} ${book} chapters.`);
}

console.log(`PASS Strong's live storage: ${items.length} ${book} chapter shards match committed checksums.`);
console.log(`PASS Strong's live volume: ${(verifiedBytes / 1024 / 1024).toFixed(2)} MB verified from ${new URL(baseUrl).host}.`);

if (recordProgress) {
  const progress = await readFile(progressPath, "utf8")
    .then(JSON.parse)
    .catch(() => ({ schema_version: 1, completed_books: [] }));
  const completedBooks = Array.isArray(progress.completed_books) ? progress.completed_books : [];
  const record = {
    book,
    slug: slug(book),
    chapter_count: items.length,
    size_bytes: verifiedBytes,
    verification: "remote_sha256_matches_inventory",
    storage_host: new URL(baseUrl).host,
    inventory_generated_at: inventory.generated_at,
    verified_at: new Date().toISOString(),
  };
  const nextBooks = [...completedBooks.filter((entry) => entry.slug !== record.slug), record];
  const nextProgress = {
    schema_version: 1,
    updated_at: record.verified_at,
    completed_book_count: nextBooks.length,
    completed_chapter_count: nextBooks.reduce((sum, entry) => sum + entry.chapter_count, 0),
    completed_size_bytes: nextBooks.reduce((sum, entry) => sum + entry.size_bytes, 0),
    completed_books: nextBooks,
  };
  await writeFile(progressPath, `${JSON.stringify(nextProgress, null, 2)}\n`);
  console.log(`Recorded verified ${book} migration progress in ${progressPath}.`);
}
