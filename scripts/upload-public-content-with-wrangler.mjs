import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const inventoryPath = join(repoRoot, "data", "storage", "public-content-storage-inventory.json");
const execute = process.argv.includes("--execute");
const bucketArg = process.argv.find((arg) => arg.startsWith("--bucket="));
const bucket = bucketArg?.split("=").slice(1).join("=") || process.env.R2_BUCKET_PUBLIC_CONTENT || "fathers-business-bible-study-public";

function run(command, args) {
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
  });
}

async function main() {
  const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
  const items = inventory.items.filter((item) => !item.missing);

  if (!execute) {
    console.log(`Dry run only. ${items.length} files would be uploaded to R2 bucket "${bucket}".`);
    console.table(inventory.summaries);
    console.log(`Run: npm run storage:upload:wrangler -- --bucket=${bucket} --execute`);
    return;
  }

  let uploaded = 0;
  for (const item of items) {
    await run("npx", ["wrangler", "r2", "object", "put", `${bucket}/${item.storage_path}`, "--file", item.source_path, "--content-type", item.content_type]);
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
