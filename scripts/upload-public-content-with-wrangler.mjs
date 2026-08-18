import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const inventoryPath = join(repoRoot, "data", "storage", "public-content-storage-inventory.json");
const checkpointPath = join(repoRoot, "data", "storage", "wrangler-upload-checkpoint.json");
const execute = process.argv.includes("--execute");
const preflightOnly = process.argv.includes("--preflight-only");
const local = process.argv.includes("--local");
const startAtArg = process.argv.find((arg) => arg.startsWith("--start-at="));
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const bucketArg = process.argv.find((arg) => arg.startsWith("--bucket="));
const kindArg = process.argv.find((arg) => arg.startsWith("--kind="));
const pathPrefixArg = process.argv.find((arg) => arg.startsWith("--path-prefix="));
const bucket = bucketArg?.split("=").slice(1).join("=") || process.env.R2_BUCKET_PUBLIC_CONTENT || "fathers-business-bible-study-public";

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

async function main() {
  const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
  const kindFilter = kindArg?.split("=").slice(1).join("=");
  const pathPrefixFilter = pathPrefixArg?.split("=").slice(1).join("=");
  const limit = limitArg ? Number(limitArg.split("=").slice(1).join("=")) : 0;
  if (limitArg && (!Number.isInteger(limit) || limit < 1)) {
    throw new Error("--limit must be a positive integer.");
  }

  if (preflightOnly) {
    await assertWranglerReady();
    console.log(`Storage upload preflight passed for R2 bucket "${bucket}".`);
    return;
  }

  const allItems = inventory.items
    .filter((item) => !item.missing)
    .filter((item) => !kindFilter || item.kind === kindFilter)
    .filter((item) => !pathPrefixFilter || String(item.storage_path ?? "").startsWith(pathPrefixFilter));
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
    if (limit) console.log(`Limit: ${limit}`);
    console.table(inventory.summaries);
    console.log(`Run: npm run storage:upload:wrangler -- --bucket=${bucket} --execute`);
    return;
  }

  await assertWranglerReady();

  let uploaded = 0;
  let lastUploadedPath = "";
  for (const [index, item] of items.entries()) {
    const args = ["wrangler", "r2", "object", "put", `${bucket}/${item.storage_path}`, "--file", item.source_path, "--content-type", item.content_type];
    if (!local) args.push("--remote");
    await run("npx", args);
    uploaded += 1;
    lastUploadedPath = item.storage_path;
    const nextItem = allItems[startIndex + index + 1] ?? null;
    const checkpoint = {
      updated_at: new Date().toISOString(),
      bucket,
      kind: kindFilter || "all",
      path_prefix: pathPrefixFilter || "",
      uploaded_this_run: uploaded,
      absolute_uploaded_through: startIndex + index + 1,
      total_matching_items: allItems.length,
      last_uploaded_path: lastUploadedPath,
      next_start_at: nextItem?.storage_path ?? null,
      next_command: nextItem
        ? `npm run storage:upload:wrangler -- --bucket=${bucket}${kindFilter ? ` --kind=${kindFilter}` : ""}${pathPrefixFilter ? ` --path-prefix=${pathPrefixFilter}` : ""} --start-at=${nextItem.storage_path}${limit ? ` --limit=${limit}` : ""} --execute`
        : null,
    };
    await mkdir(dirname(checkpointPath), { recursive: true });
    await writeFile(checkpointPath, `${JSON.stringify(checkpoint, null, 2)}\n`);
    if (uploaded % 50 === 0 || uploaded === items.length) {
      console.log(`Uploaded ${uploaded}/${items.length}`);
    }
  }

  console.log(`Upload complete: ${uploaded} files uploaded to ${bucket}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
