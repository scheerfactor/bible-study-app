#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const manifestPath = process.argv[2] || "data/media/manifests/media-intake-candidates.json";
const audiobookPilotPath = process.argv[3] || "data/media/manifests/audiobook-pilots.json";
const uploadedPilotPath = process.argv[4] || "data/media/manifests/uploaded-public-domain-audio-pilots.json";

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
const allowedSegmentStatuses = new Set(["Planned", "Cleanup Needed", "Ready To Record", "Recorded", "Uploaded", "Approved"]);
const allowedUploadedPilotStatuses = new Set(["Uploaded Pilot", "Approved", "Archived"]);
const allowedChapterMarkerStatuses = new Set(["Estimated", "Verified"]);

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
const seenTtbFeedGuids = new Set();
const seenTtbHashes = new Set();

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

function durationToSeconds(value) {
  if (!value) return null;
  const parts = String(value).split(":").map((part) => Number(part));
  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !Number.isFinite(part) || part < 0)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
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

  const isOfficialTtbSermon = record.kind === "Sermon Audio" && String(record.sourceUrl).startsWith("https://teachings-cdn.thruthebible.io/");
  if (isOfficialTtbSermon) {
    for (const field of ["sourcePageUrl", "feedUrl", "feedGuid", "contentType", "sizeBytes", "sha256", "etag", "requiredAttribution", "rightsEvidence"]) {
      requireField(record, index, field);
    }
    if (!String(record.feedUrl).startsWith("https://cmp.thruthebible.io/")) {
      errors.push(`record ${index + 1}: official TTB sermon feedUrl must use the official TTB feed host`);
    }
    if (record.feedGuid !== record.sourceUrl.split("/").pop()) {
      errors.push(`record ${index + 1}: official TTB sermon feedGuid must match the official enclosure URL`);
    }
    if (record.requiredAttribution !== "By Dr. J. Vernon McGee © Thru the Bible, www.ttb.org.") {
      errors.push(`record ${index + 1}: official TTB sermon must retain the required attribution exactly`);
    }
    if (!Number.isInteger(record.sizeBytes) || record.sizeBytes < 1) {
      errors.push(`record ${index + 1}: official TTB sermon sizeBytes must be a positive integer`);
    }
    if (!/^[a-f0-9]{64}$/.test(String(record.sha256))) {
      errors.push(`record ${index + 1}: official TTB sermon sha256 must be a lowercase SHA-256 digest`);
    }
    if (record.contentType !== "audio/mp4" || !String(record.storagePath).endsWith(".m4a")) {
      errors.push(`record ${index + 1}: verified TTB AAC/MP4 audio must use audio/mp4 metadata and a .m4a storage path`);
    }
    if (seenTtbFeedGuids.has(record.feedGuid)) errors.push(`record ${index + 1}: duplicate official TTB feedGuid ${record.feedGuid}`);
    seenTtbFeedGuids.add(record.feedGuid);
    if (seenTtbHashes.has(record.sha256)) errors.push(`record ${index + 1}: duplicate official TTB audio hash ${record.sha256}`);
    seenTtbHashes.add(record.sha256);

    if (record.passageIndexed === true) {
      for (const field of ["passage", "passageEvidenceUrl"]) requireField(record, index, field);
      if (!String(record.passageEvidenceUrl).startsWith("https://ttb.org/") && !String(record.passageEvidenceUrl).startsWith("https://www.ttb.org/")) {
        errors.push(`record ${index + 1}: passage-indexed TTB sermon must cite an official TTB passage source`);
      }
    }
  }
});

async function validateAudiobookPilots() {
  let pilotRaw = "[]";
  try {
    pilotRaw = await readFile(audiobookPilotPath, "utf8");
  } catch {
    warnings.push(`audiobook pilot manifest not found at ${audiobookPilotPath}`);
    return { pilotCount: 0, segmentCount: 0 };
  }

  const pilots = JSON.parse(pilotRaw);
  if (!Array.isArray(pilots)) {
    errors.push("Audiobook pilot manifest must be a JSON array.");
    return { pilotCount: 0, segmentCount: 0 };
  }

  const recordIds = new Set(records.map((record) => record.id));
  const seenPilotIds = new Set();
  let segmentCount = 0;

  for (const [pilotIndex, pilot] of pilots.entries()) {
    const pilotLabel = `audiobook pilot ${pilotIndex + 1}`;
    for (const field of [
      "id",
      "mediaRecordId",
      "libraryTitle",
      "libraryAuthor",
      "libraryFilePath",
      "sourceUrl",
      "rightsEvidence",
      "pilotStatus",
      "textCleanupStatus",
      "narrationStatus",
      "estimatedDuration",
      "publicReadiness",
    ]) {
      if (!String(pilot[field] ?? "").trim()) errors.push(`${pilotLabel}: missing ${field}`);
    }

    if (seenPilotIds.has(pilot.id)) errors.push(`${pilotLabel}: duplicate id ${pilot.id}`);
    seenPilotIds.add(pilot.id);

    if (!recordIds.has(pilot.mediaRecordId)) errors.push(`${pilotLabel}: mediaRecordId ${pilot.mediaRecordId} does not match an intake record`);
    if (!isValidUrl(pilot.sourceUrl)) errors.push(`${pilotLabel}: sourceUrl is not a valid URL`);
    if (!Array.isArray(pilot.pilotSteps) || pilot.pilotSteps.length < 3) errors.push(`${pilotLabel}: pilotSteps must include at least 3 steps`);
    if (!Array.isArray(pilot.segments) || pilot.segments.length === 0) errors.push(`${pilotLabel}: segments must not be empty`);

    let libraryText = "";
    try {
      libraryText = await readFile(pilot.libraryFilePath, "utf8");
    } catch {
      errors.push(`${pilotLabel}: libraryFilePath does not exist (${pilot.libraryFilePath})`);
    }

    const seenSegmentNumbers = new Set();
    const seenAudioPaths = new Set();
    for (const [segmentIndex, segment] of (pilot.segments ?? []).entries()) {
      segmentCount += 1;
      const segmentLabel = `${pilotLabel} segment ${segmentIndex + 1}`;
      for (const field of ["number", "title", "textAnchor", "audioPath", "transcriptPath", "status", "estimatedMinutes", "notes"]) {
        if (segment[field] === undefined || segment[field] === null || String(segment[field]).trim() === "") {
          errors.push(`${segmentLabel}: missing ${field}`);
        }
      }

      if (seenSegmentNumbers.has(segment.number)) errors.push(`${segmentLabel}: duplicate segment number ${segment.number}`);
      seenSegmentNumbers.add(segment.number);

      if (!Number.isInteger(segment.number) || segment.number < 1) errors.push(`${segmentLabel}: number must be a positive integer`);
      if (!Number.isFinite(segment.estimatedMinutes) || segment.estimatedMinutes < 1) errors.push(`${segmentLabel}: estimatedMinutes must be at least 1`);
      if (!allowedSegmentStatuses.has(segment.status)) errors.push(`${segmentLabel}: unsupported status ${segment.status}`);
      if (!String(segment.audioPath ?? "").startsWith("audio/") || !String(segment.audioPath ?? "").endsWith(".mp3")) {
        errors.push(`${segmentLabel}: audioPath must start with audio/ and end with .mp3`);
      }
      if (!String(segment.transcriptPath ?? "").startsWith("transcripts/") || !String(segment.transcriptPath ?? "").endsWith(".md")) {
        errors.push(`${segmentLabel}: transcriptPath must start with transcripts/ and end with .md`);
      }
      if (seenAudioPaths.has(segment.audioPath)) warnings.push(`${segmentLabel}: duplicate audioPath ${segment.audioPath}`);
      seenAudioPaths.add(segment.audioPath);
      if (libraryText && !libraryText.includes(segment.textAnchor)) warnings.push(`${segmentLabel}: textAnchor not found in ${pilot.libraryFilePath}`);
      if (["Ready To Record", "Recorded", "Uploaded", "Approved"].includes(segment.status)) {
        try {
          await readFile(segment.transcriptPath, "utf8");
        } catch {
          errors.push(`${segmentLabel}: ${segment.status} requires an existing transcript file (${segment.transcriptPath})`);
        }
      }
    }
  }

  return { pilotCount: pilots.length, segmentCount };
}

const audiobookPilotSummary = await validateAudiobookPilots();

async function validateUploadedAudioPilots() {
  let uploadedRaw = "[]";
  try {
    uploadedRaw = await readFile(uploadedPilotPath, "utf8");
  } catch {
    warnings.push(`uploaded audio pilot manifest not found at ${uploadedPilotPath}`);
    return { uploadedCount: 0, uploadedBytes: 0 };
  }

  const uploadedPilots = JSON.parse(uploadedRaw);
  if (!Array.isArray(uploadedPilots)) {
    errors.push("Uploaded audio pilot manifest must be a JSON array.");
    return { uploadedCount: 0, uploadedBytes: 0 };
  }

  const seenUploadedIds = new Set();
  const seenUploadedPaths = new Set();
  let uploadedBytes = 0;
  let chapterMarkerCount = 0;
  let estimatedChapterMarkerCount = 0;
  let verifiedChapterMarkerCount = 0;

  for (const [pilotIndex, pilot] of uploadedPilots.entries()) {
    const pilotLabel = `uploaded audio pilot ${pilotIndex + 1}`;
    for (const field of [
      "id",
      "workTitle",
      "segmentTitle",
      "creator",
      "kind",
      "category",
      "sourceUrl",
      "sourceFileUrl",
      "rightsStatus",
      "rightsEvidence",
      "storageBucket",
      "storagePath",
      "publicUrl",
      "contentType",
      "sizeBytes",
      "visibility",
      "intakeStatus",
      "recommendedUse",
      "nextAction",
    ]) {
      if (pilot[field] === undefined || pilot[field] === null || String(pilot[field]).trim() === "") {
        errors.push(`${pilotLabel}: missing ${field}`);
      }
    }

    if (seenUploadedIds.has(pilot.id)) errors.push(`${pilotLabel}: duplicate id ${pilot.id}`);
    seenUploadedIds.add(pilot.id);

    if (seenUploadedPaths.has(pilot.storagePath)) warnings.push(`${pilotLabel}: duplicate storagePath ${pilot.storagePath}`);
    seenUploadedPaths.add(pilot.storagePath);

    if (!allowedKinds.has(pilot.kind)) errors.push(`${pilotLabel}: unsupported kind ${pilot.kind}`);
    if (!String(pilot.rightsStatus ?? "").startsWith("Public Domain")) {
      errors.push(`${pilotLabel}: uploaded public-domain pilot must keep Public Domain rightsStatus`);
    }
    if (!allowedUploadedPilotStatuses.has(pilot.intakeStatus)) {
      errors.push(`${pilotLabel}: unsupported intakeStatus ${pilot.intakeStatus}`);
    }
    if (pilot.visibility !== "Private admin draft" && pilot.visibility !== "Public after review") {
      errors.push(`${pilotLabel}: visibility must be Private admin draft or Public after review`);
    }
    if (!isValidUrl(pilot.sourceUrl)) errors.push(`${pilotLabel}: sourceUrl is not a valid URL`);
    if (!isValidUrl(pilot.sourceFileUrl)) errors.push(`${pilotLabel}: sourceFileUrl is not a valid URL`);
    if (!isValidUrl(pilot.publicUrl)) errors.push(`${pilotLabel}: publicUrl is not a valid URL`);
    if (!String(pilot.storagePath ?? "").startsWith("audio/") || !String(pilot.storagePath ?? "").endsWith(".mp3")) {
      errors.push(`${pilotLabel}: storagePath must start with audio/ and end with .mp3`);
    }
    if (pilot.contentType !== "audio/mpeg") errors.push(`${pilotLabel}: contentType must be audio/mpeg`);
    if (!Number.isInteger(pilot.sizeBytes) || pilot.sizeBytes < 1) errors.push(`${pilotLabel}: sizeBytes must be a positive integer`);
    uploadedBytes += Number(pilot.sizeBytes) || 0;

    if (pilot.kind === "Bible Audio") {
      const durationSeconds = durationToSeconds(pilot.duration);
      if (durationSeconds === null) errors.push(`${pilotLabel}: Bible Audio requires a parseable duration like mm:ss or h:mm:ss`);

      if (pilot.chapterMarkers !== undefined) {
        if (!Array.isArray(pilot.chapterMarkers)) {
          errors.push(`${pilotLabel}: chapterMarkers must be an array when present`);
        } else if (pilot.chapterMarkers.length === 0) {
          errors.push(`${pilotLabel}: chapterMarkers must not be empty when present`);
        } else {
          let previousMarker = null;
          for (const [markerIndex, marker] of pilot.chapterMarkers.entries()) {
            const markerLabel = `${pilotLabel} chapter marker ${markerIndex + 1}`;
            chapterMarkerCount += 1;

            for (const field of ["book", "chapter", "startSeconds", "endSeconds", "status", "method"]) {
              if (marker[field] === undefined || marker[field] === null || String(marker[field]).trim() === "") {
                errors.push(`${markerLabel}: missing ${field}`);
              }
            }

            if (!Number.isInteger(marker.chapter) || marker.chapter < 1) errors.push(`${markerLabel}: chapter must be a positive integer`);
            if (!Number.isFinite(marker.startSeconds) || marker.startSeconds < 0) errors.push(`${markerLabel}: startSeconds must be a non-negative number`);
            if (!Number.isFinite(marker.endSeconds) || marker.endSeconds <= marker.startSeconds) {
              errors.push(`${markerLabel}: endSeconds must be greater than startSeconds`);
            }
            if (!allowedChapterMarkerStatuses.has(marker.status)) errors.push(`${markerLabel}: unsupported status ${marker.status}`);
            if (marker.status === "Estimated") estimatedChapterMarkerCount += 1;
            if (marker.status === "Verified") verifiedChapterMarkerCount += 1;
            if (durationSeconds !== null && marker.endSeconds > durationSeconds + 1) {
              errors.push(`${markerLabel}: endSeconds exceeds pilot duration ${pilot.duration}`);
            }

            if (previousMarker) {
              if (marker.book !== previousMarker.book) errors.push(`${markerLabel}: all markers in a range file must use the same book`);
              if (marker.chapter !== previousMarker.chapter + 1) errors.push(`${markerLabel}: chapters must be consecutive`);
              if (Math.abs(marker.startSeconds - previousMarker.endSeconds) > 1) {
                errors.push(`${markerLabel}: startSeconds must continue from previous marker endSeconds`);
              }
            } else if (marker.startSeconds !== 0) {
              errors.push(`${markerLabel}: first marker must start at 0`);
            }

            previousMarker = marker;
          }

          const lastMarker = pilot.chapterMarkers[pilot.chapterMarkers.length - 1];
          if (durationSeconds !== null && Math.abs(lastMarker.endSeconds - durationSeconds) > 1) {
            errors.push(`${pilotLabel}: final chapter marker must end at the file duration ${pilot.duration}`);
          }
        }
      }

      if (pilot.visibility === "Public after review" && (pilot.chapterMarkers ?? []).some((marker) => marker.status !== "Verified")) {
        errors.push(`${pilotLabel}: public Bible Audio with chapterMarkers requires every marker to be Verified`);
      }
      if (pilot.visibility === "Public after review" && String(pilot.nextAction ?? "").toLowerCase().includes("verify")) {
        errors.push(`${pilotLabel}: public Bible Audio cannot keep a verification nextAction`);
      }
    }
  }

  return { uploadedCount: uploadedPilots.length, uploadedBytes, chapterMarkerCount, estimatedChapterMarkerCount, verifiedChapterMarkerCount };
}

const uploadedAudioSummary = await validateUploadedAudioPilots();

console.log("Media manifest validation summary");
console.table({
  records: records.length,
  audiobook_pilots: audiobookPilotSummary.pilotCount,
  audiobook_segments: audiobookPilotSummary.segmentCount,
  uploaded_audio_pilots: uploadedAudioSummary.uploadedCount,
  uploaded_audio_mb: Math.round((uploadedAudioSummary.uploadedBytes / 1024 / 1024) * 10) / 10,
  audio_chapter_markers: uploadedAudioSummary.chapterMarkerCount,
  estimated_audio_markers: uploadedAudioSummary.estimatedChapterMarkerCount,
  verified_audio_markers: uploadedAudioSummary.verifiedChapterMarkerCount,
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
