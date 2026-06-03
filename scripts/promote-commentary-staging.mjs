#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const inputPath = process.argv.find((arg, index) => index > 1 && !arg.startsWith("--"));
const outputArg = process.argv.find((arg) => arg.startsWith("--output="));
const dryRun = process.argv.includes("--dry-run");

if (!inputPath) {
  console.error("Usage: npm run commentary:promote -- <staging-json> [--output=data/imports/name.json] [--dry-run]");
  process.exit(1);
}

const rows = JSON.parse(await readFile(inputPath, "utf8"));
if (!Array.isArray(rows)) throw new Error("Commentary staging file must be a JSON array.");

const verifiedRows = rows.filter((row) => String(row.review_status ?? "").trim() === "Verified");
const blockedRows = rows.length - verifiedRows.length;
const outputPath = outputArg?.replace("--output=", "") ?? `data/imports/${path.basename(inputPath).replace(/needs-review|staged/gi, "verified")}`;

console.table({
  total_rows: rows.length,
  verified_rows: verifiedRows.length,
  held_for_review: blockedRows,
  output: outputPath,
});

if (dryRun) {
  console.log("Dry run only. No public import file was written.");
  process.exit(0);
}

if (!verifiedRows.length) {
  console.log("No verified rows found. Nothing promoted.");
  process.exit(0);
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(verifiedRows, null, 2)}\n`);
console.log(`Promoted ${verifiedRows.length} verified commentary rows to ${outputPath}.`);
