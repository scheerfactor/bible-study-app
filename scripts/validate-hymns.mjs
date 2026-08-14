import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const hymns = JSON.parse(await readFile(resolve(root, "data", "hymns", "verified-hymns.json"), "utf8"));
const errors = [];
const ids = new Set();

for (const hymn of hymns) {
  if (!hymn.id || ids.has(hymn.id)) errors.push("Missing or duplicate hymn id: " + hymn.id);
  ids.add(hymn.id);
  if (!hymn.title || !hymn.lyricist || !hymn.tune) errors.push("Incomplete identity: " + hymn.id);
  if (!Array.isArray(hymn.stanzas) || hymn.stanzas.length < 2) errors.push("Missing stanzas: " + hymn.id);
  if (!Array.isArray(hymn.notes) || hymn.notes.length < 20) errors.push("Missing playable notes: " + hymn.id);
  if (!hymn.textSourceUrl || !hymn.textRights || !hymn.musicSourceUrl || !hymn.musicRights) {
    errors.push("Incomplete source or rights evidence: " + hymn.id);
  }
  if (hymn.notes?.some((note) => note.midi < 21 || note.midi > 108 || note.duration <= 0 || note.time < 0)) {
    errors.push("Invalid MIDI note data: " + hymn.id);
  }
  for (const sourceFile of [hymn.midiFile, hymn.rdfFile]) {
    try {
      await access(resolve(root, "data", "hymns", "sources", sourceFile));
    } catch {
      errors.push("Missing hymn source file: " + sourceFile);
    }
  }
}

if (hymns.length !== 3) errors.push("Expected exactly 3 reviewed hymns in this batch.");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Hymn validation passed: 3 sourced texts, 3 playable arrangements, and complete rights metadata.");
