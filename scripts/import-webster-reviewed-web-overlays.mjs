#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const outputPath = "data/generated/websters-1828-reviewed-overrides.json";
const requestedWords = process.argv
  .slice(2)
  .flatMap((value) => value.split(","))
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

if (!requestedWords.length) {
  console.error("Usage: node scripts/import-webster-reviewed-web-overlays.mjs life death hear");
  process.exit(1);
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

const existing = JSON.parse(await readFile(outputPath, "utf8"));
if (!Array.isArray(existing)) throw new Error(`${outputPath} must contain an array.`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const imported = [];

try {
  for (const word of requestedWords) {
    const sourceUrl = `https://webstersdictionary1828.com/Dictionary/${encodeURIComponent(word)}`;
    const response = await page.goto(sourceUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    if (!response?.ok()) throw new Error(`Failed ${response?.status() ?? "unknown"}: ${sourceUrl}`);

    const source = await page.locator("h3.dictionaryhead + hr + div").first().evaluate((element) => ({
      heading: element.querySelector("strong")?.textContent?.trim() ?? "",
      paragraphs: Array.from(element.querySelectorAll(":scope > p"))
        .map((paragraph) => paragraph.textContent?.replace(/\s+/g, " ").trim() ?? "")
        .filter(Boolean),
    }));

    if (!source.paragraphs.length) throw new Error(`No Webster definition paragraphs found: ${sourceUrl}`);
    const primaryHeading = source.heading.split(",", 1)[0]?.trim() ?? "";
    if (normalize(primaryHeading) !== normalize(word)) {
      throw new Error(`Headword mismatch for ${word}: found ${source.heading || "none"}`);
    }

    imported.push({
      headword: source.heading,
      normalized_headword: normalize(word),
      definition: source.paragraphs.join(" "),
      source_title: "American Dictionary of the English Language",
      source_file: sourceUrl,
      source_line_start: 1,
      source_line_end: source.paragraphs.length,
      review_status: "reviewed_overlay",
    });
  }
} finally {
  await browser.close();
}

const importedByHeadword = new Map(imported.map((entry) => [entry.normalized_headword, entry]));
const merged = existing
  .filter((entry) => !importedByHeadword.has(normalize(entry.normalized_headword || entry.headword)))
  .concat(imported)
  .sort((a, b) => a.normalized_headword.localeCompare(b.normalized_headword));

await writeFile(outputPath, `${JSON.stringify(merged, null, 2)}\n`);

console.log("Webster reviewed web overlays imported.");
console.table({ requested: requestedWords.length, imported: imported.length, total_overlays: merged.length });
for (const entry of imported) console.log(`- ${entry.headword}: ${entry.source_file}`);
