#!/usr/bin/env node
import fs from "node:fs";

const targets = [
  "data/imports/h-a-ironside-reviewed-isaiah-1-33-commentary.json",
  "data/imports/h-a-ironside-reviewed-isaiah-34-66-commentary.json",
  "data/imports/h-a-ironside-reviewed-solomons-song-commentary.json",
];

const titlePagePattern = /EXPOSITORY NOTES ON\s+THE PROPHET ISAIAH[\s\S]*@ 1952/i;
const navigationPattern = /Genesis Gen Intro|Footnotes:/i;
let quarantined = 0;

for (const file of targets) {
  const payload = JSON.parse(fs.readFileSync(file, "utf8"));
  const entries = Array.isArray(payload) ? payload : payload.entries;

  for (const entry of entries) {
    const text = entry.entry_text?.trim() ?? "";
    if (!titlePagePattern.test(text) && !navigationPattern.test(text)) continue;

    entry.review_status = "Needs Review";
    entry.import_status = "Staged";
    entry.source_recovery_status = titlePagePattern.test(text)
      ? "Repeated volume title page; no chapter commentary body captured."
      : "Navigation and footnote labels; no commentary body captured.";
    entry.review_batch = "Ironside Placeholder Safety Audit 2026-07-12";
    entry.review_notes =
      "Removed from public import because this row contains source wrapper text rather than readable commentary. Restore only from the matching rights-verified chapter source.";
    quarantined += 1;
    console.log(`quarantined: ${entry.reference}`);
  }

  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
}

if (quarantined !== 69) {
  throw new Error(`Expected to quarantine 69 Ironside placeholders, found ${quarantined}`);
}

console.log(`Ironside placeholder quarantine complete: ${quarantined} rows.`);
