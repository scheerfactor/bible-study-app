import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);
const manifestArg = args.find((argument) => argument.startsWith("--manifest="));
const apply = args.includes("--apply");

if (!manifestArg) {
  throw new Error("Usage: node scripts/add-reviewed-hymn-batch.mjs --manifest=path/to/batch.json [--apply]");
}

function run(script, scriptArgs = []) {
  const result = spawnSync(process.execPath, [resolve(root, script), ...scriptArgs], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("Step 1/4: verifying duplicates, lyrics, public-domain text and tune markers, and MIDI files...");
run("scripts/import-timeless-truths-hymn-batch.mjs", [manifestArg]);

if (!apply) {
  console.log("Verified dry run complete. Add --apply to import, prepare playback, and validate the complete catalog.");
  process.exit(0);
}

console.log("Step 2/4: retaining evidence and importing the reviewed batch...");
run("scripts/import-timeless-truths-hymn-batch.mjs", [manifestArg, "--apply"]);

console.log("Step 3/4: generating playable arrangements and the presentation index...");
run("scripts/prepare-hymns.mjs");

console.log("Step 4/4: validating the complete rights, checksum, playback, and presentation catalog...");
run("scripts/validate-hymns.mjs");

console.log("Reviewed hymn batch added successfully.");
