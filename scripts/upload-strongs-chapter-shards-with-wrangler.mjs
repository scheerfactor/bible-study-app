import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const shardDir = join(repoRoot, "data", "strongs", "mappings-by-chapter");
const execute = process.argv.includes("--execute");
const local = process.argv.includes("--local");
const bucketArg = process.argv.find((arg) => arg.startsWith("--bucket="));
const startAtArg = process.argv.find((arg) => arg.startsWith("--start-at="));
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
  let files = (await readdir(shardDir))
    .filter((file) => file.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (startAtArg) {
    const startAt = startAtArg.split("=").slice(1).join("=");
    const startFile = startAt.split("/").pop();
    const startIndex = files.findIndex((file) => file === startFile || `data/strongs/mappings-by-chapter/${file}` === startAt);
    if (startIndex === -1) {
      throw new Error(`Could not find --start-at shard: ${startAt}`);
    }
    files = files.slice(startIndex);
    console.log(`Resuming at ${files[0]} (${startIndex + 1}).`);
  }

  if (!execute) {
    console.log(`Dry run only. ${files.length} Strong's chapter shard files would be uploaded to R2 bucket "${bucket}".`);
    console.log(`Run: npm run storage:upload:strongs-shards -- --bucket=${bucket} --execute`);
    return;
  }

  let uploaded = 0;
  for (const file of files) {
    const storagePath = `data/strongs/mappings-by-chapter/${file}`;
    const sourcePath = join(shardDir, file);
    const args = [
      "wrangler",
      "r2",
      "object",
      "put",
      `${bucket}/${storagePath}`,
      "--file",
      sourcePath,
      "--content-type",
      "application/json; charset=utf-8",
    ];
    if (!local) args.push("--remote");
    await run("npx", args);
    uploaded += 1;
    if (uploaded % 25 === 0 || uploaded === files.length) {
      console.log(`Uploaded ${uploaded}/${files.length}`);
    }
  }

  console.log(`Upload complete: ${uploaded} Strong's chapter shards uploaded to ${bucket}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
