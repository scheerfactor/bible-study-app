import { existsSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const reportPath = ".next/diagnostics/route-bundle-stats.json";
const route = process.env.BUNDLE_AUDIT_ROUTE ?? "/";
const defaultBudget = 1.5 * 1024 * 1024;
const budget = Number(process.env.BUNDLE_BUDGET_GZIP_BYTES ?? defaultBudget);

if (!existsSync(reportPath)) {
  console.error(`Bundle audit report not found at ${reportPath}. Run npm run build first.`);
  process.exit(1);
}

const reports = JSON.parse(readFileSync(reportPath, "utf8"));
const report = reports.find((candidate) => candidate.route === route);

if (!report) {
  console.error(`Bundle audit route ${route} was not found in ${reportPath}.`);
  process.exit(1);
}

const gzipBytes = report.firstLoadChunkPaths.reduce((total, chunkPath) => {
  if (!existsSync(chunkPath)) {
    console.error(`Bundle audit chunk not found: ${chunkPath}`);
    process.exit(1);
  }
  return total + gzipSync(readFileSync(chunkPath), { level: 9 }).length;
}, 0);

const formatBytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

console.log(`Client bundle audit for ${route}`);
console.log(`- first-load uncompressed: ${formatBytes(report.firstLoadUncompressedJsBytes)}`);
console.log(`- first-load gzip: ${formatBytes(gzipBytes)}`);
console.log(`- gzip budget: ${formatBytes(budget)}`);
console.log(`- first-load chunks: ${report.firstLoadChunkPaths.length}`);

if (!Number.isFinite(budget) || budget <= 0) {
  console.error("BUNDLE_BUDGET_GZIP_BYTES must be a positive number.");
  process.exit(1);
}

if (gzipBytes > budget) {
  console.error(`Bundle audit failed: ${formatBytes(gzipBytes)} exceeds ${formatBytes(budget)}.`);
  process.exit(1);
}

console.log("Bundle audit passed.");
