#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");
const upload = process.argv.includes("--upload");
const cleanGutenberg = !process.argv.includes("--no-clean-gutenberg");
const defaultSourceCsv = "data/library/import-batches/storage-first-content-phase-33.csv";
const defaultReportPath = "data/library/manifests/storage-first-content-phase-33-report.json";
const defaultWorkDir = ".storage-import-work/library/verified";

function argValue(name, fallback) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

const sourceCsvPath = argValue("source", defaultSourceCsv);
const manifestPath = argValue("manifest", defaultLibraryManifest);
const reportPath = argValue("report", defaultReportPath);
const workDir = argValue("work-dir", defaultWorkDir);
const bucket = argValue("bucket", process.env.R2_BUCKET_PUBLIC_CONTENT || "fathers-business-bible-study-public");
const batchSize = Math.max(1, Number(argValue("batch-size", "25")) || 25);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      cell += "\"";
      index += 1;
      continue;
    }

    if (char === "\"") {
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
  if (host === "www.ttb.org") return "https://www.ttb.org";
  return "";
}

function commercialUseStatus(url) {
  const host = sourceHost(url);
  if (host === "www.gutenberg.org") return "verified_allowed_with_project_gutenberg_terms";
  if (host === "www.ttb.org") return "verified_allowed_permissioned_free_resource";
  return "verified_allowed_public_domain";
}

function reviewStatus(row) {
  const rights = normalizeComparisonValue(row.rights_status);
  const doctrine = normalizeComparisonValue(row.doctrinal_status);

  if (rights.includes("do not import") || doctrine.includes("do not import")) return "Do Not Import";
  if (rights.includes("permission") && !rights.includes("permissioned_free_resource")) return "Permission Needed";
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

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "FathersBusinessBibleStudy/0.1 storage-first-library-import",
    },
  });

  if (!response.ok) throw new Error(`Download failed ${response.status}: ${url}`);
  return response.text();
}

async function uploadToR2({ localPath, storagePath }) {
  return new Promise((resolve, reject) => {
    const args = [
      "wrangler",
      "r2",
      "object",
      "put",
      `${bucket}/${storagePath}`,
      "--file",
      localPath,
      "--content-type",
      "text/plain; charset=utf-8",
      "--remote",
    ];
    const child = spawn("npx", args, {
      cwd: repoRoot,
      stdio: "inherit",
      shell: false,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`R2 upload failed for ${storagePath}`));
    });
  });
}

async function writeTempText(storagePath, text) {
  const localPath = join(workDir, basename(storagePath));
  await mkdir(dirname(localPath), { recursive: true });
  await writeFile(localPath, text, "utf8");
  return localPath;
}

const sourceCsv = await readFile(sourceCsvPath, "utf8");
const sourceRows = parseCsv(sourceCsv).slice(0, batchSize);
const manifestEntries = await readLibraryManifest(manifestPath);
const manifestErrors = manifestEntries.flatMap((entry, index) => validateLibraryEntry(entry, index));

if (manifestErrors.length) {
  console.error("Refusing storage-first import until the existing library manifest validates.");
  for (const error of manifestErrors) console.error(`- ${error}`);
  process.exit(1);
}

const existingTitleAuthors = new Set(manifestEntries.map((entry) => `${normalizeComparisonValue(entry.title)}::${normalizeComparisonValue(entry.author)}`));
const existingSourceUrls = new Set(manifestEntries.map((entry) => normalizeComparisonValue(entry.source_url)));
const existingChecksums = new Set(manifestEntries.map((entry) => entry.checksum_sha256).filter(Boolean));
const batchTitleAuthors = new Set();
const batchSourceUrls = new Set();
const importedEntries = [];

const report = {
  source_csv: sourceCsvPath,
  manifest: manifestPath,
  bucket,
  dry_run: dryRun,
  upload,
  batch_size: batchSize,
  total_attempted: sourceRows.length,
  imported: 0,
  would_import: 0,
  skipped: 0,
  failed: 0,
  duplicate_titles: 0,
  duplicate_sources: 0,
  duplicate_checksums: 0,
  possible_rights_issues: 0,
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
    report.skipped += 1;
    report.rows.push(rowReport);
    continue;
  }

  if (!allowedCategories.has(category)) {
    rowReport.status = "needs_review";
    rowReport.issues.push(`Unsupported category: ${category}`);
    report.skipped += 1;
    report.rows.push(rowReport);
    continue;
  }

  if (status !== "Verified") {
    rowReport.status = status;
    rowReport.issues.push(`Not public-import ready: rights=${row.rights_status}; doctrine=${row.doctrinal_status}`);
    report.possible_rights_issues += status === "Needs Review" || status === "Permission Needed" ? 1 : 0;
    report.skipped += 1;
    report.rows.push(rowReport);
    continue;
  }

  if (!isTrustedSource(sourceUrl)) {
    rowReport.status = "needs_review";
    rowReport.issues.push(`Source host is not in the trusted storage-import allowlist: ${sourceHost(sourceUrl) || "invalid URL"}`);
    report.possible_rights_issues += 1;
    report.skipped += 1;
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
    report.rows.push(rowReport);
    continue;
  }

  const storagePath = `data/library/verified/${slugify(`${title}-${author}`) || "library-resource"}.txt`;
  if (dryRun) {
    rowReport.status = "would_import";
    rowReport.download_url = downloadUrl;
    rowReport.content_storage_path = storagePath;
    report.would_import += 1;
    report.rows.push(rowReport);
    batchTitleAuthors.add(titleAuthorKey);
    batchSourceUrls.add(sourceKey);
    continue;
  }

  let localPath = "";
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

    localPath = await writeTempText(storagePath, text);
    const fileStats = await stat(localPath);
    const words = wordCount(text);
    if (upload) {
      await uploadToR2({ localPath, storagePath });
    }

    const year = Number(row.year) || inferYearFromText(downloadedText);
    const entry = {
      title,
      author,
      year,
      category,
      collection,
      source_url: sourceUrl,
      download_url: downloadUrl,
      source_license_url: sourceLicenseUrl(sourceUrl),
      file_path: storagePath,
      content_storage_path: storagePath,
      content_storage_status: upload ? "uploaded" : "pending_upload",
      public_domain_status: "verified",
      commercial_use_status: commercialUseStatus(sourceUrl),
      attribution_required: sourceHost(sourceUrl) === "www.gutenberg.org",
      rights_basis: `${row.rights_status}. Source reviewed from ${sourceUrl}.`,
      notes: candidateDescription(row),
      import_status: upload ? "imported_storage" : "ready_for_import",
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
    if (entryErrors.length) throw new Error(entryErrors.join("; "));

    importedEntries.push(entry);
    existingChecksums.add(checksum);
    batchTitleAuthors.add(titleAuthorKey);
    batchSourceUrls.add(sourceKey);
    report.imported += 1;
    report.file_sizes.push({
      title,
      file: basename(storagePath),
      bytes: fileStats.size,
      words,
      reading_time_minutes: entry.reading_time_minutes,
      storage_status: entry.content_storage_status,
    });
    rowReport.status = upload ? "imported_storage" : "ready_for_import";
    rowReport.content_storage_path = storagePath;
    report.rows.push(rowReport);
  } catch (error) {
    rowReport.status = "failed";
    rowReport.issues.push(error.message);
    report.failed += 1;
    report.rows.push(rowReport);
  } finally {
    if (localPath) {
      try {
        await unlink(localPath);
      } catch {
        // The temp cache is ignored; failure to delete should not hide import errors.
      }
    }
  }
}

if (!dryRun && importedEntries.length) {
  const updatedManifest = [...manifestEntries, ...importedEntries];
  await writeFile(manifestPath, `${JSON.stringify(updatedManifest, null, 2)}\n`, "utf8");
}

if (!dryRun) {
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

console.log("Storage-first library import report");
console.table({
  total_attempted: report.total_attempted,
  imported: report.imported,
  would_import: report.would_import,
  skipped: report.skipped,
  failed: report.failed,
  duplicate_titles: report.duplicate_titles,
  duplicate_sources: report.duplicate_sources,
  duplicate_checksums: report.duplicate_checksums,
  possible_rights_issues: report.possible_rights_issues,
});

if (report.file_sizes.length) {
  console.log("Imported storage-backed resources");
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
  console.log(`Dry run only. Run with --upload to import and upload the first ${batchSize} eligible rows.`);
}

if (report.failed > 0) process.exit(1);
