#!/usr/bin/env node
import fs from "node:fs";

const targets = new Map([
  ["data/imports/preachers-homiletical-reviewed-job-1-10-commentary.json", [2, 3]],
  ["data/imports/preachers-homiletical-reviewed-job-11-20-commentary.json", [19]],
  ["data/imports/preachers-homiletical-reviewed-job-31-42-commentary.json", [32, 39, 40, 41, 42]],
]);

const archiveItemUrl = "https://archive.org/details/preacherscomplet10newy";
const archiveTextUrl =
  "https://archive.org/download/preacherscomplet10newy/preacherscomplet10newy_djvu.txt";
let quarantined = 0;

for (const [file, chapters] of targets) {
  const payload = JSON.parse(fs.readFileSync(file, "utf8"));
  const entries = Array.isArray(payload) ? payload : payload.entries;

  for (const chapter of chapters) {
    const entry = entries.find(
      (candidate) => candidate.book === "Job" && Number(candidate.chapter) === chapter,
    );
    if (!entry) throw new Error(`Missing Preacher's Homiletical Job ${chapter}`);
    if (!/^Verses? \d+-\d+$/i.test(entry.entry_text?.trim() ?? "")) {
      throw new Error(`Job ${chapter} is no longer a heading-only placeholder`);
    }

    entry.review_status = "Needs Review";
    entry.import_status = "Staged";
    entry.source_verification_url = archiveItemUrl;
    entry.source_scan_text_url = archiveTextUrl;
    entry.source_recovery_status =
      "Matching 1892 public-domain scan verified; chapter body requires OCR-aware boundary extraction and review.";
    entry.review_batch = "Preacher's Homiletical Job Placeholder Audit 2026-07-12";
    entry.review_notes =
      "Removed from public import because only a verse-range heading was captured. Restore from the matching 1892 scan after chapter boundaries and OCR quality are reviewed.";
    quarantined += 1;
    console.log(`quarantined: ${entry.reference}`);
  }

  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
}

if (quarantined !== 8) {
  throw new Error(`Expected to quarantine 8 Job placeholders, found ${quarantined}`);
}

console.log(`Preacher's Homiletical Job quarantine complete: ${quarantined} rows.`);
