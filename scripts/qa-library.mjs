#!/usr/bin/env node
import { stat } from "node:fs/promises";
import {
  defaultLibraryManifest,
  normalizeComparisonValue,
  readLibraryManifest,
  validateLibraryEntry,
} from "./library-utils.mjs";

const manifestPath = process.argv[2] || defaultLibraryManifest;
const entries = await readLibraryManifest(manifestPath);
const errors = entries.flatMap((entry, index) => validateLibraryEntry(entry, index));
const warnings = [];

const titleAuthorCounts = new Map();
const sourceCounts = new Map();
const checksumCounts = new Map();
const categoryCounts = new Map();
const authorCounts = new Map();
const subjectShelfCounts = new Map([
  ["Commentary", 0],
  ["Prayer", 0],
  ["Bible Study", 0],
  ["KJV Defense / Textual Issues", 0],
  ["Baptist History", 0],
  ["Missions", 0],
  ["Preaching & Teaching", 0],
]);

function increment(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function resourceText(entry) {
  return [
    entry.title,
    entry.author,
    entry.category,
    entry.notes,
    entry.recommended_use,
    ...(entry.resource_labels ?? []),
    ...(entry.resource_warnings ?? []),
  ].join(" ").toLowerCase();
}

function matchesShelf(entry, words) {
  const text = resourceText(entry);
  return words.some((word) => text.includes(word));
}

for (const [index, entry] of entries.entries()) {
  const titleAuthorKey = `${normalizeComparisonValue(entry.title)}::${normalizeComparisonValue(entry.author)}`;
  increment(titleAuthorCounts, titleAuthorKey);
  increment(sourceCounts, normalizeComparisonValue(entry.source_url));
  if (entry.checksum_sha256) increment(checksumCounts, entry.checksum_sha256);
  increment(categoryCounts, entry.category);
  increment(authorCounts, entry.author);

  if (entry.public_domain_status !== "verified") {
    errors.push(`entry ${index + 1}: public resources must be verified`);
  }

  if (String(entry.rights_status ?? entry.commercial_use_status).toLowerCase().includes("permission")) {
    errors.push(`entry ${index + 1}: permission-needed resource is in the public manifest`);
  }

  if (String(entry.import_status).toLowerCase().includes("personal")) {
    errors.push(`entry ${index + 1}: personal-use resource is in the public manifest`);
  }

  try {
    await stat(entry.file_path);
  } catch {
    errors.push(`entry ${index + 1}: file does not exist: ${entry.file_path}`);
  }

  if (matchesShelf(entry, ["commentary", "commentaries", "exposition"])) increment(subjectShelfCounts, "Commentary");
  if (matchesShelf(entry, ["prayer", "pray", "intercession"])) increment(subjectShelfCounts, "Prayer");
  if (matchesShelf(entry, ["dictionary", "topical", "cross references", "bible study", "handbook", "survey"])) increment(subjectShelfCounts, "Bible Study");
  if (matchesShelf(entry, ["kjv", "king james", "textual", "authorized"])) increment(subjectShelfCounts, "KJV Defense / Textual Issues");
  if (matchesShelf(entry, ["baptist history", "baptist"])) increment(subjectShelfCounts, "Baptist History");
  if (matchesShelf(entry, ["missions", "missionary", "mission"])) increment(subjectShelfCounts, "Missions");
  if (matchesShelf(entry, ["preaching", "teaching", "sermon", "devotional", "illustration"])) increment(subjectShelfCounts, "Preaching & Teaching");
}

for (const [key, count] of titleAuthorCounts) {
  if (count > 1) errors.push(`duplicate title + author: ${key}`);
}

for (const [key, count] of sourceCounts) {
  if (count > 1) errors.push(`duplicate source URL: ${key}`);
}

for (const [key, count] of checksumCounts) {
  if (count > 1) errors.push(`duplicate checksum: ${key}`);
}

const featuredAuthorChecks = [
  ["Spurgeon", "spurgeon"],
  ["Ryle", "ryle"],
  ["Moody", "moody"],
  ["Bounds", "bounds"],
  ["Murray", "murray"],
  ["Torrey", "torrey"],
  ["Meyer", "meyer"],
  ["Bunyan", "bunyan"],
  ["Hudson Taylor", "taylor"],
];

const authorPageReport = featuredAuthorChecks.map(([label, needle]) => {
  const count = Array.from(authorCounts.entries())
    .filter(([author]) => author.toLowerCase().includes(needle))
    .reduce((total, [, itemCount]) => total + itemCount, 0);
  if (count === 0) warnings.push(`author page has no resources yet: ${label}`);
  return { author: label, resources: count };
});

const emptyShelves = Array.from(subjectShelfCounts.entries()).filter(([, count]) => count === 0);
for (const [shelf] of emptyShelves) {
  warnings.push(`subject shelf has no resources yet: ${shelf}`);
}

console.log("Library QA summary");
console.table({
  resources: entries.length,
  categories: categoryCounts.size,
  authors: authorCounts.size,
  subject_shelves: subjectShelfCounts.size,
});

console.log("Shelf counts");
console.table(Object.fromEntries(subjectShelfCounts));

console.log("Author page checks");
console.table(authorPageReport);

if (warnings.length) {
  console.log("Warnings");
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (errors.length) {
  console.error(`Library QA failed for ${manifestPath}`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Library QA OK: ${entries.length} public resources are verified, complete, and file-backed.`);
