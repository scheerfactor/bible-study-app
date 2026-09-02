import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const hymns = JSON.parse(await readFile(resolve(root, "data", "hymns", "verified-hymns.json"), "utf8"));
const supplementalHymns = JSON.parse(
  await readFile(resolve(root, "data", "hymns", "supplemental-hymns.json"), "utf8"),
);
const presentationHymns = JSON.parse(
  await readFile(resolve(root, "data", "hymns", "presentation-hymns.json"), "utf8"),
);
const errors = [];
const ids = new Set();
const titles = new Set();

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

for (const hymn of hymns) {
  if (!hymn.id || ids.has(hymn.id)) errors.push("Missing or duplicate hymn id: " + hymn.id);
  ids.add(hymn.id);
  const normalizedTitle = String(hymn.title ?? "").toLowerCase();
  if (!normalizedTitle || titles.has(normalizedTitle)) errors.push("Missing or duplicate hymn title: " + hymn.title);
  titles.add(normalizedTitle);
  if (!hymn.title || !hymn.lyricist || !hymn.tune) errors.push("Incomplete identity: " + hymn.id);
  if (!Array.isArray(hymn.stanzas) || hymn.stanzas.length < 2) errors.push("Missing stanzas: " + hymn.id);
  if (hymn.refrain !== null && (typeof hymn.refrain !== "string" || !hymn.refrain.trim())) {
    errors.push("Invalid refrain: " + hymn.id);
  }
  if (!Array.isArray(hymn.notes) || hymn.notes.length < 20) errors.push("Missing playable notes: " + hymn.id);
  if (!hymn.textSourceUrl || !hymn.textRights || !hymn.musicSourceUrl || !hymn.musicRights) {
    errors.push("Incomplete source or rights evidence: " + hymn.id);
  }
  if (hymn.notes?.some((note) => note.midi < 21 || note.midi > 108 || note.duration <= 0 || note.time < 0)) {
    errors.push("Invalid MIDI note data: " + hymn.id);
  }
  if (!/^https:\/\//.test(hymn.textSourceUrl) || !/^https:\/\//.test(hymn.musicSourceUrl)) {
    errors.push("Hymn source URLs must use HTTPS: " + hymn.id);
  }
  const evidenceFile = hymn.rightsEvidenceFile ?? hymn.rdfFile;
  const evidenceSha256 = hymn.rightsEvidenceSha256 ?? hymn.rdfSha256;
  const evidenceMarker = hymn.rightsEvidenceMarker ?? `<mp:licence>${hymn.musicRights}</mp:licence>`;
  for (const [sourceFile, expectedSha256] of [
    [hymn.midiFile, hymn.midiSha256],
    [evidenceFile, evidenceSha256],
  ]) {
    if (!sourceFile) errors.push("Missing hymn source file: " + sourceFile);
    try {
      const source = await readFile(resolve(root, "data", "hymns", "sources", sourceFile));
      if (!expectedSha256 || sha256(source) !== expectedSha256) errors.push("Hymn source checksum mismatch: " + sourceFile);
    } catch {
      errors.push("Missing hymn source file: " + sourceFile);
    }
  }
  const evidence = await readFile(resolve(root, "data", "hymns", "sources", evidenceFile), "utf8").catch(() => "");
  if (!evidence.includes(evidenceMarker)) {
    errors.push("Hymn music-rights evidence mismatch: " + hymn.id);
  }
}

const expectedHymnCount = 11 + supplementalHymns.length;
if (hymns.length !== expectedHymnCount) {
  errors.push(`Expected exactly ${expectedHymnCount} reviewed hymns in the verified set.`);
}
if (presentationHymns.length !== hymns.length) {
  errors.push(`Presentation hymn index has ${presentationHymns.length} entries; expected ${hymns.length}.`);
}
for (const [index, hymn] of hymns.entries()) {
  const presentationHymn = presentationHymns[index];
  if (!presentationHymn || presentationHymn.id !== hymn.id || presentationHymn.title !== hymn.title) {
    errors.push(`Presentation hymn index is out of order or missing ${hymn.id}.`);
  }
  if (presentationHymn && ("notes" in presentationHymn || "durationSeconds" in presentationHymn)) {
    errors.push(`Presentation hymn index must not include playback note data: ${hymn.id}.`);
  }
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `Hymn validation passed: ${hymns.length} sourced texts, ${hymns.length} playable arrangements, and complete rights metadata with verified checksums.`,
);
