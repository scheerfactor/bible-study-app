#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const manifestPath = process.argv[2] || "data/media/manifests/uploaded-public-domain-audio-pilots.json";
const outputPath = process.argv[3] || "BIBLE_AUDIO_MARKER_REVIEW.md";

const pilots = (await import(path.resolve(manifestPath), { with: { type: "json" } })).default;

function secondsToClock(totalSeconds) {
  const value = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = value % 60;
  if (hours) return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function markerSummary(marker) {
  return `${marker.book} ${marker.chapter}: ${secondsToClock(marker.startSeconds)}-${secondsToClock(marker.endSeconds)} (${marker.status})`;
}

const bibleAudioPilots = pilots.filter((pilot) => pilot.kind === "Bible Audio");
const markerPilots = bibleAudioPilots.filter((pilot) => Array.isArray(pilot.chapterMarkers) && pilot.chapterMarkers.length > 0);
const allMarkers = markerPilots.flatMap((pilot) => pilot.chapterMarkers.map((marker) => ({ pilot, marker })));
const estimatedMarkers = allMarkers.filter(({ marker }) => marker.status === "Estimated");
const verifiedMarkers = allMarkers.filter(({ marker }) => marker.status === "Verified");
const publicVisibilityViolations = markerPilots.filter(
  (pilot) => pilot.visibility === "Public after review" && pilot.chapterMarkers.some((marker) => marker.status !== "Verified"),
);

const lines = [
  "# Bible Audio Marker Review",
  "",
  "This report tracks uploaded Bible audio chapter markers before public release.",
  "",
  "## Summary",
  "",
  `- Bible audio files with markers: ${markerPilots.length}`,
  `- Total chapter markers: ${allMarkers.length}`,
  `- Estimated markers: ${estimatedMarkers.length}`,
  `- Verified markers: ${verifiedMarkers.length}`,
  `- Markers requiring manual review before public release: ${estimatedMarkers.length}`,
  `- Public visibility violations: ${publicVisibilityViolations.length}`,
  "",
  "## Release Rule",
  "",
  "Do not mark Bible audio public until every chapter marker for that file is manually checked and changed from `Estimated` to `Verified`.",
  "",
  "## Manual Review Instructions",
  "",
  "For each boundary:",
  "",
  "1. Open the source or R2 audio file.",
  "2. Jump to 10 seconds before the listed chapter start.",
  "3. Confirm the prior chapter ends cleanly.",
  "4. Confirm the target chapter heading or first words begin at the listed start.",
  "5. Adjust the marker if needed.",
  "6. Change the marker status to `Verified` only after checking it by ear.",
  "",
  "## Files",
  "",
];

for (const pilot of markerPilots) {
  lines.push(`### ${pilot.segmentTitle}`);
  lines.push("");
  lines.push(`- Work: ${pilot.workTitle}`);
  lines.push(`- Creator: ${pilot.creator}`);
  lines.push(`- Duration: ${pilot.duration}`);
  lines.push(`- Visibility: ${pilot.visibility}`);
  lines.push(`- Intake status: ${pilot.intakeStatus}`);
  lines.push(`- Source: ${pilot.sourceUrl}`);
  lines.push(`- Source file: ${pilot.sourceFileUrl}`);
  lines.push(`- R2 URL: ${pilot.publicUrl}`);
  lines.push("");
  lines.push("| Chapter | Start | End | Status | Review checkpoint |");
  lines.push("| --- | ---: | ---: | --- | --- |");

  for (const marker of pilot.chapterMarkers) {
    const checkpoint = marker.startSeconds === 0 ? "Confirm file begins with this chapter/range opening." : `Listen from ${secondsToClock(marker.startSeconds - 10)} and confirm boundary.`;
    lines.push(
      `| ${marker.book} ${marker.chapter} | ${secondsToClock(marker.startSeconds)} | ${secondsToClock(marker.endSeconds)} | ${marker.status} | ${checkpoint} |`,
    );
  }

  lines.push("");
  lines.push("Marker notes:");
  lines.push("");
  for (const marker of pilot.chapterMarkers) {
    lines.push(`- ${markerSummary(marker)} — ${marker.method}`);
  }
  lines.push("");
}

lines.push("## Next Action");
lines.push("");
if (estimatedMarkers.length) {
  lines.push(`- Review ${estimatedMarkers.length} estimated chapter markers by ear before public release.`);
} else {
  lines.push("- All markers are verified. The next step is a public playback QA pass.");
}
lines.push("- Keep the source URL and rights evidence attached to every audio file.");
lines.push("- Keep LibriVox/public-domain attribution visible in admin metadata before any public display.");
lines.push("");

await mkdir(path.dirname(outputPath), { recursive: true }).catch(() => {});
await writeFile(outputPath, `${lines.join("\n")}\n`);
console.log(`Bible audio marker review written to ${outputPath}`);
