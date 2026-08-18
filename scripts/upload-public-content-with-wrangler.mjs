import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stripProjectGutenbergBoilerplate } from "./library-utils.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const inventoryPath = join(repoRoot, "data", "storage", "public-content-storage-inventory.json");
const checkpointPath = join(repoRoot, "data", "storage", "wrangler-upload-checkpoint.json");
const execute = process.argv.includes("--execute");
const preflightOnly = process.argv.includes("--preflight-only");
const local = process.argv.includes("--local");
const hydrateStorageBacked = process.argv.includes("--hydrate-storage-backed");
const startAtArg = process.argv.find((arg) => arg.startsWith("--start-at="));
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const concurrencyArg = process.argv.find((arg) => arg.startsWith("--concurrency="));
const bucketArg = process.argv.find((arg) => arg.startsWith("--bucket="));
const kindArg = process.argv.find((arg) => arg.startsWith("--kind="));
const pathPrefixArg = process.argv.find((arg) => arg.startsWith("--path-prefix="));
const pathListArg = process.argv.find((arg) => arg.startsWith("--path-list="));
const bucket = bucketArg?.split("=").slice(1).join("=") || process.env.R2_BUCKET_PUBLIC_CONTENT || "fathers-business-bible-study-public";
const libraryManifestPath = join(repoRoot, "data", "library", "manifests", "curated-public-domain-resources.json");
const trustedStorageBackedHosts = new Set(["archive.org", "www.gutenberg.org"]);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run(command, args, attempt = 1, maxAttempts = 3) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: "inherit",
      shell: false,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  }).catch(async (error) => {
    if (attempt >= maxAttempts) throw error;
    const delayMs = attempt * 5000;
    console.warn(`Upload command failed. Retrying in ${delayMs / 1000}s (${attempt + 1}/${maxAttempts}).`);
    await wait(delayMs);
    return run(command, args, attempt + 1, maxAttempts);
  });
}

async function assertWranglerReady() {
  console.log("Checking Wrangler authentication...");
  try {
    await run("npx", ["wrangler", "whoami"], 1, 1);
  } catch (error) {
    throw new Error(
      `Wrangler authentication preflight failed. Run \`npx wrangler login\` or set CLOUDFLARE_API_TOKEN, then retry \`npm run storage:preflight\`. ${error.message}`,
    );
  }

  console.log(`Checking R2 bucket "${bucket}"...`);
  try {
    await run("npx", ["wrangler", "r2", "bucket", "info", bucket, "--json"], 1, 1);
  } catch (error) {
    throw new Error(
      `R2 bucket preflight failed for "${bucket}". Confirm the bucket name and account access, then retry \`npm run storage:preflight\`. ${error.message}`,
    );
  }
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function checksum(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function downloadText(url, attempt = 1, maxAttempts = 3) {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "FathersBusinessBibleStudy/0.1 verified-storage-migration" },
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) throw new Error(`Download failed ${response.status}: ${url}`);
    return response.text();
  } catch (error) {
    if (attempt >= maxAttempts) throw error;
    const delayMs = attempt * 5000;
    console.warn(`Storage-backed download failed. Retrying in ${delayMs / 1000}s (${attempt + 1}/${maxAttempts}).`);
    await wait(delayMs);
    return downloadText(url, attempt + 1, maxAttempts);
  }
}

async function hydrateLibraryText(item, entry, tempRoot) {
  if (!entry?.download_url) {
    throw new Error(`Storage-backed item has no recorded download URL: ${item.storage_path}`);
  }

  const url = new URL(entry.download_url);
  if (!trustedStorageBackedHosts.has(url.host)) {
    throw new Error(`Storage-backed download host is not trusted: ${url.host}`);
  }

  const downloadedText = await downloadText(url);
  let text;
  if (entry.text_processing === "source_text_preserved") {
    text = downloadedText;
  } else if (entry.text_processing === "project_gutenberg_boilerplate_removed") {
    text = stripProjectGutenbergBoilerplate(downloadedText).text;
  } else {
    throw new Error(`Unsupported storage-backed text processing: ${entry.text_processing || "missing"}`);
  }

  const buffer = Buffer.from(text, "utf8");
  const actualChecksum = checksum(buffer);
  if (buffer.byteLength !== item.size_bytes || actualChecksum !== item.checksum_sha256) {
    throw new Error(
      `Storage-backed verification failed for ${item.storage_path}: expected ${item.size_bytes} bytes / ${item.checksum_sha256}, got ${buffer.byteLength} bytes / ${actualChecksum}`,
    );
  }

  const tempPath = join(tempRoot, `${actualChecksum}.txt`);
  await writeFile(tempPath, buffer);
  return tempPath;
}

async function main() {
  const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
  const libraryEntries = hydrateStorageBacked
    ? JSON.parse(await readFile(libraryManifestPath, "utf8"))
    : [];
  const libraryEntriesByPath = new Map(
    libraryEntries.map((entry) => [entry.content_storage_path || entry.file_path, entry]),
  );
  const kindFilter = kindArg?.split("=").slice(1).join("=");
  const pathPrefixFilter = pathPrefixArg?.split("=").slice(1).join("=");
  const pathListValue = pathListArg?.split("=").slice(1).join("=") || "";
  const pathList = pathListValue
    ? new Set(
        (await readFile(resolve(repoRoot, pathListValue), "utf8"))
          .split(/\r?\n/)
          .map((value) => value.trim())
          .filter(Boolean),
      )
    : null;
  const limit = limitArg ? Number(limitArg.split("=").slice(1).join("=")) : 0;
  const concurrency = concurrencyArg ? Number(concurrencyArg.split("=").slice(1).join("=")) : 1;
  if (limitArg && (!Number.isInteger(limit) || limit < 1)) {
    throw new Error("--limit must be a positive integer.");
  }
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) {
    throw new Error("--concurrency must be an integer from 1 through 8.");
  }

  if (preflightOnly) {
    await assertWranglerReady();
    console.log(`Storage upload preflight passed for R2 bucket "${bucket}".`);
    return;
  }

  const allItems = inventory.items
    .filter((item) => !item.missing)
    .filter((item) => !kindFilter || item.kind === kindFilter)
    .filter((item) => !pathPrefixFilter || String(item.storage_path ?? "").startsWith(pathPrefixFilter))
    .filter((item) => !pathList || pathList.has(item.storage_path));
  if (pathList && allItems.length !== pathList.size) {
    const found = new Set(allItems.map((item) => item.storage_path));
    const missingPaths = [...pathList].filter((storagePath) => !found.has(storagePath));
    throw new Error(`Path list contains ${missingPaths.length} path(s) not found in the filtered inventory: ${missingPaths.join(", ")}`);
  }
  let startIndex = 0;
  let items = allItems;
  if (startAtArg) {
    const startAt = startAtArg.split("=").slice(1).join("=");
    startIndex = allItems.findIndex((item) => item.storage_path === startAt);
    if (startIndex === -1) {
      throw new Error(`Could not find --start-at path in inventory: ${startAt}`);
    }
    items = allItems.slice(startIndex);
    console.log(`Resuming at ${startAt} (${startIndex + 1}/${allItems.length}).`);
  }
  if (limit) {
    items = items.slice(0, limit);
  }

  if (!execute) {
    console.log(`Dry run only. ${items.length} files would be uploaded to R2 bucket "${bucket}".`);
    if (kindFilter) console.log(`Kind filter: ${kindFilter}`);
    if (pathPrefixFilter) console.log(`Path prefix filter: ${pathPrefixFilter}`);
    if (pathListValue) console.log(`Path list: ${pathListValue}`);
    if (limit) console.log(`Limit: ${limit}`);
    console.log(`Concurrency: ${concurrency}`);
    console.log(`Hydrate storage-backed library text: ${hydrateStorageBacked ? "yes" : "no"}`);
    console.table(inventory.summaries);
    console.log(`Run: npm run storage:upload:wrangler -- --bucket=${bucket} --execute`);
    return;
  }

  await assertWranglerReady();

  let uploaded = 0;
  let nextIndex = 0;
  let contiguousCompletedIndex = -1;
  const completedIndexes = new Set();
  const failures = [];
  let checkpointQueue = Promise.resolve();
  const tempRoot = hydrateStorageBacked
    ? await mkdtemp(join(tmpdir(), "bsa-storage-upload-"))
    : "";

  async function writeCheckpoint() {
    const absoluteUploadedThrough = startIndex + contiguousCompletedIndex + 1;
    const lastContiguousItem = contiguousCompletedIndex >= 0 ? items[contiguousCompletedIndex] : null;
    const nextItem = allItems[absoluteUploadedThrough] ?? null;
    const checkpoint = {
      updated_at: new Date().toISOString(),
      bucket,
      kind: kindFilter || "all",
      path_prefix: pathPrefixFilter || "",
      concurrency,
      uploaded_this_run: uploaded,
      failed_this_run: failures.length,
      failed_items: failures,
      absolute_uploaded_through: absoluteUploadedThrough,
      total_matching_items: allItems.length,
      last_uploaded_path: lastContiguousItem?.storage_path ?? "",
      next_start_at: nextItem?.storage_path ?? null,
      next_command: nextItem
        ? `npm run storage:upload:wrangler -- --bucket=${bucket}${kindFilter ? ` --kind=${kindFilter}` : ""}${pathPrefixFilter ? ` --path-prefix=${pathPrefixFilter}` : ""}${pathListValue ? ` --path-list=${pathListValue}` : ""} --start-at=${nextItem.storage_path}${limit ? ` --limit=${limit}` : ""}${concurrency > 1 ? ` --concurrency=${concurrency}` : ""}${hydrateStorageBacked ? " --hydrate-storage-backed" : ""} --execute`
        : null,
    };
    await mkdir(dirname(checkpointPath), { recursive: true });
    await writeFile(checkpointPath, `${JSON.stringify(checkpoint, null, 2)}\n`);
  }

  async function uploadWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      const item = items[index];
      try {
        let uploadPath = item.source_path;
        let hydrated = false;
        if (!(await pathExists(uploadPath))) {
          if (!hydrateStorageBacked || item.kind !== "library_text" || !item.storage_backed) {
            throw new Error(
              `Upload source is missing: ${item.source_path}. Use --hydrate-storage-backed only for checksum-recorded storage-backed library text.`,
            );
          }
          uploadPath = await hydrateLibraryText(item, libraryEntriesByPath.get(item.storage_path), tempRoot);
          hydrated = true;
        }

        try {
          const args = ["wrangler", "r2", "object", "put", `${bucket}/${item.storage_path}`, "--file", uploadPath, "--content-type", item.content_type];
          if (!local) args.push("--remote");
          await run("npx", args);
        } finally {
          if (hydrated) await rm(uploadPath, { force: true });
        }
      } catch (error) {
        failures.push({
          storage_path: item.storage_path,
          message: error instanceof Error ? error.message : String(error),
        });
        console.error(`Skipping failed upload for this pass: ${item.storage_path}`);
        continue;
      }
      uploaded += 1;
      completedIndexes.add(index);
      while (completedIndexes.has(contiguousCompletedIndex + 1)) {
        contiguousCompletedIndex += 1;
      }
      checkpointQueue = checkpointQueue.then(writeCheckpoint);
      await checkpointQueue;
      if (uploaded % 25 === 0 || uploaded === items.length) {
        console.log(`Uploaded ${uploaded}/${items.length}`);
      }
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  console.log(`Uploading with concurrency ${workerCount}.`);
  try {
    const results = await Promise.allSettled(Array.from({ length: workerCount }, () => uploadWorker()));
    await checkpointQueue;
    await writeCheckpoint();
    const failed = results.find((result) => result.status === "rejected");
    if (failed) throw failed.reason;
    if (failures.length) {
      throw new Error(`Upload pass completed with ${failures.length} failed item(s):\n${JSON.stringify(failures, null, 2)}`);
    }
  } finally {
    if (tempRoot) await rm(tempRoot, { recursive: true, force: true });
  }

  console.log(`Upload complete: ${uploaded} files uploaded to ${bucket}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
