#!/usr/bin/env node
import { readFile, stat } from "node:fs/promises";

const manifestPath = process.argv[2] || "data/library/manifests/licensed-resource-links.json";
const requiredFields = [
  "id",
  "title",
  "author",
  "publisherMinistry",
  "category",
  "collection",
  "sourceUrl",
  "permissionStatus",
  "reviewStatus",
  "approvedPublicUse",
  "notApprovedWithoutFollowup",
  "rightsEvidence",
  "recommendedUse",
  "notes",
];

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

const records = JSON.parse(await readFile(manifestPath, "utf8"));
if (!Array.isArray(records)) throw new Error("Licensed resource links manifest must be an array.");

const errors = [];
const ids = new Set();
const urls = new Set();

for (const [index, record] of records.entries()) {
  const label = `record ${index + 1} (${record.title ?? "untitled"})`;

  for (const field of requiredFields) {
    if (record[field] === undefined || record[field] === null || record[field] === "") {
      errors.push(`${label}: missing ${field}`);
    }
  }

  if (ids.has(record.id)) errors.push(`${label}: duplicate id ${record.id}`);
  ids.add(record.id);

  if (!isValidUrl(record.sourceUrl)) errors.push(`${label}: sourceUrl must be an https URL`);
  if (urls.has(record.sourceUrl)) errors.push(`${label}: duplicate sourceUrl ${record.sourceUrl}`);
  urls.add(record.sourceUrl);

  if (record.permissionStatus !== "Permission Granted - Scoped") {
    errors.push(`${label}: permissionStatus must be Permission Granted - Scoped`);
  }

  if (!String(record.reviewStatus).toLowerCase().includes("review")) {
    errors.push(`${label}: reviewStatus must keep title-level review visible`);
  }

  if (!Array.isArray(record.approvedPublicUse) || record.approvedPublicUse.length === 0) {
    errors.push(`${label}: approvedPublicUse must list the scoped approved uses`);
  }

  if (!Array.isArray(record.notApprovedWithoutFollowup) || record.notApprovedWithoutFollowup.length === 0) {
    errors.push(`${label}: notApprovedWithoutFollowup must preserve broader-rights limits`);
  }

  const blockedText = record.notApprovedWithoutFollowup.join(" ").toLowerCase();
  for (const phrase of ["full-text", "audio", "tts", "paid"]) {
    if (!blockedText.includes(phrase)) errors.push(`${label}: notApprovedWithoutFollowup should mention ${phrase}`);
  }

  try {
    await stat(record.rightsEvidence);
  } catch {
    errors.push(`${label}: rightsEvidence file does not exist: ${record.rightsEvidence}`);
  }
}

if (errors.length) {
  console.error(`Licensed resource links validation failed for ${manifestPath}`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Licensed resource links validation OK: ${records.length} scoped licensed resources in ${manifestPath}.`);
