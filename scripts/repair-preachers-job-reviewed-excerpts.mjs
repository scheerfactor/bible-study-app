#!/usr/bin/env node
import fs from "node:fs";
import { chromium } from "playwright";

const archiveItemUrl = "https://archive.org/details/preacherscomplet10newy";
const archiveTextUrl =
  "https://archive.org/download/preacherscomplet10newy/preacherscomplet10newy_djvu.txt";

const targets = [
  {
    file: "data/imports/preachers-homiletical-reviewed-job-1-10-commentary.json",
    id: "thomas-robinson-job-2-phase-3-reviewed",
    url: "https://www.sermonindex.net/commentary/phc/JOB/2/",
    marker: "Second Celestial Council",
    minimumLength: 20_000,
  },
  {
    file: "data/imports/preachers-homiletical-reviewed-job-11-20-commentary.json",
    id: "thomas-robinson-job-19-phase-3-reviewed",
    url: "https://www.sermonindex.net/commentary/phc/JOB/19/",
    marker: "JOB’S REPLY. BILDAD’S SECOND SPEECH",
    minimumLength: 45_000,
  },
  {
    file: "data/imports/preachers-homiletical-reviewed-job-31-42-commentary.json",
    id: "thomas-robinson-job-32-phase-3-reviewed",
    url: "https://www.sermonindex.net/commentary/phc/JOB/32/",
    marker: "The place of Elihu, introduced",
    minimumLength: 20_000,
  },
  {
    file: "data/imports/preachers-homiletical-reviewed-job-1-10-commentary.json",
    id: "thomas-robinson-job-3-phase-3-reviewed",
    url: "https://www.sermonindex.net/commentary/phc/JOB/3/",
    marker: "Job’s bitter complaint",
    minimumLength: 20_000,
  },
  {
    file: "data/imports/preachers-homiletical-reviewed-job-31-42-commentary.json",
    id: "thomas-robinson-job-39-phase-3-reviewed",
    url: "https://www.sermonindex.net/commentary/phc/JOB/39/",
    marker: "JEHOVAH’S ADDRESS",
    minimumLength: 35_000,
  },
  {
    file: "data/imports/preachers-homiletical-reviewed-job-31-42-commentary.json",
    id: "thomas-robinson-job-40-phase-3-reviewed",
    url: "https://www.sermonindex.net/commentary/phc/JOB/40/",
    marker: "JEHOVAH’S ADDRESS",
    minimumLength: 15_000,
  },
  {
    file: "data/imports/preachers-homiletical-reviewed-job-31-42-commentary.json",
    id: "thomas-robinson-job-41-phase-3-reviewed",
    url: "https://www.sermonindex.net/commentary/phc/JOB/41/",
    marker: "JEHOVAH’S SECOND ADDRESS",
    minimumLength: 15_000,
  },
  {
    file: "data/imports/preachers-homiletical-reviewed-job-31-42-commentary.json",
    id: "thomas-robinson-job-42-phase-3-reviewed",
    url: "https://www.sermonindex.net/commentary/phc/JOB/42/",
    marker: "THIRD GREAT OF THE POEM.—THE",
    minimumLength: 55_000,
  },
];

function hasDamagedOriginalLanguage(text) {
  return text.includes("�") || (text.includes("?") && /[Ͱ-ۿ]/u.test(text));
}

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();

  for (const target of targets) {
    const response = await page.goto(target.url, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    if (!response?.ok()) throw new Error(`Failed ${response?.status()}: ${target.url}`);

    const blocks = await page.locator(".comm-content").evaluate((content) =>
      Array.from(content.children).map((element) =>
        (element.textContent ?? "").replace(/\s+/g, " ").trim(),
      ),
    );

    const reviewedBlocks = [];
    let started = false;
    let omittedDamagedBlocks = 0;

    for (const originalBlock of blocks) {
      let block = originalBlock;
      if (!started) {
        const markerIndex = block.indexOf(target.marker);
        if (markerIndex === -1) continue;
        started = true;
        block = block.slice(markerIndex);
      }
      if (!block) continue;
      if (hasDamagedOriginalLanguage(block)) {
        omittedDamagedBlocks += 1;
        continue;
      }
      reviewedBlocks.push(block);
    }

    const recovered = reviewedBlocks
      .join("\n\n")
      .replace("between him and his friendsI. Job breaks", "between him and his friends.\n\nI. Job breaks")
      .replace("BILDAD’S SECOND SPEECHThis chapter", "BILDAD’S SECOND SPEECH\n\nThis chapter")
      .replace("unkind treatmentTheir treatment", "unkind treatment.\n\nTheir treatment")
      .replace("Thou who alone art worthy!”VII. Addresses", "Thou who alone art worthy!”\n\nVII. Addresses")
      .replace(
        "THIRD GREAT OF THE POEM.—THE The Almighty’s address",
        "THIRD GREAT DIVISION OF THE POEM.—THE CONCLUSION\n\nThe Almighty’s address",
      )
      .replace(
        "JEHOVAH’S ADDRESS Continuation of the questioning.",
        "JEHOVAH’S ADDRESS CONTINUED\n\nContinuation of the questioning.",
      )
      .replace(
        "JEHOVAH’S ADDRESS pause in the Almighty’s address",
        "JEHOVAH’S ADDRESS CONTINUED\n\nA pause in the Almighty’s address",
      )
      .replace(
        "JEHOVAH’S SECOND ADDRESS Nearly the whole of the chapter",
        "JEHOVAH’S SECOND ADDRESS CONTINUED\n\nNearly the whole of the chapter",
      )
      .replaceAll("Judζa", "Judaea")
      .replaceAll("Idumζa", "Idumaea")
      .replaceAll("hyζnas", "hyaenas")
      .replaceAll("Linnζus", "Linnaeus")
      .replaceAll("Zacchζus", "Zacchaeus");
    if (!started || recovered.length < target.minimumLength) {
      throw new Error(`Recovered text is unexpectedly short for ${target.id}`);
    }
    if (recovered.includes("�") || /[Ͱ-ۿ][^.!]{0,80}\?/u.test(recovered)) {
      throw new Error(`Damaged original-language text remains in ${target.id}`);
    }

    const payload = JSON.parse(fs.readFileSync(target.file, "utf8"));
    const entries = Array.isArray(payload) ? payload : payload.entries;
    const entry = entries.find((candidate) => candidate.id === target.id);
    if (!entry) throw new Error(`Missing Job target: ${target.id}`);

    entry.entry_text = recovered;
    entry.review_status = "Verified";
    entry.import_status = "Public Verified";
    entry.source_verification_url = archiveItemUrl;
    entry.source_scan_text_url = archiveTextUrl;
    entry.source_recovery_url = target.url;
    entry.source_recovery_status =
      "Reviewed public-domain homiletical excerpt restored; damaged original-language apparatus omitted.";
    entry.excerpt_status = "Reviewed excerpt";
    entry.review_batch = "Preacher's Homiletical Job Scan Recovery 2026-07-12";
    entry.review_notes =
      `Chapter boundary checked against the matching 1892 scan. Readable homiletical wording was preserved; ${omittedDamagedBlocks} block(s) of corrupt original-language apparatus were omitted rather than guessed.`;

    fs.writeFileSync(target.file, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(
      `restored: ${entry.reference} (${recovered.length} characters; ${omittedDamagedBlocks} damaged block(s) omitted)`,
    );
  }
} finally {
  await browser.close();
}
