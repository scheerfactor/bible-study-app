import { spawnSync } from "node:child_process";
import { basename, resolve } from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);
const sourceArg = args.find((argument) => argument.startsWith("--source="));
const batchSizeArg = args.find((argument) => argument.startsWith("--batch-size="));
const apply = args.includes("--apply");

if (!sourceArg) {
  throw new Error("Usage: node scripts/add-reviewed-library-batch.mjs --source=path/to/reviewed-batch.csv [--batch-size=10] [--apply]");
}

const sourcePath = sourceArg.slice("--source=".length);
const reportName = basename(sourcePath).replace(/\.csv$/i, "-report.json");
const reportArg = `--report=data/library/manifests/${reportName}`;
const sharedArgs = [sourceArg, reportArg, "--atomic", ...(batchSizeArg ? [batchSizeArg] : [])];

function run(script, scriptArgs = []) {
  const result = spawnSync(process.execPath, [resolve(root, script), ...scriptArgs], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("Step 1/3: checking required metadata, trusted sources, rights, doctrinal review, and duplicates...");
run("scripts/bulk-import-library-resources.mjs", [...sharedArgs, "--dry-run"]);

if (!apply) {
  console.log("Verified dry run complete. Add --apply to download the reviewed resources atomically and validate the complete catalog.");
  process.exit(0);
}

console.log("Step 2/3: downloading and importing the reviewed batch as one atomic change...");
run("scripts/bulk-import-library-resources.mjs", sharedArgs);

console.log("Step 3/3: validating the complete public-domain and licensed library manifests...");
run("scripts/validate-library-manifests.mjs");

console.log("Reviewed library batch added successfully.");
