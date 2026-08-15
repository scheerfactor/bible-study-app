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
const allowedPermissionStatuses = new Set([
  "Permission Granted - Scoped",
  "Public Policy - Official Links Only",
]);

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

  if (!allowedPermissionStatuses.has(record.permissionStatus)) {
    errors.push(`${label}: unsupported permissionStatus ${record.permissionStatus}`);
  }

  if (!String(record.reviewStatus).toLowerCase().includes("review")) {
    errors.push(`${label}: reviewStatus must keep title-level review visible`);
  }

  if (!Array.isArray(record.approvedPublicUse) || record.approvedPublicUse.length === 0) {
    errors.push(`${label}: approvedPublicUse must list the scoped approved uses`);
  }

  if (record.permissionStatus === "Public Policy - Official Links Only") {
    const approvedText = record.approvedPublicUse.join(" ").toLowerCase();
    for (const phrase of ["official link", "citation"]) {
      if (!approvedText.includes(phrase)) {
        errors.push(`${label}: public-policy records must limit approved use to ${phrase}`);
      }
    }
    if (approvedText.includes("hosting") || approvedText.includes("embed")) {
      errors.push(`${label}: public-policy records cannot approve hosting or embeds`);
    }
  }

  if (record.resourceFormat === "Official Audio Link") {
    if (!isValidUrl(record.sourcePageUrl)) errors.push(`${label}: official audio requires an https sourcePageUrl`);
    if (!String(record.sourceUrl).startsWith("https://teachings-cdn.thruthebible.io/")) {
      errors.push(`${label}: official TTB audio must use the TTB teachings CDN`);
    }
    if (!/^\d{1,2}:\d{2}$/.test(String(record.duration ?? ""))) {
      errors.push(`${label}: official audio duration must use M:SS or MM:SS`);
    }
    if (!String(record.notes).includes("By Dr. J. Vernon McGee © Thru the Bible, www.ttb.org.")) {
      errors.push(`${label}: official TTB audio notes must retain the required attribution`);
    }
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

const statusCounts = records.reduce((counts, record) => {
  counts[record.permissionStatus] = (counts[record.permissionStatus] || 0) + 1;
  return counts;
}, {});

console.log(
  `Licensed resource links validation OK: ${records.length} records in ${manifestPath} ` +
    `(${Object.entries(statusCounts)
      .map(([status, count]) => `${count} ${status}`)
      .join(", ")}).`,
);
