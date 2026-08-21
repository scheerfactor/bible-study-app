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
const chapterStartArgument = argument("chapter-start");
const chapterEndArgument = argument("chapter-end");
const hasChapterRange = chapterStartArgument !== undefined || chapterEndArgument !== undefined;
const chapterStart = Number(chapterStartArgument);
const chapterEnd = Number(chapterEndArgument);
const recordProgress = process.argv.includes("--record");
const dryRun = process.argv.includes("--dry-run");
const progressPath = "data/storage/strongs-mapping-storage-progress.json";

if (!book || !baseUrl) {
  throw new Error(
    "Usage: npm run audit:strongs-storage:live -- --book=Exodus --base-url=https://public-content.example [--chapter-start=1 --chapter-end=25]",
  );
}
if (
  hasChapterRange &&
  (chapterStartArgument === undefined ||
    chapterEndArgument === undefined ||
    !Number.isInteger(chapterStart) ||
    !Number.isInteger(chapterEnd) ||
    chapterStart < 1 ||
    chapterEnd < chapterStart)
) {
  throw new Error("--chapter-start and --chapter-end must be supplied together as a valid positive range.");
}
if (dryRun && recordProgress) throw new Error("--dry-run cannot be combined with --record.");

const inventory = JSON.parse(await readFile("data/storage/public-content-storage-inventory.json", "utf8"));
const prefix = `data/strongs/mappings-by-chapter/${slug(book)}-`;
const bookItems = inventory.items
  .filter((item) => item.kind === "strongs_mapping_chapter" && item.storage_path.startsWith(prefix) && !item.missing)
  .sort((left, right) => left.storage_path.localeCompare(right.storage_path, undefined, { numeric: true }));
const items = hasChapterRange
  ? bookItems.filter((item) => {
      const match = /^(\d+)\.json$/.exec(item.storage_path.slice(prefix.length));
      const chapter = Number(match?.[1]);
      return Number.isInteger(chapter) && chapter >= chapterStart && chapter <= chapterEnd;
    })
  : bookItems;
const scopeLabel = hasChapterRange ? `${book} ${chapterStart}-${chapterEnd}` : book;

if (!items.length) throw new Error(`No inventoried Strong's chapter shards found for ${scopeLabel}.`);
if (hasChapterRange && items.length !== chapterEnd - chapterStart + 1) {
  throw new Error(`Expected ${chapterEnd - chapterStart + 1} chapter shards for ${scopeLabel}; found ${items.length}.`);
}
if (dryRun) {
  console.log(`Dry run only. ${items.length} ${scopeLabel} chapter shards would be verified.`);
  for (const item of items) console.log(item.storage_path);
  process.exit(0);
}

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
  throw new Error(`Strong's live storage audit failed for ${failures.length} of ${items.length} ${scopeLabel} chapters.`);
}

console.log(`PASS Strong's live storage: ${items.length} ${scopeLabel} chapter shards match committed checksums.`);
console.log(`PASS Strong's live volume: ${(verifiedBytes / 1024 / 1024).toFixed(2)} MB verified from ${new URL(baseUrl).host}.`);

if (recordProgress) {
  const progress = await readFile(progressPath, "utf8")
    .then(JSON.parse)
    .catch(() => ({ schema_version: 2, completed_books: [], completed_ranges: [] }));
  const completedBooks = Array.isArray(progress.completed_books) ? progress.completed_books : [];
  const completedRanges = Array.isArray(progress.completed_ranges) ? progress.completed_ranges : [];
  if (hasChapterRange && completedBooks.some((entry) => entry.slug === slug(book))) {
    throw new Error(`${book} is already recorded as a completely verified book.`);
  }
  const overlappingRanges = hasChapterRange
    ? completedRanges.filter(
        (entry) =>
          entry.slug === slug(book) &&
          entry.chapter_start <= chapterEnd &&
          entry.chapter_end >= chapterStart &&
          (entry.chapter_start !== chapterStart || entry.chapter_end !== chapterEnd),
      )
    : [];
  if (overlappingRanges.length) {
    throw new Error(
      `${scopeLabel} overlaps an existing verified range: ${overlappingRanges
        .map((entry) => `${entry.book} ${entry.chapter_start}-${entry.chapter_end}`)
        .join(", ")}.`,
    );
  }
  const verifiedAt = new Date().toISOString();
  const commonRecord = {
    book,
    slug: slug(book),
    chapter_count: items.length,
    size_bytes: verifiedBytes,
    verification: "remote_sha256_matches_inventory",
    storage_host: new URL(baseUrl).host,
    inventory_generated_at: inventory.generated_at,
    verified_at: verifiedAt,
  };
  const nextBooks = hasChapterRange
    ? completedBooks
    : [...completedBooks.filter((entry) => entry.slug !== commonRecord.slug), commonRecord];
  const rangeRecord = hasChapterRange
    ? { ...commonRecord, chapter_start: chapterStart, chapter_end: chapterEnd }
    : null;
  const nextRanges = hasChapterRange
    ? [
        ...completedRanges.filter(
          (entry) =>
            entry.slug !== commonRecord.slug ||
            entry.chapter_start !== chapterStart ||
            entry.chapter_end !== chapterEnd,
        ),
        rangeRecord,
      ]
    : completedRanges.filter((entry) => entry.slug !== commonRecord.slug);
  const nextProgress = {
    schema_version: 2,
    updated_at: verifiedAt,
    completed_book_count: nextBooks.length,
    completed_range_count: nextRanges.length,
    completed_chapter_count: [...nextBooks, ...nextRanges].reduce((sum, entry) => sum + entry.chapter_count, 0),
    completed_size_bytes: [...nextBooks, ...nextRanges].reduce((sum, entry) => sum + entry.size_bytes, 0),
    completed_books: nextBooks,
    completed_ranges: nextRanges,
  };
  await writeFile(progressPath, `${JSON.stringify(nextProgress, null, 2)}\n`);
  console.log(`Recorded verified ${scopeLabel} migration progress in ${progressPath}.`);
}
