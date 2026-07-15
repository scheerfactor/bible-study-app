#!/usr/bin/env node
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { basename, dirname } from "node:path";
import {
  allowedCategories,
  checksumText,
  defaultLibraryManifest,
  fallbackCoverMetadata,
  inferDownloadUrl,
  inferYearFromText,
  normalizeComparisonValue,
  normalizeTextValue,
  readLibraryManifest,
  readingTimeMinutes,
  reviewedDoctrinalStatuses,
  slugify,
  stripProjectGutenbergBoilerplate,
  trustedLibrarySourceHosts,
  validateLibraryEntry,
  verifiedRightsStatuses,
  wordCount,
} from "./library-utils.mjs";

const defaultSourceCsv = "data/library/bulk-import-sources.csv";
const defaultReportPath = "data/library/manifests/bulk-import-report.json";
const dryRun = process.argv.includes("--dry-run");
const cleanGutenberg = !process.argv.includes("--no-clean-gutenberg");

function argValue(name, fallback) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

const sourceCsvPath = argValue("source", defaultSourceCsv);
const manifestPath = argValue("manifest", defaultLibraryManifest);
const reportPath = argValue("report", defaultReportPath);
const batchSize = Math.max(1, Number(argValue("batch-size", "10")) || 10);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);

  const [headers, ...body] = rows;
  if (!headers) return [];
  const normalizedHeaders = headers.map((header) => header.trim());
  return body.map((values) => Object.fromEntries(normalizedHeaders.map((header, index) => [header, values[index]?.trim() ?? ""])));
}

function splitLabels(value) {
  return normalizeTextValue(value)
    .split(/[|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function sourceHost(url) {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

function isTrustedSource(url) {
  const host = sourceHost(url);
  return host ? trustedLibrarySourceHosts.has(host) : false;
}

function isDirectTextUrl(url) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return pathname.endsWith(".txt") || pathname.endsWith(".md") || pathname.endsWith(".markdown");
  } catch {
    return false;
  }
}

function sourceLicenseUrl(url) {
  const host = sourceHost(url);
  if (host === "www.gutenberg.org") return "https://www.gutenberg.org/policy/license.html";
  if (host === "www.ccel.org") return "https://www.ccel.org/about/terms";
  if (host === "archive.org") return "https://archive.org/about/terms.php";
  return "";
}

function commercialUseStatus(url) {
  const host = sourceHost(url);
  if (host === "www.gutenberg.org") return "verified_allowed_with_project_gutenberg_terms";
  return "verified_allowed_public_domain";
}

async function pathExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function uniqueVerifiedFilePath(title, author) {
  const baseSlug = slugify(`${title}-${author}`) || "library-resource";
  let candidate = `data/library/verified/${baseSlug}.txt`;
  let suffix = 2;

  while (await pathExists(candidate)) {
    candidate = `data/library/verified/${baseSlug}-${suffix}.txt`;
    suffix += 1;
  }

  return candidate;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "FathersBusinessBibleStudy/0.1 bulk-library-import",
    },
  });

  if (!response.ok) throw new Error(`Download failed ${response.status}: ${url}`);
  return response.text();
}

function reviewStatus(row) {
  const rights = normalizeComparisonValue(row.rights_status);
  const doctrine = normalizeComparisonValue(row.doctrinal_status);

  if (rights.includes("do not import") || doctrine.includes("do not import")) return "Do Not Import";
  if (rights.includes("permission")) return "Permission Needed";
  if (rights.includes("personal")) return "Personal Use Only";
  if (!verifiedRightsStatuses.has(rights) || !reviewedDoctrinalStatuses.has(doctrine)) return "Needs Review";
  return "Verified";
}

function missingMetadata(row) {
  return [
    "title",
    "author",
    "source_url",
    "category",
    "collection",
    "rights_status",
    "doctrinal_status",
    "recommended_use",
  ].filter((field) => !normalizeTextValue(row[field]));
}

function candidateDescription(row) {
  const use = normalizeTextValue(row.recommended_use);
  const warning = normalizeTextValue(row.warning_label);
  return [use, warning ? `Labels/warnings: ${warning}.` : ""].filter(Boolean).join(" ");
}

const sourceCsv = await readFile(sourceCsvPath, "utf8");
const sourceRows = parseCsv(sourceCsv).slice(0, batchSize);
const manifestEntries = await readLibraryManifest(manifestPath);
const manifestErrors = manifestEntries.flatMap((entry, index) => validateLibraryEntry(entry, index));

if (manifestErrors.length) {
  console.error("Refusing bulk import until the existing library manifest validates.");
  for (const error of manifestErrors) console.error(`- ${error}`);
  process.exit(1);
}

const existingTitleAuthors = new Set(manifestEntries.map((entry) => `${normalizeComparisonValue(entry.title)}::${normalizeComparisonValue(entry.author)}`));
const existingSourceUrls = new Set(manifestEntries.map((entry) => normalizeComparisonValue(entry.source_url)));
const existingChecksums = new Set(manifestEntries.map((entry) => entry.checksum_sha256).filter(Boolean));
const batchTitleAuthors = new Set();
const batchSourceUrls = new Set();
const importedEntries = [];
const reviewQueues = {
  "Needs Review": [],
  "Permission Needed": [],
  "Personal Use Only": [],
  "Do Not Import": [],
};

const report = {
  source_csv: sourceCsvPath,
  manifest: manifestPath,
  dry_run: dryRun,
  batch_size: batchSize,
  total_attempted: sourceRows.length,
  imported: 0,
  would_import: 0,
  skipped: 0,
  failed: 0,
  missing_metadata: 0,
  possible_rights_issues: 0,
  duplicate_titles: 0,
  duplicate_sources: 0,
  duplicate_checksums: 0,
  file_sizes: [],
  rows: [],
};

for (const [index, row] of sourceRows.entries()) {
  const title = normalizeTextValue(row.title);
  const author = normalizeTextValue(row.author);
  const sourceUrl = normalizeTextValue(row.source_url);
  const category = normalizeTextValue(row.category);
  const collection = normalizeTextValue(row.collection);
  const status = reviewStatus(row);
  const titleAuthorKey = `${normalizeComparisonValue(title)}::${normalizeComparisonValue(author)}`;
  const sourceKey = normalizeComparisonValue(sourceUrl);
  const rowReport = {
    row: index + 2,
    title,
    author,
    status: "pending",
    issues: [],
  };

  const missing = missingMetadata(row);
  if (missing.length) {
    rowReport.status = "missing_metadata";
    rowReport.issues.push(`Missing metadata: ${missing.join(", ")}`);
    report.missing_metadata += 1;
    report.skipped += 1;
    report.rows.push(rowReport);
    continue;
  }

  if (!allowedCategories.has(category)) {
    rowReport.status = "needs_review";
    rowReport.issues.push(`Unsupported category: ${category}`);
    report.skipped += 1;
    reviewQueues["Needs Review"].push({ ...row, reason: rowReport.issues.join("; ") });
    report.rows.push(rowReport);
    continue;
  }

  if (status !== "Verified") {
    rowReport.status = status;
    rowReport.issues.push(`Not public-import ready: rights=${row.rights_status}; doctrine=${row.doctrinal_status}`);
    report.possible_rights_issues += status === "Needs Review" || status === "Permission Needed" ? 1 : 0;
    report.skipped += 1;
    reviewQueues[status].push({ ...row, reason: rowReport.issues.join("; ") });
    report.rows.push(rowReport);
    continue;
  }

  if (!isTrustedSource(sourceUrl)) {
    rowReport.status = "needs_review";
    rowReport.issues.push(`Source host is not in the trusted bulk-import allowlist: ${sourceHost(sourceUrl) || "invalid URL"}`);
    report.possible_rights_issues += 1;
    report.skipped += 1;
    reviewQueues["Needs Review"].push({ ...row, reason: rowReport.issues.join("; ") });
    report.rows.push(rowReport);
    continue;
  }

  if (existingTitleAuthors.has(titleAuthorKey) || batchTitleAuthors.has(titleAuthorKey)) {
    rowReport.status = "duplicate_title_author";
    rowReport.issues.push("Duplicate title + author");
    report.duplicate_titles += 1;
    report.skipped += 1;
    report.rows.push(rowReport);
    continue;
  }

  if (existingSourceUrls.has(sourceKey) || batchSourceUrls.has(sourceKey)) {
    rowReport.status = "duplicate_source_url";
    rowReport.issues.push("Duplicate source URL");
    report.duplicate_sources += 1;
    report.skipped += 1;
    report.rows.push(rowReport);
    continue;
  }

  const inferredDownloadUrl = inferDownloadUrl(sourceUrl);
  const downloadUrl = inferredDownloadUrl || (isDirectTextUrl(sourceUrl) ? sourceUrl : "");
  if (!downloadUrl || !isTrustedSource(downloadUrl)) {
    rowReport.status = "needs_review";
    rowReport.issues.push(`TXT or Markdown download URL is not trusted or could not be inferred from: ${sourceUrl}`);
    report.possible_rights_issues += 1;
    report.skipped += 1;
    reviewQueues["Needs Review"].push({ ...row, reason: rowReport.issues.join("; ") });
    report.rows.push(rowReport);
    continue;
  }

  if (dryRun) {
    rowReport.status = "would_import";
    rowReport.download_url = downloadUrl;
    rowReport.issues.push(cleanGutenberg && sourceHost(downloadUrl) === "www.gutenberg.org" ? "Would clean Project Gutenberg boilerplate if markers are present" : "Would keep source text as downloaded");
    report.would_import += 1;
    report.rows.push(rowReport);
    batchTitleAuthors.add(titleAuthorKey);
    batchSourceUrls.add(sourceKey);
    continue;
  }

  let filePath = "";
  try {
    const downloadedText = await fetchText(downloadUrl);
    const { text, cleaned } =
      cleanGutenberg && sourceHost(downloadUrl) === "www.gutenberg.org"
        ? stripProjectGutenbergBoilerplate(downloadedText)
        : { text: downloadedText, cleaned: false };
    const checksum = checksumText(text);

    if (existingChecksums.has(checksum)) {
      rowReport.status = "duplicate_checksum";
      rowReport.issues.push("Downloaded text checksum already exists in the library");
      report.duplicate_checksums += 1;
      report.skipped += 1;
      report.rows.push(rowReport);
      continue;
    }

    filePath = await uniqueVerifiedFilePath(title, author);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, text, "utf8");
    const fileStats = await stat(filePath);
    const words = wordCount(text);
    const explicitYear = Number.parseInt(normalizeTextValue(row.year), 10);
    const currentYear = new Date().getFullYear();
    const year =
      Number.isInteger(explicitYear) && explicitYear >= 1000 && explicitYear <= currentYear
        ? explicitYear
        : inferYearFromText(downloadedText);
    const entry = {
      title,
      author,
      year,
      category,
      collection,
      source_url: sourceUrl,
      download_url: downloadUrl,
      source_license_url: sourceLicenseUrl(sourceUrl),
      file_path: filePath,
      public_domain_status: "verified",
      commercial_use_status: commercialUseStatus(sourceUrl),
      attribution_required: sourceHost(sourceUrl) === "www.gutenberg.org",
      rights_basis:
        normalizeTextValue(row.rights_basis) || `${row.rights_status}. Source reviewed from ${sourceUrl}.`,
      notes: candidateDescription(row),
      import_status: "imported_file",
      rights_status: row.rights_status,
      doctrinal_review_status: row.doctrinal_status,
      recommended_use: row.recommended_use,
      resource_labels: [collection, ...splitLabels(row.warning_label)].filter(Boolean),
      resource_warnings: splitLabels(row.warning_label),
      cover_metadata: fallbackCoverMetadata({ title, author, category, collection }),
      reading_time_minutes: readingTimeMinutes(words),
      text_processing: cleaned ? "project_gutenberg_boilerplate_removed" : "source_text_preserved",
      checksum_sha256: checksum,
      file_size_bytes: fileStats.size,
      word_count: words,
    };

    const entryErrors = validateLibraryEntry(entry, manifestEntries.length + importedEntries.length);
    if (entryErrors.length) {
      await unlink(filePath);
      throw new Error(entryErrors.join("; "));
    }

    importedEntries.push(entry);
    existingChecksums.add(checksum);
    batchTitleAuthors.add(titleAuthorKey);
    batchSourceUrls.add(sourceKey);
    report.imported += 1;
    report.file_sizes.push({
      title,
      file: basename(filePath),
      bytes: fileStats.size,
      words,
      reading_time_minutes: entry.reading_time_minutes,
    });
    rowReport.status = "imported";
    rowReport.file_path = filePath;
    report.rows.push(rowReport);
  } catch (error) {
    if (filePath) {
      try {
        await unlink(filePath);
      } catch {
        // Ignore cleanup errors so the real import error stays visible.
      }
    }
    rowReport.status = "failed";
    rowReport.issues.push(error.message);
    report.failed += 1;
    report.rows.push(rowReport);
  }
}

if (!dryRun && importedEntries.length) {
  const updatedManifest = [...manifestEntries, ...importedEntries];
  await writeFile(manifestPath, `${JSON.stringify(updatedManifest, null, 2)}\n`, "utf8");
}

if (!dryRun) {
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify({ ...report, review_queues: reviewQueues }, null, 2)}\n`, "utf8");

  for (const [status, rows] of Object.entries(reviewQueues)) {
    if (!rows.length) continue;
    const folder =
      status === "Do Not Import"
        ? "data/library/do-not-import"
        : status === "Needs Review" || status === "Permission Needed"
          ? "data/library/needs-review"
          : "data/library/manifests";
    const queuePath = `${folder}/bulk-import-${slugify(status)}.json`;
    await mkdir(dirname(queuePath), { recursive: true });
    await writeFile(queuePath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  }
}

console.log("Bulk library import report");
console.table({
  total_attempted: report.total_attempted,
  imported: report.imported,
  would_import: report.would_import,
  skipped: report.skipped,
  failed: report.failed,
  missing_metadata: report.missing_metadata,
  possible_rights_issues: report.possible_rights_issues,
  duplicate_titles: report.duplicate_titles,
  duplicate_sources: report.duplicate_sources,
  duplicate_checksums: report.duplicate_checksums,
});

if (report.file_sizes.length) {
  console.log("Imported file sizes");
  console.table(report.file_sizes);
}

const notableRows = report.rows.filter((row) => row.status !== "would_import" || row.issues.length);
if (notableRows.length) {
  console.log("Row details");
  console.table(notableRows.map((row) => ({
    row: row.row,
    title: row.title,
    status: row.status,
    issues: row.issues.join("; "),
  })));
}

if (dryRun) {
  console.log(`Dry run only. Run without --dry-run to import the first ${batchSize} eligible rows.`);
}

if (report.failed > 0) process.exit(1);
