#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const defaultManifestPath = "data/media/manifests/uploaded-public-domain-audio-pilots.json";
const allowedStatuses = new Set(["Estimated", "Verified"]);

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function usage() {
  return [
    "Usage:",
    "  npm run media:update-marker -- --list-estimated",
    "  npm run media:update-marker -- --book John --chapter 3 --start 693 --end 1043 --status Verified --method \"Manually verified by ear on YYYY-MM-DD.\"",
    "  npm run media:update-marker -- --book John --chapter 1 --start 0 --end 452 --status Verified --method \"Manually verified by ear on YYYY-MM-DD.\" --sync-adjacent",
    "",
    "Options:",
    "  --book       Bible book name, e.g. John",
    "  --chapter    Chapter number",
    "  --start      Marker start seconds",
    "  --end        Marker end seconds",
    "  --status     Estimated or Verified",
    "  --method     Review note / method",
    "  --sync-adjacent  Atomically move neighboring Estimated marker boundaries when correcting this chapter",
    "  --manifest   Alternate manifest path (useful for a review copy or focused testing)",
    "  --dry-run    Print the intended change without writing",
  ].join("\n");
}

function secondsToClock(totalSeconds) {
  const value = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = value % 60;
  if (hours) return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function durationToSeconds(value) {
  if (!value) return null;
  const parts = String(value).split(":").map((part) => Number(part));
  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !Number.isFinite(part) || part < 0)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function requireNumber(args, key) {
  const value = Number(args[key]);
  if (!Number.isFinite(value)) {
    throw new Error(`--${key} must be a number.\n\n${usage()}`);
  }
  return Math.round(value);
}

const args = parseArgs(process.argv.slice(2));
const manifestPath = String(args.manifest ?? defaultManifestPath);
const pilots = JSON.parse(await readFile(manifestPath, "utf8"));

if (args.help) {
  console.log(usage());
  process.exit(0);
}

if (args["list-estimated"]) {
  const rows = [];
  for (const pilot of pilots) {
    for (const marker of pilot.chapterMarkers ?? []) {
      if (marker.status === "Estimated") {
        rows.push({
          file: pilot.segmentTitle ?? pilot.passage ?? pilot.title,
          chapter: `${marker.book} ${marker.chapter}`,
          start: secondsToClock(marker.startSeconds),
          end: secondsToClock(marker.endSeconds),
          reviewFrom: secondsToClock(Math.max(0, marker.startSeconds - 10)),
          url: `${pilot.publicUrl ?? pilot.sourceFileUrl ?? pilot.sourceUrl}#t=${Math.max(0, Math.round(marker.startSeconds - 10))}`,
        });
      }
    }
  }
  console.table(rows);
  console.log(`${rows.length} estimated marker(s) remain.`);
  process.exit(0);
}

if (!args.book || !args.chapter || args.start === undefined || args.end === undefined || !args.status || !args.method) {
  throw new Error(`Missing required arguments.\n\n${usage()}`);
}

const targetBook = String(args.book).trim();
const targetChapter = requireNumber(args, "chapter");
const startSeconds = requireNumber(args, "start");
const endSeconds = requireNumber(args, "end");
const status = String(args.status).trim();
const method = String(args.method).trim();

if (!allowedStatuses.has(status)) throw new Error(`--status must be Estimated or Verified.`);
if (targetChapter < 1) throw new Error("--chapter must be a positive integer.");
if (startSeconds < 0) throw new Error("--start must be non-negative.");
if (endSeconds <= startSeconds) throw new Error("--end must be greater than --start.");
if (status === "Verified" && !method.toLowerCase().includes("verified by ear")) {
  throw new Error('--method for Verified markers must explicitly include "verified by ear".');
}

let targetPilot = null;
let targetMarker = null;
let markerIndex = -1;

for (const pilot of pilots) {
  markerIndex = (pilot.chapterMarkers ?? []).findIndex((marker) => marker.book === targetBook && marker.chapter === targetChapter);
  if (markerIndex !== -1) {
    targetPilot = pilot;
    targetMarker = pilot.chapterMarkers[markerIndex];
    break;
  }
}

if (!targetPilot || !targetMarker) throw new Error(`No marker found for ${targetBook} ${targetChapter}.`);

const durationSeconds = durationToSeconds(targetPilot.duration);
if (durationSeconds !== null && endSeconds > durationSeconds + 1) {
  throw new Error(`--end exceeds ${targetPilot.segmentTitle ?? targetPilot.passage ?? targetPilot.title} duration (${targetPilot.duration}).`);
}

const previousMarker = targetPilot.chapterMarkers[markerIndex - 1];
const nextMarker = targetPilot.chapterMarkers[markerIndex + 1];
const syncAdjacent = Boolean(args["sync-adjacent"]);
const adjacentChanges = [];
if (syncAdjacent && status !== "Verified") {
  throw new Error("--sync-adjacent requires --status Verified so estimated boundaries cannot silently replace one another.");
}

function synchronizeAdjacentBoundary(marker, field, value, relationship) {
  if (marker.status === "Verified") {
    throw new Error(
      `${relationship} marker ${marker.book} ${marker.chapter} is already Verified at ${marker[field]} seconds. Re-review that chapter before changing its shared boundary.`,
    );
  }
  const otherBoundary = field === "endSeconds" ? marker.startSeconds : marker.endSeconds;
  if ((field === "endSeconds" && value <= otherBoundary) || (field === "startSeconds" && value >= otherBoundary)) {
    throw new Error(`Synchronized ${field} would make ${marker.book} ${marker.chapter} zero-length or negative.`);
  }
  adjacentChanges.push({
    chapter: `${marker.book} ${marker.chapter}`,
    boundary: field,
    before: marker[field],
    after: value,
  });
  marker[field] = value;
  marker.method = `Estimated marker with shared ${relationship.toLowerCase()} boundary synchronized from the verified review of ${targetBook} ${targetChapter}; verify this chapter's remaining boundary by ear before release.`;
}

if (previousMarker && startSeconds !== previousMarker.endSeconds) {
  if (!syncAdjacent) {
    throw new Error(`--start should continue from previous marker end (${previousMarker.endSeconds}). Re-run with --sync-adjacent to update both sides atomically.`);
  }
  synchronizeAdjacentBoundary(previousMarker, "endSeconds", startSeconds, "Previous");
}
if (nextMarker && endSeconds !== nextMarker.startSeconds) {
  if (!syncAdjacent) {
    throw new Error(`--end should continue into next marker start (${nextMarker.startSeconds}). Re-run with --sync-adjacent to update both sides atomically.`);
  }
  synchronizeAdjacentBoundary(nextMarker, "startSeconds", endSeconds, "Next");
}

const before = { ...targetMarker };
targetMarker.startSeconds = startSeconds;
targetMarker.endSeconds = endSeconds;
targetMarker.status = status;
targetMarker.method = method;

console.log("Bible audio marker update");
console.table({
  file: targetPilot.segmentTitle ?? targetPilot.passage ?? targetPilot.title,
  chapter: `${targetBook} ${targetChapter}`,
  before: `${secondsToClock(before.startSeconds)}-${secondsToClock(before.endSeconds)} (${before.status})`,
  after: `${secondsToClock(startSeconds)}-${secondsToClock(endSeconds)} (${status})`,
  dry_run: Boolean(args["dry-run"]),
});
if (adjacentChanges.length) {
  console.log("Synchronized adjacent Estimated marker boundaries");
  console.table(adjacentChanges);
}

if (args["dry-run"]) {
  console.log("Dry run only. Manifest was not changed.");
  process.exit(0);
}

await writeFile(manifestPath, `${JSON.stringify(pilots, null, 2)}\n`);
console.log(`Updated ${manifestPath}. Run npm run validate:media and npm run media:marker-review next.`);
