#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const radioPath = process.argv[2] || "data/media/manifests/radio-stations.json";
const uploadedPath = process.argv[3] || "data/media/manifests/uploaded-public-domain-audio-pilots.json";
const intakePath = process.argv[4] || "data/media/manifests/media-intake-candidates.json";

const [radio, uploaded, intake] = await Promise.all(
  [radioPath, uploadedPath, intakePath].map(async (path) => JSON.parse(await readFile(path, "utf8"))),
);

const errors = [];
const allowedSourceManifests = new Set(["uploaded-public-domain-audio-pilots", "media-intake-candidates"]);
const uploadedById = new Map(uploaded.map((record) => [record.id, record]));
const intakeById = new Map(intake.map((record) => [record.id, record]));
const reviewById = new Map();

if (!Array.isArray(radio.stations) || radio.stations.length === 0) errors.push("stations must be a non-empty array");
if (!Array.isArray(radio.reviewedTracks) || radio.reviewedTracks.length === 0) errors.push("reviewedTracks must be a non-empty array");
if (radio.launchStatus !== "Public beta approved") errors.push("launchStatus must be Public beta approved");

for (const [index, review] of (radio.reviewedTracks ?? []).entries()) {
  const label = `reviewed track ${index + 1}`;
  for (const field of ["mediaRecordId", "sourceManifest", "approvalStatus", "playbackReview"]) {
    if (!String(review[field] ?? "").trim()) errors.push(`${label}: missing ${field}`);
  }
  if (reviewById.has(review.mediaRecordId)) errors.push(`${label}: duplicate mediaRecordId ${review.mediaRecordId}`);
  reviewById.set(review.mediaRecordId, review);
  if (!allowedSourceManifests.has(review.sourceManifest)) errors.push(`${label}: unsupported sourceManifest ${review.sourceManifest}`);
  if (!String(review.approvalStatus).toLowerCase().includes("approved")) errors.push(`${label}: approvalStatus must be approved`);
  if (!String(review.playbackReview).includes("HTTP 206 audio/")) errors.push(`${label}: playbackReview must record an HTTP 206 audio response`);

  const record = review.sourceManifest === "uploaded-public-domain-audio-pilots"
    ? uploadedById.get(review.mediaRecordId)
    : intakeById.get(review.mediaRecordId);
  if (!record) {
    errors.push(`${label}: source record ${review.mediaRecordId} not found`);
    continue;
  }

  if (review.sourceManifest === "uploaded-public-domain-audio-pilots") {
    if (record.rightsStatus !== "Public Domain - USA") errors.push(`${label}: uploaded track must be Public Domain - USA`);
    if (!String(record.publicUrl ?? "").startsWith("https://")) errors.push(`${label}: uploaded track requires an HTTPS publicUrl`);
  } else {
    if (!["Approved", "Public Domain"].includes(record.rightsStatus)) {
      errors.push(`${label}: intake track must have Approved or Public Domain rights`);
    }
    if (record.rightsStatus === "Approved" && !String(record.requiredAttribution ?? "").trim()) {
      errors.push(`${label}: approved intake track requires attribution`);
    }
    if (!String(record.sourceUrl ?? "").startsWith("https://")) errors.push(`${label}: intake track requires an HTTPS sourceUrl`);
  }
  if (!String(record.rightsEvidence ?? "").trim()) errors.push(`${label}: source record requires rightsEvidence`);
}

const stationIds = new Set();
for (const [index, station] of (radio.stations ?? []).entries()) {
  const label = `station ${index + 1}`;
  for (const field of ["id", "title", "shortLabel", "description"]) {
    if (!String(station[field] ?? "").trim()) errors.push(`${label}: missing ${field}`);
  }
  if (stationIds.has(station.id)) errors.push(`${label}: duplicate id ${station.id}`);
  stationIds.add(station.id);
  const minimumTracks = station.id === "kjv-genesis-pilot" ? 1 : 2;
  if (!Array.isArray(station.trackIds) || station.trackIds.length < minimumTracks) {
    errors.push(`${label}: trackIds must contain at least ${minimumTracks} track${minimumTracks === 1 ? "" : "s"}`);
  }
  if (new Set(station.trackIds).size !== station.trackIds.length) errors.push(`${label}: trackIds contains duplicates`);
  for (const trackId of station.trackIds ?? []) {
    if (!reviewById.has(trackId)) errors.push(`${label}: ${trackId} is not in reviewedTracks`);
  }
}

const unusedReviews = [...reviewById.keys()].filter(
  (trackId) => !(radio.stations ?? []).some((station) => station.trackIds.includes(trackId)),
);
if (unusedReviews.length) errors.push(`reviewed tracks are not assigned to a station: ${unusedReviews.join(", ")}`);

const bibleStation = (radio.stations ?? []).find((station) => station.id === "kjv-bible");
const genesisPilot = (radio.stations ?? []).find((station) => station.id === "kjv-genesis-pilot");
let chapterReadyFileCount = 0;
const expectedJohnTrackIds = [
  "kjv-john-librivox-001-john-1-4",
  "kjv-john-librivox-002-john-5-8",
  "kjv-john-librivox-003-john-9-12",
  "kjv-john-librivox-004-john-13-17",
  "kjv-john-librivox-005-john-18-21",
];

if (!bibleStation) {
  errors.push("KJV Bible Radio station is missing");
} else {
  if (JSON.stringify(bibleStation.trackIds) !== JSON.stringify(expectedJohnTrackIds)) {
    errors.push("KJV Bible Radio must keep the five Gospel of John range files in canonical order");
  }
  if (bibleStation.coverage !== "John 1-21") errors.push("KJV Bible Radio coverage must be John 1-21");
  if (!String(bibleStation.listeningMode ?? "").toLowerCase().includes("sequential")) {
    errors.push("KJV Bible Radio must identify its sequential listening mode");
  }
  if (!String(bibleStation.markerStatus ?? "").toLowerCase().includes("only after every marker")) {
    errors.push("KJV Bible Radio must keep its file-level chapter-navigation release gate visible");
  }

  const bibleRecords = expectedJohnTrackIds
    .map((trackId) => uploadedById.get(trackId))
    .filter(Boolean);
  const coveredChapters = bibleRecords
    .flatMap((record) => record.chapterMarkers ?? [])
    .filter((marker) => marker.book === "John")
    .map((marker) => marker.chapter);
  if (JSON.stringify(coveredChapters) !== JSON.stringify(Array.from({ length: 21 }, (_, index) => index + 1))) {
    errors.push("KJV Bible Radio source markers must cover John 1-21 in order");
  }
  if (bibleRecords.some((record) => record.kind !== "Bible Audio" || record.rightsStatus !== "Public Domain - USA")) {
    errors.push("KJV Bible Radio must use public-domain Bible Audio records only");
  }
  const chapterReadyFiles = bibleRecords.filter(
    (record) => (record.chapterMarkers ?? []).length > 0 && record.chapterMarkers.every((marker) => marker.status === "Verified"),
  );
  const partiallyVerifiedFiles = bibleRecords.filter((record) => {
    const statuses = new Set((record.chapterMarkers ?? []).map((marker) => marker.status));
    return statuses.has("Estimated") && statuses.has("Verified");
  });
  if (partiallyVerifiedFiles.some((record) => record.visibility === "Public after review")) {
    errors.push("KJV Bible Radio cannot expose chapter navigation for a partially verified range file");
  }
  chapterReadyFileCount = chapterReadyFiles.length;
}

const expectedGenesisTrackId = "bible-kjv-complete-librivox-001-genesis-1-14";
if (!genesisPilot) {
  errors.push("Genesis Bible Radio Pilot station is missing");
} else {
  if (JSON.stringify(genesisPilot.trackIds) !== JSON.stringify([expectedGenesisTrackId])) {
    errors.push("Genesis Bible Radio Pilot must contain only the reviewed Genesis 1-14 range file");
  }
  if (genesisPilot.coverage !== "Genesis 1-14") errors.push("Genesis Bible Radio Pilot coverage must be Genesis 1-14");
  if (!String(genesisPilot.listeningMode ?? "").toLowerCase().includes("range-file pilot")) {
    errors.push("Genesis Bible Radio Pilot must identify its range-file listening mode");
  }
  if (!String(genesisPilot.markerStatus ?? "").toLowerCase().includes("remain unavailable")) {
    errors.push("Genesis Bible Radio Pilot must keep chapter navigation unavailable pending manual marker review");
  }
  const genesisRecord = intakeById.get(expectedGenesisTrackId);
  if (!genesisRecord) {
    errors.push("Genesis Bible Radio Pilot source record is missing");
  } else {
    if (genesisRecord.kind !== "Bible Audio" || genesisRecord.rightsStatus !== "Public Domain") {
      errors.push("Genesis Bible Radio Pilot must use its public-domain Bible Audio record");
    }
    if (genesisRecord.passage !== "Genesis 1-14") errors.push("Genesis Bible Radio Pilot source passage must be Genesis 1-14");
    if (!String(genesisRecord.notes ?? "").toLowerCase().includes("do not expose chapter seeking")) {
      errors.push("Genesis Bible Radio Pilot source must retain its chapter-navigation release gate");
    }
    const genesisMarkers = genesisRecord.chapterMarkers ?? [];
    if (genesisMarkers.length !== 14) {
      errors.push("Genesis Bible Radio Pilot must keep 14 candidate chapter markers");
    } else {
      for (const [index, marker] of genesisMarkers.entries()) {
        if (marker.book !== "Genesis" || marker.chapter !== index + 1) {
          errors.push(`Genesis Bible Radio Pilot marker ${index + 1} must identify Genesis ${index + 1}`);
        }
        if (!["Estimated", "Verified"].includes(marker.status)) {
          errors.push(`Genesis Bible Radio Pilot marker ${index + 1} must be Estimated or Verified`);
        }
        const method = String(marker.method ?? "").toLowerCase();
        if (marker.status === "Estimated" && !method.includes("manual by-ear review")) {
          errors.push(`Genesis Bible Radio Pilot estimated marker ${index + 1} must retain its manual review requirement`);
        }
        if (marker.status === "Verified" && !method.includes("verified by ear")) {
          errors.push(`Genesis Bible Radio Pilot verified marker ${index + 1} must record by-ear verification`);
        }
        if (index === 0 && marker.startSeconds !== 0) {
          errors.push("Genesis Bible Radio Pilot first marker must preserve the file introduction from 0 seconds");
        }
        const previousMarker = genesisMarkers[index - 1];
        if (previousMarker && Math.abs(previousMarker.endSeconds - marker.startSeconds) > 0.01) {
          errors.push(`Genesis Bible Radio Pilot marker ${index + 1} must continue from the prior marker`);
        }
      }
      if (Math.abs(genesisMarkers.at(-1).endSeconds - genesisRecord.durationSeconds) > 0.01) {
        errors.push("Genesis Bible Radio Pilot markers must end at the verified file duration");
      }
    }
  }
}

if (errors.length) {
  console.error(`Radio station validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("Radio station validation passed.");
console.log(`Stations: ${radio.stations.length}`);
console.log(`Reviewed tracks: ${radio.reviewedTracks.length}`);
console.log(`Public-domain tracks: ${radio.reviewedTracks.filter((review) => {
  if (review.sourceManifest === "uploaded-public-domain-audio-pilots") return true;
  return intakeById.get(review.mediaRecordId)?.rightsStatus === "Public Domain";
}).length}`);
console.log(`Permission-approved tracks: ${radio.reviewedTracks.filter((review) => {
  return review.sourceManifest === "media-intake-candidates"
    && intakeById.get(review.mediaRecordId)?.rightsStatus === "Approved";
}).length}`);
console.log(`KJV Bible Radio coverage: ${bibleStation?.coverage ?? "missing"} across ${bibleStation?.trackIds?.length ?? 0} sequential range files`);
console.log(`KJV Bible Radio chapter-ready files: ${chapterReadyFileCount} of ${bibleStation?.trackIds?.length ?? 0}`);
