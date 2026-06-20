#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const manifestPath = path.resolve(process.cwd(), "data/study-tools/source-candidates.json");
const raw = await fs.readFile(manifestPath, "utf8");
const manifest = JSON.parse(raw);

const requiredTopLevel = ["last_reviewed", "policy", "source_candidates"];
const requiredCandidateFields = [
  "id",
  "tool",
  "title",
  "source_url",
  "rights_status",
  "license_summary",
  "commercial_use_status",
  "attribution_required",
  "review_status",
  "public_import_allowed",
  "next_action",
];

const errors = [];
const warnings = [];
const seenIds = new Set();
const allowedTools = new Set(["strongs", "tsk"]);
const allowedReviewStatuses = new Set(["Needs Review", "Approved For Staging", "Approved For Public Import", "Blocked"]);

for (const field of requiredTopLevel) {
  if (!manifest[field]) errors.push(`Manifest missing top-level field: ${field}`);
}

if (!Array.isArray(manifest.source_candidates)) {
  errors.push("Manifest source_candidates must be an array.");
} else {
  manifest.source_candidates.forEach((candidate, index) => {
    const row = index + 1;

    for (const field of requiredCandidateFields) {
      if (candidate[field] === undefined || candidate[field] === null || candidate[field] === "") {
        errors.push(`Candidate ${row} is missing ${field}.`);
      }
    }

    if (candidate.id) {
      if (seenIds.has(candidate.id)) errors.push(`Duplicate candidate id: ${candidate.id}`);
      seenIds.add(candidate.id);
    }

    if (candidate.tool && !allowedTools.has(candidate.tool)) {
      errors.push(`Candidate ${candidate.id ?? row} has unsupported tool: ${candidate.tool}`);
    }

    if (candidate.review_status && !allowedReviewStatuses.has(candidate.review_status)) {
      errors.push(`Candidate ${candidate.id ?? row} has unsupported review_status: ${candidate.review_status}`);
    }

    if (candidate.public_import_allowed === true && candidate.review_status !== "Approved For Public Import") {
      errors.push(`Candidate ${candidate.id ?? row} allows public import without Approved For Public Import status.`);
    }

    if (candidate.public_import_allowed === true && String(candidate.commercial_use_status).toLowerCase().includes("review")) {
      errors.push(`Candidate ${candidate.id ?? row} allows public import while commercial use is still under review.`);
    }

    if (candidate.review_status === "Approved For Public Import" && candidate.public_import_allowed !== true) {
      warnings.push(`Candidate ${candidate.id ?? row} is approved but public_import_allowed is not true.`);
    }

    if (String(candidate.source_url ?? "").startsWith("http") === false) {
      errors.push(`Candidate ${candidate.id ?? row} needs an external source_url.`);
    }
  });
}

console.log("Study tool source manifest validation");
console.table({
  candidates: manifest.source_candidates?.length ?? 0,
  errors: errors.length,
  warnings: warnings.length,
});

for (const warning of warnings) console.warn(`Warning: ${warning}`);
for (const error of errors) console.error(`Error: ${error}`);

if (errors.length) process.exit(1);
