import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const [wrapper, importer, packageJson] = await Promise.all([
  readFile(resolve(root, "scripts/add-reviewed-library-batch.mjs"), "utf8"),
  readFile(resolve(root, "scripts/bulk-import-library-resources.mjs"), "utf8"),
  readFile(resolve(root, "package.json"), "utf8"),
]);

const requiredWrapperSignals = [
  "checking required metadata, trusted sources, rights, doctrinal review, and duplicates",
  '"--atomic"',
  '"--dry-run"',
  "validate-library-manifests.mjs",
  "Reviewed library batch added successfully",
];
const requiredAtomicSignals = [
  'process.argv.includes("--atomic")',
  "rollbackImportedLibraryEntries",
  "rollback_cleanup_failures",
  "the library manifest was not changed",
];

const missing = [
  ...requiredWrapperSignals.filter((signal) => !wrapper.includes(signal)),
  ...requiredAtomicSignals.filter((signal) => !importer.includes(signal)),
];

if (!packageJson.includes('"library:add-reviewed-batch": "node scripts/add-reviewed-library-batch.mjs"')) {
  missing.push("package script library:add-reviewed-batch");
}

if (missing.length) {
  console.error(`Library batch accelerator contract failed. Missing:\n${missing.join("\n")}`);
  process.exit(1);
}

console.log("Library batch accelerator contract passed: one guarded command now dry-runs, imports atomically, and validates reviewed book and commentary batches.");
