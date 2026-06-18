#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const manifestPath = process.argv[2] || "data/media/manifests/media-intake-candidates.json";

const allowedKinds = new Set(["Audiobook", "Sermon Audio", "Sermon Video", "Teaching Series", "Bible Audio"]);
const allowedRightsStatuses = new Set([
  "Public Domain",
  "Permission Needed",
  "Contacted",
  "Negotiating",
  "Approved",
  "Denied",
  "Personal Use Only",
  "Do Not Import",
]);
const allowedIntakeStatuses = new Set([
  "Draft",
  "Needs Rights Review",
  "Ready For Storage",
  "Uploaded To R2",
  "Approved For Public Use",
  "Personal Use Only",
  "Do Not Publish",
]);
const allowedVisibility = new Set(["Public after review", "Private admin draft", "Personal use only"]);
const publicReadyStatuses = new Set(["Uploaded To R2", "Approved For Public Use"]);

const raw = await readFile(manifestPath, "utf8");
const records = JSON.parse(raw);
if (!Array.isArray(records)) {
  console.error("Media manifest must be a JSON array.");
  process.exit(1);
}

const errors = [];
const warnings = [];
const seenIds = new Set();
const seenStoragePaths = new Set();

function requireField(record, index, field) {
  if (!String(record[field] ?? "").trim()) {
    errors.push(`record ${index + 1}: missing ${field}`);
  }
}

function isValidUrl(value) {
  if (!value) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

records.forEach((record, index) => {
  for (const field of [
    "id",
    "kind",
    "title",
    "creator",
    "duration",
    "rightsStatus",
    "intakeStatus",
    "storageBucket",
    "storagePath",
    "transcriptPath",
    "coverPath",
    "visibility",
    "notes",
    "nextAction",
  ]) {
    requireField(record, index, field);
  }

  if (seenIds.has(record.id)) errors.push(`record ${index + 1}: duplicate id ${record.id}`);
  seenIds.add(record.id);

  if (!allowedKinds.has(record.kind)) errors.push(`record ${index + 1}: unsupported kind ${record.kind}`);
  if (!allowedRightsStatuses.has(record.rightsStatus)) errors.push(`record ${index + 1}: unsupported rightsStatus ${record.rightsStatus}`);
  if (!allowedIntakeStatuses.has(record.intakeStatus)) errors.push(`record ${index + 1}: unsupported intakeStatus ${record.intakeStatus}`);
  if (!allowedVisibility.has(record.visibility)) errors.push(`record ${index + 1}: unsupported visibility ${record.visibility}`);
  if (!isValidUrl(record.sourceUrl)) errors.push(`record ${index + 1}: sourceUrl is not a valid URL`);

  if (!record.storagePath?.match(/^(audio|video)\//)) {
    errors.push(`record ${index + 1}: storagePath must begin with audio/ or video/`);
  }

  if (seenStoragePaths.has(record.storagePath)) warnings.push(`record ${index + 1}: duplicate storagePath ${record.storagePath}`);
  seenStoragePaths.add(record.storagePath);

  if (record.kind === "Sermon Video" && !record.storagePath.startsWith("video/")) {
    errors.push(`record ${index + 1}: Sermon Video storagePath should begin with video/`);
  }

  if (record.kind !== "Sermon Video" && !record.storagePath.startsWith("audio/")) {
    errors.push(`record ${index + 1}: audio-oriented media storagePath should begin with audio/`);
  }

  if (publicReadyStatuses.has(record.intakeStatus)) {
    if (!["Public Domain", "Approved"].includes(record.rightsStatus)) {
      errors.push(`record ${index + 1}: public-ready media requires Public Domain or Approved rights`);
    }
    if (record.visibility !== "Public after review") {
      warnings.push(`record ${index + 1}: public-ready media is not marked Public after review`);
    }
    if (record.storagePath.includes("{")) {
      errors.push(`record ${index + 1}: public-ready media cannot use placeholder storagePath`);
    }
  }

  if (record.rightsStatus === "Permission Needed" && publicReadyStatuses.has(record.intakeStatus)) {
    errors.push(`record ${index + 1}: Permission Needed media cannot be uploaded/public-ready`);
  }

  if (record.rightsStatus === "Personal Use Only" && record.visibility !== "Personal use only" && record.intakeStatus === "Approved For Public Use") {
    errors.push(`record ${index + 1}: Personal Use Only media cannot be approved for public use`);
  }

  if (record.kind === "Bible Audio" && record.rightsStatus !== "Approved" && record.rightsStatus !== "Permission Needed") {
    warnings.push(`record ${index + 1}: Bible Audio should keep explicit licensing review visible`);
  }
});

console.log("Media manifest validation summary");
console.table({
  records: records.length,
  errors: errors.length,
  warnings: warnings.length,
  public_ready: records.filter((record) => publicReadyStatuses.has(record.intakeStatus)).length,
  rights_blocked: records.filter((record) => record.rightsStatus === "Permission Needed" || record.intakeStatus === "Needs Rights Review").length,
});

if (warnings.length) {
  console.log("Warnings");
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (errors.length) {
  console.error("Errors");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Media manifest validation OK: ${records.length} intake records checked.`);
