#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

function argValue(name, fallback) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

const inputPath = argValue("input", "data/library/import-batches/storage-first-public-domain-expansion-phase-45.csv");
const outputPath = argValue("output", "data/library/import-batches/storage-first-public-domain-expansion-phase-45-reviewed.csv");
const reportPath = argValue("report", "data/library/manifests/storage-first-public-domain-expansion-phase-45-review.json");
const manifestPath = "data/library/manifests/curated-public-domain-resources.json";

function parseCsv(text) {
  const records = [];
  let record = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      record.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      record.push(cell);
      if (record.some((value) => value.trim())) records.push(record);
      record = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || record.length) {
    record.push(cell);
    if (record.some((value) => value.trim())) records.push(record);
  }
  const [headers, ...rows] = records;
  return rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
}

function csv(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/accc?ording|acording/g, "according")
    .replace(/certaintles/g, "certainties")
    .replace(/preaached/g, "preached")
    .replace(/methos/g, "methods")
    .replace(/ofafrica/g, "of africa")
    .replace(/\bafrican and asia\b/g, "africa and asia")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function authorFingerprint(value) {
  const raw = String(value ?? "").split(/;|\band\b|\n/i)[0].trim();
  const surnameFirst = raw.match(/^([^,]+),\s*([^,(]+?)(?:\s*\(([^)]+)\))?(?:,|$)/);
  const reordered = surnameFirst ? `${surnameFirst[3] || surnameFirst[2]} ${surnameFirst[1]}` : raw;
  const credentialWords = new Set([
    "by", "digitized", "indexed", "edited", "editor", "rev", "reverend", "very",
    "dr", "d", "dd", "ma", "litt", "littd", "jr", "sr", "ministry",
  ]);
  const words = normalize(reordered)
    .split(" ")
    .filter((word) => word && !/^\d{4}$/.test(word) && !credentialWords.has(word));
  if (words.length > 1 && words[0].length > 1 && words.slice(1).every((word) => word.length === 1)) {
    return `${words[0]}::${words.slice(1).join("")}`;
  }
  return words.length ? `${words.at(-1)}::${words.slice(0, -1).map((word) => word[0]).join("")}` : "";
}

function titleTokens(value) {
  return normalize(value)
    .replace(/\b(?:microform|volume|vol|edition|ed|original scan)\b/g, " ")
    .split(" ")
    .filter(Boolean);
}

function sameWork(left, right) {
  const a = titleTokens(left);
  const b = titleTokens(right);
  if (!a.length || !b.length) return false;
  if (a.join(" ") === b.join(" ")) return true;
  const aSet = new Set(a);
  const bSet = new Set(b);
  const intersection = [...aSet].filter((token) => bSet.has(token)).length;
  const smaller = Math.min(aSet.size, bSet.size);
  const union = new Set([...aSet, ...bSet]).size;
  if (smaller >= 4 && intersection / smaller >= 0.8 && intersection / union >= 0.55) return true;
  const short = a.length <= b.length ? a : b;
  const long = a.length <= b.length ? b : a;
  if (short.length >= 3 && short.every((token, index) => long[index] === token)) return true;
  return short.length === 2 && long.length >= 5 && short.every((token, index) => long[index] === token);
}

function distinctiveTitleMatch(left, right) {
  const a = titleTokens(left);
  const b = titleTokens(right);
  if (a.length < 5 || b.length < 5) return false;
  if (a.join(" ") === b.join(" ")) return true;
  const short = a.length <= b.length ? a : b;
  const long = a.length <= b.length ? b : a;
  return short.length >= 5 && short.every((token, index) => long[index] === token);
}

const rows = parseCsv(await readFile(inputPath, "utf8"));
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const existingByAuthor = new Map();
const existingTitles = [];
for (const item of manifest) {
  const author = authorFingerprint(item.author);
  existingByAuthor.set(author, [...(existingByAuthor.get(author) ?? []), item.title]);
  existingTitles.push(item.title);
}

const accepted = [];
const acceptedByAuthor = new Map();
const rejected = [];
const nonBookPattern = /\b(?:journal of the society|proceedings|transactions|annual report|school catalog|college catalog)\b/i;
const manualRejectPatterns = [
  /asiatic proverbs from clarke'?s commentary/i,
  /the words of lockman .* from clarke'?s commentary/i,
  /^the holy bible containing the old and new testament$/i,
  /^baptist history$/i,
  /^selected sermons$/i,
  /^old testament characters$/i,
  /^the pulpit commentary\b/i,
  /machine[ -]gun.*drill/i,
  /^beowulf\b/i,
  /^king james bible printable format/i,
  /^kjv 1611\b/i,
  /^1611 king james bible$/i,
  /^the holy bible,? an exact reprint/i,
  /^biblia cabalistica/i,
  /^he kaine diatheke/i,
  /^ko te paipera tapu/i,
  /^the interlinear bible/i,
  /^pilgerreise zur seligen ewigkeit/i,
  /^de heilige oorlog/i,
  /^kristityn vaellus/i,
  /^lone pine: the story of a lost mine/i,
  /^history of randolph county/i,
  /^carroll, b\. h\. - historical collections of south carolina/i,
  /treasury of david in one volume/i,
  /^poems and prose.*spurgeon/i,
  /^a synopsis of criticisms/i,
];

for (const row of rows) {
  const author = authorFingerprint(row.author);
  const unreliableAuthor = /^(?:various|unknown|digitized by|indexed by)/i.test(String(row.author).trim());
  let reason = "";
  if (String(row.author).includes(";")) reason = "multiple contributors; not a clearly authored ministry work";
  else if (nonBookPattern.test(row.title)) reason = "periodical, proceedings, or catalog rather than a selected book";
  else if (manualRejectPatterns.some((pattern) => pattern.test(row.title.trim()))) reason = "manual review identified an excerpt, unrelated work, foreign-language duplicate, or resource already represented more usefully";
  else if (existingTitles.some((title) => distinctiveTitleMatch(title, row.title))) reason = "same distinctive work title already exists in Library under another author form or edition";
  else if (unreliableAuthor && existingTitles.some((title) => normalize(title) === normalize(row.title) || sameWork(title, row.title))) reason = "same work already exists in Library under another title, author form, or edition";
  else if ((existingByAuthor.get(author) ?? []).some((title) => sameWork(title, row.title))) reason = "same work already exists in Library under another title or edition";
  else if ((acceptedByAuthor.get(author) ?? []).some((title) => sameWork(title, row.title))) reason = "same work already selected in this batch under another title or edition";

  if (reason) {
    rejected.push({ title: row.title, author: row.author, reason });
    continue;
  }
  accepted.push(row);
  acceptedByAuthor.set(author, [...(acceptedByAuthor.get(author) ?? []), row.title]);
}

const headers = Object.keys(rows[0] ?? {});
await writeFile(outputPath, `${headers.join(",")}\n${accepted.map((row) => headers.map((header) => csv(row[header])).join(",")).join("\n")}\n`, "utf8");
await writeFile(reportPath, `${JSON.stringify({
  generated_at: new Date().toISOString(),
  input: inputPath,
  output: outputPath,
  input_rows: rows.length,
  accepted_rows: accepted.length,
  rejected_rows: rejected.length,
  rejected,
}, null, 2)}\n`, "utf8");

console.log(`Reviewed ${rows.length} candidates: ${accepted.length} accepted, ${rejected.length} rejected.`);
