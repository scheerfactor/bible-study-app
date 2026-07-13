#!/usr/bin/env node
import fs from "node:fs";
import { chromium } from "playwright";

const pooleFile = "data/imports/poole-reviewed-jeremiah-11-52-commentary.json";
const wesleyFinalFile = "data/imports/wesley-reviewed-final-gap-completion-part-2-commentary.json";
const wesleyPsalmsFile = "data/imports/wesley-reviewed-psalms-commentary.json";

const pooleTargets = [
  {
    id: "matthew-poole-jeremiah-45-phase-3-reviewed",
    url: "https://biblehub.com/commentaries/poole/jeremiah/45.htm",
  },
  {
    id: "matthew-poole-jeremiah-50-phase-3-reviewed",
    url: "https://biblehub.com/commentaries/poole/jeremiah/50.htm",
  },
];

function entries(payload) {
  return Array.isArray(payload) ? payload : payload.entries;
}

function writePayload(file, payload) {
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
}

const poolePayload = JSON.parse(fs.readFileSync(pooleFile, "utf8"));
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  for (const target of pooleTargets) {
    const response = await page.goto(target.url, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    if (!response?.ok()) throw new Error(`Failed ${response?.status()}: ${target.url}`);

    const recovered = await page.locator("#leftbox .chap").evaluate((chapter) => {
      const sections = [];
      let verse = "";
      let pieces = [];

      const flush = () => {
        const text = pieces
          .join(" ")
          .replace(/\s+/g, " ")
          .replace(/\s+([,.;:])/g, "$1")
          .trim();
        if (verse && text && !/^No text from Poole on this verse\.?$/i.test(text)) {
          sections.push(`Verse ${verse}\n${text}`);
        }
        pieces = [];
      };

      for (const node of chapter.childNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = /** @type {HTMLElement} */ (node);
          if (element.classList.contains("versenum")) {
            flush();
            verse = element.textContent?.match(/:(\d+)/)?.[1] ?? "";
            continue;
          }
          if (element.classList.contains("verse")) continue;
          if (element.tagName === "DIV" && !element.className) break;
        }

        const text = node.textContent?.replace(/\s+/g, " ").trim() ?? "";
        if (text) pieces.push(text);
      }
      flush();
      return sections.join("\n\n");
    });

    if (recovered.length < 200) {
      throw new Error(`Recovered Poole text is unexpectedly short for ${target.id}`);
    }

    const entry = entries(poolePayload).find((candidate) => candidate.id === target.id);
    if (!entry) throw new Error(`Missing Poole target: ${target.id}`);
    entry.entry_text = recovered;
    entry.source_verification_url = target.url;
    entry.review_batch = "Poole and Wesley Thin-Source Audit 2026-07-12";
    entry.review_notes =
      "Recovered omitted public-domain Poole annotations from the BibleSupport-derived commentary layer; Bible text and site labels were excluded, and source wording was preserved.";
    console.log(`repaired: ${entry.reference} (${recovered.length} characters)`);
  }
} finally {
  await browser.close();
}

writePayload(pooleFile, poolePayload);

const wesleyFinalPayload = JSON.parse(fs.readFileSync(wesleyFinalFile, "utf8"));
const samuel = entries(wesleyFinalPayload).find(
  (entry) => entry.id === "john-wesley-2-samuel-24-phase-3-reviewed",
);
if (!samuel) throw new Error("Missing Wesley 2 Samuel 24 target");
samuel.review_status = "Needs Review";
samuel.import_status = "Staged";
samuel.source_recovery_status =
  "No chapter-specific Wesley note verified; stored text was navigation debris.";
samuel.source_verification_url = "https://biblehub.com/commentaries/wes/2_samuel/24.htm";
samuel.review_batch = "Poole and Wesley Thin-Source Audit 2026-07-12";
samuel.review_notes =
  "Removed from public import because the independent source contains no Wesley notes for this chapter and the stored text is not commentary.";
writePayload(wesleyFinalFile, wesleyFinalPayload);
console.log(`quarantined: ${samuel.reference}`);

const wesleyPsalmsPayload = JSON.parse(fs.readFileSync(wesleyPsalmsFile, "utf8"));
for (const id of [
  "john-wesley-psalms-100-phase-3-reviewed",
  "john-wesley-psalms-117-phase-3-reviewed",
]) {
  const entry = entries(wesleyPsalmsPayload).find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Missing Wesley Psalms target: ${id}`);
  entry.source_thin_verified = true;
  entry.review_batch = "Poole and Wesley Thin-Source Audit 2026-07-12";
  entry.review_notes =
    "CCEL public-domain source confirms this is a genuine brief chapter summary rather than truncated commentary.";
  console.log(`source-thin: ${entry.reference}`);
}
writePayload(wesleyPsalmsFile, wesleyPsalmsPayload);
