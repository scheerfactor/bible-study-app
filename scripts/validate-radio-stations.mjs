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
    if (record.rightsStatus !== "Approved") errors.push(`${label}: intake track must have Approved rights`);
    if (!String(record.requiredAttribution ?? "").trim()) errors.push(`${label}: approved intake track requires attribution`);
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
  if (!Array.isArray(station.trackIds) || station.trackIds.length < 2) errors.push(`${label}: trackIds must contain at least two tracks`);
  if (new Set(station.trackIds).size !== station.trackIds.length) errors.push(`${label}: trackIds contains duplicates`);
  for (const trackId of station.trackIds ?? []) {
    if (!reviewById.has(trackId)) errors.push(`${label}: ${trackId} is not in reviewedTracks`);
  }
}

const unusedReviews = [...reviewById.keys()].filter(
  (trackId) => !(radio.stations ?? []).some((station) => station.trackIds.includes(trackId)),
);
if (unusedReviews.length) errors.push(`reviewed tracks are not assigned to a station: ${unusedReviews.join(", ")}`);

if (errors.length) {
  console.error(`Radio station validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("Radio station validation passed.");
console.log(`Stations: ${radio.stations.length}`);
console.log(`Reviewed tracks: ${radio.reviewedTracks.length}`);
console.log(`Public-domain tracks: ${radio.reviewedTracks.filter((review) => review.sourceManifest === "uploaded-public-domain-audio-pilots").length}`);
console.log(`Permission-approved tracks: ${radio.reviewedTracks.filter((review) => review.sourceManifest === "media-intake-candidates").length}`);
