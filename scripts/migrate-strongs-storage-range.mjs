import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function argument(name) {
  return process.argv.find((value) => value.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function run(script, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [join(repoRoot, "scripts", script), ...args], {
      cwd: repoRoot,
      stdio: "inherit",
      shell: false,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${script} exited with ${code}`));
    });
  });
}

const book = argument("book")?.trim();
const chapterStart = Number(argument("chapter-start"));
const chapterEnd = Number(argument("chapter-end"));
const concurrency = Number(argument("concurrency") ?? 4);
const execute = process.argv.includes("--execute");
const baseUrl = (argument("base-url") ?? process.env.CONTENT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_CONTENT_BASE_URL)?.replace(
  /\/+$/,
  "",
);
const bucket = argument("bucket");

if (!book || !Number.isInteger(chapterStart) || !Number.isInteger(chapterEnd) || chapterStart < 1 || chapterEnd < chapterStart) {
  throw new Error(
    "Usage: npm run storage:migrate:strongs-range -- --book=Psalms --chapter-start=1 --chapter-end=25 [--base-url=https://public-content.example] [--execute]",
  );
}
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) {
  throw new Error("--concurrency must be an integer from 1 through 8.");
}
if (execute && !baseUrl) {
  throw new Error("--base-url or CONTENT_PUBLIC_BASE_URL is required with --execute.");
}

const bookSlug = slug(book);
const pathListValue = argument("path-list") ?? `data/storage/upload-lists/${bookSlug}-${chapterStart}-${chapterEnd}.txt`;
if (isAbsolute(pathListValue)) throw new Error("--path-list must be relative to the repository root.");

const pathListPath = resolve(repoRoot, pathListValue);
const relativePathList = relative(repoRoot, pathListPath);
if (relativePathList.startsWith("..") || isAbsolute(relativePathList)) {
  throw new Error("--path-list must stay within the repository root.");
}

const listedPaths = (await readFile(pathListPath, "utf8"))
  .split(/\r?\n/)
  .map((value) => value.trim())
  .filter(Boolean);
const expectedPaths = Array.from(
  { length: chapterEnd - chapterStart + 1 },
  (_, index) => `data/strongs/mappings-by-chapter/${bookSlug}-${chapterStart + index}.json`,
);

if (listedPaths.length !== new Set(listedPaths).size) {
  throw new Error(`Path list contains duplicate entries: ${relativePathList}.`);
}
const firstMismatch = expectedPaths.findIndex((expectedPath, index) => listedPaths[index] !== expectedPath);
if (listedPaths.length !== expectedPaths.length || firstMismatch !== -1) {
  const mismatchIndex = firstMismatch === -1 ? Math.min(listedPaths.length, expectedPaths.length) : firstMismatch;
  throw new Error(
    `Path list does not exactly match ${book} ${chapterStart}-${chapterEnd} at line ${mismatchIndex + 1}: expected ${expectedPaths[mismatchIndex] ?? "end of file"}, found ${listedPaths[mismatchIndex] ?? "end of file"}.`,
  );
}

const uploadArgs = [
  "--kind=strongs_mapping_chapter",
  `--path-list=${relativePathList}`,
  `--concurrency=${concurrency}`,
];
if (bucket) uploadArgs.push(`--bucket=${bucket}`);
if (execute) uploadArgs.push("--execute");

const auditArgs = [
  `--book=${book}`,
  `--chapter-start=${chapterStart}`,
  `--chapter-end=${chapterEnd}`,
  `--concurrency=${concurrency}`,
  `--base-url=${baseUrl ?? "https://example.invalid"}`,
  execute ? "--record" : "--dry-run",
];

console.log(`${execute ? "Migrating" : "Planning"} ${expectedPaths.length} Strong's chapter shards for ${book} ${chapterStart}-${chapterEnd}.`);
await run("upload-public-content-with-wrangler.mjs", uploadArgs);
await run("audit-strongs-storage-live.mjs", auditArgs);

if (execute) {
  console.log(`PASS ${book} ${chapterStart}-${chapterEnd} uploaded, checksum-verified, and recorded.`);
} else {
  console.log("Dry run complete. Add --execute and a live --base-url only after Wrangler authentication passes.");
}
