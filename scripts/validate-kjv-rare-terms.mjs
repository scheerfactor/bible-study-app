#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import verses1769 from "es-kjv/json/verses-1769.js";

const entriesPath = "data/generated/kjv-rare-term-reviewed-overrides.json";
const batchPath = process.argv.slice(2).find((value) => !value.startsWith("--"));
const allowedReviewStatuses = new Set([
  "reviewed_kjv_form",
  "reviewed_scripture_profile",
  "reviewed_overlay",
]);

function normalize(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z]/g, "");
}

function requireString(value, label, errors) {
  if (!String(value ?? "").trim()) errors.push(`${label} must be a non-empty string.`);
}

function lookupCandidates(value) {
  const cleaned = normalize(value);
  const candidates = [cleaned];
  const suffixRules = [
    [/eth$/, ""],
    [/est$/, ""],
    [/ies$/, "y"],
    [/ing$/, ""],
    [/ed$/, ""],
    [/([sxz]|ch|sh)es$/, "$1"],
    [/s$/, ""],
  ];

  for (const [pattern, replacement] of suffixRules) {
    if (!pattern.test(cleaned)) continue;
    const candidate = cleaned.replace(pattern, replacement);
    if (candidate.length >= 3) candidates.push(candidate);
  }

  return [...new Set(candidates.filter(Boolean))];
}

const kjvWordCounts = new Map();
for (const text of Object.values(verses1769)) {
  for (const rawWord of String(text).match(/[A-Za-z]+(?:-[A-Za-z]+)*/g) ?? []) {
    const word = normalize(rawWord);
    kjvWordCounts.set(word, (kjvWordCounts.get(word) ?? 0) + 1);
  }
}

const entries = JSON.parse(await readFile(entriesPath, "utf8"));
const errors = [];
const byHeadword = new Map();

if (!Array.isArray(entries) || !entries.length) {
  errors.push(`${entriesPath} must contain a non-empty array.`);
}

for (const [index, entry] of (Array.isArray(entries) ? entries : []).entries()) {
  const label = `Entry ${index + 1} (${entry?.headword ?? "unknown"})`;
  const normalizedHeadword = normalize(entry?.normalized_headword || entry?.headword);

  for (const field of ["headword", "normalized_headword", "definition", "source_title", "source_file", "review_status"]) {
    requireString(entry?.[field], `${label}.${field}`, errors);
  }
  if (normalize(entry?.headword) !== normalizedHeadword) {
    errors.push(`${label}.normalized_headword does not match headword.`);
  }
  if (byHeadword.has(normalizedHeadword)) {
    errors.push(`${label} duplicates ${normalizedHeadword}.`);
  } else if (normalizedHeadword) {
    byHeadword.set(normalizedHeadword, entry);
  }
  if (!allowedReviewStatuses.has(entry?.review_status)) {
    errors.push(`${label}.review_status is not approved.`);
  }
  if (!Number.isInteger(entry?.source_line_start) || entry.source_line_start < 1) {
    errors.push(`${label}.source_line_start must be a positive integer.`);
  }
  if (!Number.isInteger(entry?.source_line_end) || entry.source_line_end < entry.source_line_start) {
    errors.push(`${label}.source_line_end must not precede source_line_start.`);
  }
  if (String(entry?.source_title ?? "").startsWith("KJV ") && !String(entry?.source_file ?? "").startsWith("KJV:")) {
    errors.push(`${label} must cite its KJV references in source_file.`);
  }
}

if (batchPath) {
  const batch = JSON.parse(await readFile(batchPath, "utf8"));
  if (!Array.isArray(batch.entries) || !batch.entries.length) {
    errors.push(`${batchPath} must contain a non-empty entries array.`);
  }
  if (!String(batch.rights_basis ?? "").toLowerCase().includes("public domain")) {
    errors.push(`${batchPath}.rights_basis must state the public-domain basis.`);
  }
  requireString(batch.definition_method, `${batchPath}.definition_method`, errors);

  let formCount = 0;
  let occurrenceCount = 0;
  const seenBatchHeadwords = new Set();
  const seenForms = new Set();

  for (const batchEntry of batch.entries ?? []) {
    const headword = normalize(batchEntry.normalized_headword || batchEntry.headword);
    if (seenBatchHeadwords.has(headword)) errors.push(`Duplicate batch headword: ${headword}.`);
    seenBatchHeadwords.add(headword);

    const stored = byHeadword.get(headword);
    if (!stored) {
      errors.push(`Batch headword ${headword} is missing from ${entriesPath}.`);
      continue;
    }
    for (const field of ["definition", "source_title", "source_file", "review_status"]) {
      if (stored[field] !== batchEntry[field]) errors.push(`${headword}.${field} does not match the reviewed entry.`);
    }
    if (!Array.isArray(batchEntry.kjv_forms) || !batchEntry.kjv_forms.length) {
      errors.push(`${headword}.kjv_forms must be a non-empty array.`);
    }
    for (const form of batchEntry.kjv_forms ?? []) {
      const normalizedForm = normalize(form);
      if (!normalizedForm) errors.push(`${headword} contains an invalid KJV form.`);
      if (seenForms.has(normalizedForm)) errors.push(`Duplicate batch KJV form: ${normalizedForm}.`);
      seenForms.add(normalizedForm);
      if (!lookupCandidates(normalizedForm).includes(headword)) {
        errors.push(`${normalizedForm} does not resolve to reviewed headword ${headword}.`);
      }
      formCount += 1;
    }
    if (!Number.isInteger(batchEntry.kjv_occurrences) || batchEntry.kjv_occurrences < 1) {
      errors.push(`${headword}.kjv_occurrences must be a positive integer.`);
    } else {
      occurrenceCount += batchEntry.kjv_occurrences;
      const measuredOccurrences = (batchEntry.kjv_forms ?? []).reduce(
        (sum, form) => sum + (kjvWordCounts.get(normalize(form)) ?? 0),
        0,
      );
      if (batchEntry.kjv_occurrences !== measuredOccurrences) {
        errors.push(`${headword}.kjv_occurrences is ${batchEntry.kjv_occurrences}; measured ${measuredOccurrences}.`);
      }
    }
  }

  const summary = batch.screening_summary ?? {};
  if (summary.reviewed_entries !== (batch.entries ?? []).length) errors.push("Batch reviewed_entries total is incorrect.");
  if (summary.resolved_kjv_forms !== formCount) errors.push("Batch resolved_kjv_forms total is incorrect.");
  if (summary.kjv_word_occurrences !== occurrenceCount) errors.push("Batch kjv_word_occurrences total is incorrect.");
}

if (errors.length) {
  console.error(`KJV rare-term validation failed (${errors.length} error${errors.length === 1 ? "" : "s"}).`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`KJV rare-term validation passed: ${entries.length} unique reviewed entries.`);
if (batchPath) console.log(`Provenance batch validated: ${batchPath}`);
