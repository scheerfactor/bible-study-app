#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const outputPath = "data/generated/websters-1828-reviewed-overrides.json";
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const continueOnMissing = args.includes("--continue-on-missing");
const reportPath = args.find((value) => value.startsWith("--report="))?.slice("--report=".length) ?? "";
const requestedWords = args
  .filter((value) => !value.startsWith("--"))
  .flatMap((value) => value.split(","))
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

if (!requestedWords.length) {
  console.error(
    "Usage: node scripts/import-webster-reviewed-web-overlays.mjs [--dry-run] [--continue-on-missing] [--report=path] life death hear",
  );
  process.exit(1);
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

const existing = JSON.parse(await readFile(outputPath, "utf8"));
if (!Array.isArray(existing)) throw new Error(`${outputPath} must contain an array.`);

const qualitySignals = [
  { id: "split_the", pattern: /\b(?:tlje|tlie|tliat|tliis|tliese|tliem|tliere)\b/i },
  { id: "split_wh_words", pattern: /\b(?:whicli|wliich|whicb|wliat|wlio|wliere|wlieii|witli)\b/i },
  { id: "replacement_marks", pattern: /[�■]/ },
  { id: "known_common_ocr", pattern: /\b(?:ajie|manmr|insigniticant|trilling|liiw|aiid|aiiy|iiot|iiito|mulet|hinds|illnature)\b/i },
  { id: "sacred_name_spacing", pattern: /\b(?:Ood|G od|L ord|J esus|C hrist)\b/ },
  { id: "likely_missing_apostrophe", pattern: /\b(?:tis|poets)\b/i },
  { id: "stray_bracket_space", pattern: /\[\s+[^\]]/ },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const imported = [];
const skipped = [];

try {
  for (const word of requestedWords) {
    const sourceUrls = [
      `https://webstersdictionary1828.com/Dictionary/${encodeURIComponent(word)}`,
      `https://webstersdictionary1828.com/Dictionary/${encodeURIComponent(word[0].toUpperCase() + word.slice(1))}`,
    ];
    let sourceUrl = "";
    let source = null;

    for (const candidateUrl of [...new Set(sourceUrls)]) {
      console.log(`Checking ${word}: ${candidateUrl}`);
      const response = await fetch(candidateUrl);
      if (!response.ok) continue;
      await page.setContent(await response.text(), { waitUntil: "domcontentloaded", timeout: 30_000 });

      const entry = page.locator("h3.dictionaryhead + hr + div").first();
      if (!(await entry.count())) continue;

      const candidateSource = await entry.evaluate((element) => {
        const pageHeading = document.querySelector("h3.dictionaryhead")?.textContent?.trim() ?? "";
        const entryHeading = element.querySelector(":scope > p:first-child > strong")?.textContent?.trim() ?? pageHeading;
        return {
          pageHeading,
          entryHeading,
          paragraphs: Array.from(element.querySelectorAll(":scope > p"))
            .map((paragraph) => ({
              text: paragraph.textContent?.replace(/\s+/g, " ").trim() ?? "",
              directHeadings: Array.from(paragraph.querySelectorAll(":scope > strong"))
                .map((heading) => heading.textContent?.replace(/\s+/g, " ").trim() ?? "")
                .filter(Boolean),
            }))
            .filter((paragraph) => paragraph.text),
        };
      });

      if (normalize(candidateSource.pageHeading) !== normalize(word) || normalize(candidateSource.entryHeading) !== normalize(word)) {
        continue;
      }

      const exactParagraphs = [];
      for (const paragraph of candidateSource.paragraphs) {
        const textHeading = paragraph.text.match(/^([A-Z][A-Z' -]{1,50})(?=,|$)/)?.[1] ?? "";
        const paragraphHeadings = [
          ...paragraph.directHeadings.filter((heading) => /[A-Za-z]/.test(heading)),
          textHeading,
        ].filter(Boolean);
        const startsDifferentEntry =
          exactParagraphs.length > 0 &&
          paragraphHeadings.length > 0 &&
          !paragraphHeadings.some((heading) => normalize(heading) === normalize(word));
        if (startsDifferentEntry) break;
        exactParagraphs.push(paragraph);
      }

      sourceUrl = candidateUrl;
      source = { ...candidateSource, paragraphs: exactParagraphs };
      break;
    }

    if (!source) {
      const reason = `No exact Webster entry found for ${word}.`;
      skipped.push({ word, reason });
      if (continueOnMissing) {
        console.warn(reason);
        continue;
      }
      throw new Error(reason);
    }

    if (!source.paragraphs.length) throw new Error(`No Webster definition paragraphs found: ${sourceUrl}`);

    const definition = source.paragraphs.map((paragraph) => paragraph.text).join(" ");
    const firstParagraphHeadings = source.paragraphs[0]?.directHeadings ?? [];
    const reviewSignals = qualitySignals.filter((signal) => signal.pattern.test(definition)).map((signal) => signal.id);
    if (firstParagraphHeadings.length > 1) reviewSignals.push("multiple_headings_in_first_paragraph");
    if (definition.length < 80) reviewSignals.push("definition_too_short");
    imported.push({
      headword: source.entryHeading,
      normalized_headword: normalize(word),
      definition,
      source_title: "American Dictionary of the English Language",
      source_file: sourceUrl,
      source_line_start: 1,
      source_line_end: source.paragraphs.length,
      review_status: "reviewed_overlay",
      review_signals: reviewSignals,
      review_paragraphs: source.paragraphs.map((paragraph) => paragraph.text),
    });
  }
} finally {
  await browser.close();
}

const overlayEntries = imported.map((entry) =>
  Object.fromEntries(
    Object.entries(entry).filter(([key]) => key !== "review_signals" && key !== "review_paragraphs"),
  ),
);
const importedByHeadword = new Map(overlayEntries.map((entry) => [entry.normalized_headword, entry]));
const merged = existing
  .filter((entry) => !importedByHeadword.has(normalize(entry.normalized_headword || entry.headword)))
  .concat(overlayEntries)
  .sort((a, b) => a.normalized_headword.localeCompare(b.normalized_headword));

if (!dryRun) await writeFile(outputPath, `${JSON.stringify(merged, null, 2)}\n`);

if (reportPath) {
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(
    reportPath,
    `${JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        mode: dryRun ? "dry_run" : "imported",
        source_work: "Noah Webster, An American Dictionary of the English Language (1828)",
        rights_basis: "The original 1828 dictionary text is public domain.",
        requested_count: requestedWords.length,
        exact_entries_found: imported.length,
        skipped_count: skipped.length,
        entries: imported.map((entry) => ({
          ...entry,
          requires_scan_review: true,
        })),
        skipped,
      },
      null,
      2,
    )}\n`,
  );
}

console.log(dryRun ? "Webster review packet prepared; overlays were not changed." : "Webster reviewed web overlays imported.");
console.table({
  requested: requestedWords.length,
  exact_entries_found: imported.length,
  skipped: skipped.length,
  total_overlays: dryRun ? existing.length : merged.length,
});
for (const entry of imported) console.log(`- ${entry.headword}: ${entry.source_file}`);
if (reportPath) console.log(`Review packet: ${reportPath}`);
