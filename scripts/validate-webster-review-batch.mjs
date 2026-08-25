#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const overlaysPath = "data/generated/websters-1828-reviewed-overrides.json";
const batchPath = process.argv.slice(2).find((value) => !value.startsWith("--"));

if (!batchPath) {
  console.error("Usage: node scripts/validate-webster-review-batch.mjs path/to/review-batch.json");
  process.exit(1);
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

const highRiskPatterns = [
  { id: "split_the", pattern: /\b(?:tlje|tlie|tliat|tliis|tliese|tliem|tliere)\b/i },
  { id: "split_wh_words", pattern: /\b(?:whicli|wliich|whicb|wliat|wlio|wliere|wlieii|witli)\b/i },
  { id: "replacement_marks", pattern: /[�■]/ },
  { id: "known_common_ocr", pattern: /\b(?:ajie|manmr|insigniticant|trilling|liiw|aiid|aiiy|iiot|iiito|mulet|hinds|illnature)\b/i },
  { id: "sacred_name_spacing", pattern: /\b(?:Ood|G od|L ord|J esus|C hrist)\b/ },
];

const overlays = JSON.parse(await readFile(overlaysPath, "utf8"));
const batch = JSON.parse(await readFile(batchPath, "utf8"));
const errors = [];

if (!Array.isArray(overlays)) errors.push(`${overlaysPath} must contain an array.`);
if (!Array.isArray(batch.entries) || !batch.entries.length) errors.push(`${batchPath} must contain entries.`);
if (!String(batch.rights_basis ?? "").toLowerCase().includes("public domain")) {
  errors.push("Batch rights_basis must state the public-domain basis.");
}

const overlayCounts = new Map();
for (const overlay of overlays) {
  const key = normalize(overlay.normalized_headword || overlay.headword);
  overlayCounts.set(key, (overlayCounts.get(key) ?? 0) + 1);
}
for (const [key, count] of overlayCounts) {
  if (count > 1) errors.push(`Duplicate reviewed overlay: ${key} (${count}).`);
}

const seenBatchHeadwords = new Set();
for (const entry of batch.entries ?? []) {
  const lookupHeadword = normalize(entry.lookup_headword);
  if (!lookupHeadword) {
    errors.push(`Batch entry is missing lookup_headword: ${JSON.stringify(entry)}`);
    continue;
  }
  if (seenBatchHeadwords.has(lookupHeadword)) errors.push(`Duplicate batch lookup_headword: ${lookupHeadword}.`);
  seenBatchHeadwords.add(lookupHeadword);

  const overlay = overlays.find(
    (candidate) => normalize(candidate.normalized_headword || candidate.headword) === lookupHeadword,
  );
  if (!overlay) {
    errors.push(`No reviewed overlay found for ${lookupHeadword}.`);
    continue;
  }
  if (overlay.review_status !== "reviewed_overlay") errors.push(`${lookupHeadword}: review_status is not reviewed_overlay.`);
  if (overlay.source_file !== entry.source_url) errors.push(`${lookupHeadword}: source URL does not match provenance.`);
  if (overlay.source_line_start !== entry.source_line_start || overlay.source_line_end !== entry.source_line_end) {
    errors.push(`${lookupHeadword}: source paragraph span does not match provenance.`);
  }
  if (!normalize(overlay.definition).startsWith(normalize(entry.exact_entry_heading))) {
    errors.push(`${lookupHeadword}: definition does not begin with the documented entry heading.`);
  }
  if (entry.exact_source_match !== true) errors.push(`${lookupHeadword}: exact_source_match must be true.`);
  for (const signal of highRiskPatterns) {
    if (signal.pattern.test(overlay.definition ?? "")) errors.push(`${lookupHeadword}: residual ${signal.id} signal.`);
  }
}

if (errors.length) {
  console.error(`Webster review batch validation failed (${errors.length} error${errors.length === 1 ? "" : "s"}).`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Webster review batch validation passed: ${batch.entries.length} entries, ${overlays.length} unique overlays.`);
console.log(`Batch: ${batchPath}`);
