#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const outputPath = "data/generated/websters-1828-reviewed-overrides.json";
const packetPaths = process.argv.slice(2).filter((value) => !value.startsWith("--"));
const correctionsPath = process.argv
  .find((value) => value.startsWith("--corrections="))
  ?.slice("--corrections=".length);
const accepted = new Set(
  (process.argv.find((value) => value.startsWith("--accept="))?.slice("--accept=".length) ?? "")
    .split(",")
    .map(normalize)
    .filter(Boolean),
);
const scanReviewed = process.argv.includes("--scan-reviewed");

if (!packetPaths.length || !accepted.size || !scanReviewed) {
  console.error(
    "Usage: node scripts/promote-webster-review-packets.mjs --scan-reviewed --accept=word,word [--corrections=file.json] packet.json [packet.json]",
  );
  process.exit(1);
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

const existing = JSON.parse(await readFile(outputPath, "utf8"));
const corrections = correctionsPath ? JSON.parse(await readFile(correctionsPath, "utf8")) : {};
const candidates = [];

for (const packetPath of packetPaths) {
  const packet = JSON.parse(await readFile(packetPath, "utf8"));
  if (packet.mode !== "dry_run") throw new Error(`${packetPath} is not a dry-run review packet.`);
  if (!String(packet.rights_basis ?? "").toLowerCase().includes("public domain")) {
    throw new Error(`${packetPath} does not document the public-domain rights basis.`);
  }
  for (const entry of packet.entries ?? []) {
    const key = normalize(entry.normalized_headword || entry.headword);
    if (accepted.has(key)) candidates.push(entry);
  }
}

const found = new Set(candidates.map((entry) => normalize(entry.normalized_headword || entry.headword)));
const missing = [...accepted].filter((word) => !found.has(word));
if (missing.length) throw new Error(`Accepted entries are absent from the packets: ${missing.join(", ")}`);
if (found.size !== candidates.length) throw new Error("A promoted headword occurs in more than one review packet.");

const promoted = candidates.map((candidate) => {
  const entry = { ...candidate };
  delete entry.review_signals;
  delete entry.review_paragraphs;
  delete entry.requires_scan_review;
  const key = normalize(entry.normalized_headword || entry.headword);
  for (const [from, to] of corrections[key] ?? []) {
    const firstMatch = entry.definition.indexOf(from);
    if (firstMatch < 0) throw new Error(`${key}: correction source text was not found: ${from}`);
    if (entry.definition.indexOf(from, firstMatch + from.length) >= 0) {
      throw new Error(`${key}: correction source text is not unique: ${from}`);
    }
    entry.definition = entry.definition.replace(from, to);
  }
  return entry;
});
const promotedByHeadword = new Map(
  promoted.map((entry) => [normalize(entry.normalized_headword || entry.headword), entry]),
);
const merged = existing
  .filter((entry) => !promotedByHeadword.has(normalize(entry.normalized_headword || entry.headword)))
  .concat(promoted)
  .sort((a, b) => normalize(a.normalized_headword).localeCompare(normalize(b.normalized_headword)));

await writeFile(outputPath, `${JSON.stringify(merged, null, 2)}\n`);

console.log(`Promoted ${promoted.length} scan-reviewed Webster entries from ${packetPaths.length} packet(s).`);
for (const entry of promoted) console.log(`- ${entry.normalized_headword}: ${entry.source_file}`);
