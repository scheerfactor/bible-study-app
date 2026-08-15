import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const hymns = JSON.parse(await readFile(resolve(root, "data", "hymns", "verified-hymns.json"), "utf8"));
const errors = [];
const ids = new Set();
const titles = new Set();
const sourceFiles = new Set();

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
  for (const [sourceFile, expectedSha256] of [
    [hymn.midiFile, hymn.midiSha256],
    [hymn.rdfFile, hymn.rdfSha256],
  ]) {
    if (!sourceFile || sourceFiles.has(sourceFile)) errors.push("Missing or duplicate hymn source file: " + sourceFile);
    sourceFiles.add(sourceFile);
    try {
      const source = await readFile(resolve(root, "data", "hymns", "sources", sourceFile));
      if (!expectedSha256 || sha256(source) !== expectedSha256) errors.push("Hymn source checksum mismatch: " + sourceFile);
    } catch {
      errors.push("Missing hymn source file: " + sourceFile);
    }
  }
  const rdf = await readFile(resolve(root, "data", "hymns", "sources", hymn.rdfFile), "utf8").catch(() => "");
  if (!rdf.includes("<mp:licence>" + hymn.musicRights + "</mp:licence>")) {
    errors.push("Hymn RDF rights mismatch: " + hymn.id);
  }
}

if (hymns.length !== 7) errors.push("Expected exactly 7 reviewed hymns in the verified set.");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `Hymn validation passed: ${hymns.length} sourced texts, ${hymns.length} playable arrangements, and complete rights metadata with verified checksums.`,
);
