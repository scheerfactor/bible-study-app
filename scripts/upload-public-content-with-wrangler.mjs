import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const inventoryPath = join(repoRoot, "data", "storage", "public-content-storage-inventory.json");
const execute = process.argv.includes("--execute");
const local = process.argv.includes("--local");
const startAtArg = process.argv.find((arg) => arg.startsWith("--start-at="));
const bucketArg = process.argv.find((arg) => arg.startsWith("--bucket="));
const kindArg = process.argv.find((arg) => arg.startsWith("--kind="));
const pathPrefixArg = process.argv.find((arg) => arg.startsWith("--path-prefix="));
const bucket = bucketArg?.split("=").slice(1).join("=") || process.env.R2_BUCKET_PUBLIC_CONTENT || "fathers-business-bible-study-public";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run(command, args, attempt = 1) {
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
    if (attempt >= 3) throw error;
    const delayMs = attempt * 5000;
    console.warn(`Upload command failed. Retrying in ${delayMs / 1000}s (${attempt + 1}/3).`);
    await wait(delayMs);
    return run(command, args, attempt + 1);
  });
}

async function main() {
  const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
  const kindFilter = kindArg?.split("=").slice(1).join("=");
  const pathPrefixFilter = pathPrefixArg?.split("=").slice(1).join("=");
  let items = inventory.items
    .filter((item) => !item.missing)
    .filter((item) => !kindFilter || item.kind === kindFilter)
    .filter((item) => !pathPrefixFilter || String(item.storage_path ?? "").startsWith(pathPrefixFilter));
  if (startAtArg) {
    const startAt = startAtArg.split("=").slice(1).join("=");
    const startIndex = items.findIndex((item) => item.storage_path === startAt);
    if (startIndex === -1) {
      throw new Error(`Could not find --start-at path in inventory: ${startAt}`);
    }
    items = items.slice(startIndex);
    console.log(`Resuming at ${startAt} (${startIndex + 1}/${inventory.items.filter((item) => !item.missing).length}).`);
  }

  if (!execute) {
    console.log(`Dry run only. ${items.length} files would be uploaded to R2 bucket "${bucket}".`);
    if (kindFilter) console.log(`Kind filter: ${kindFilter}`);
    if (pathPrefixFilter) console.log(`Path prefix filter: ${pathPrefixFilter}`);
    console.table(inventory.summaries);
    console.log(`Run: npm run storage:upload:wrangler -- --bucket=${bucket} --execute`);
    return;
  }

  let uploaded = 0;
  for (const item of items) {
    const args = ["wrangler", "r2", "object", "put", `${bucket}/${item.storage_path}`, "--file", item.source_path, "--content-type", item.content_type];
    if (!local) args.push("--remote");
    await run("npx", args);
    uploaded += 1;
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
