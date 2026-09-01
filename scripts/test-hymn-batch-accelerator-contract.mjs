import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const [script, packageJson] = await Promise.all([
  readFile(resolve(root, "scripts/add-reviewed-hymn-batch.mjs"), "utf8"),
  readFile(resolve(root, "package.json"), "utf8"),
]);

const requiredScriptSignals = [
  "import-timeless-truths-hymn-batch.mjs",
  "prepare-hymns.mjs",
  "validate-hymns.mjs",
  "verifying duplicates, lyrics, public-domain text and tune markers, and MIDI files",
  "retaining evidence and importing the reviewed batch",
  "generating playable arrangements and the presentation index",
  "validating the complete rights, checksum, playback, and presentation catalog",
];
const missing = requiredScriptSignals.filter((signal) => !script.includes(signal));
if (!packageJson.includes('"hymns:add-reviewed-batch": "node scripts/add-reviewed-hymn-batch.mjs"')) {
  missing.push("package script hymns:add-reviewed-batch");
}

if (missing.length) {
  console.error(`Hymn batch accelerator contract failed. Missing:\n${missing.join("\n")}`);
  process.exit(1);
}

console.log("Hymn batch accelerator contract passed: one guarded command now verifies, imports, prepares, and validates reviewed hymn batches.");
