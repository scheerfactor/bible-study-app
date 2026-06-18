#!/usr/bin/env node
import { createHash, createHmac } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const csvArg = process.argv.find((arg) => arg.startsWith("--csv="));
const csvPath = csvArg ? csvArg.split("=").slice(1).join("=") : "";
const execute = process.argv.includes("--execute");
const dryRun = !execute || process.argv.includes("--dry-run");
const requiredEnv = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"];
const allowedKinds = new Set(["Audiobook", "Sermon Audio", "Sermon Video", "Teaching Series", "Bible Audio"]);
const publicUploadRights = new Set(["Public Domain", "Approved"]);
const allowedExtensions = new Set(["mp3", "m4a", "m4b", "aac", "wav", "mp4", "mov", "webm"]);
const allowedContentTypes = new Set([
  "audio/aac",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/webm",
  "audio/x-m4a",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/octet-stream",
]);

function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function hmac(key, value, encoding) {
  return createHmac("sha256", key).update(value).digest(encoding);
}

function hashHex(value) {
  return createHash("sha256").update(value).digest("hex");
}

function amzDate(date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function dateStamp(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function signingKey(secretAccessKey, date, region, service) {
  const kDate = hmac(`AWS4${secretAccessKey}`, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function encodeKey(key) {
  return key.split("/").map((part) => encodeURIComponent(part)).join("/");
}

function parseCsv(content) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];
    if (inQuotes && char === '"' && next === '"') {
      value += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && char === ",") {
      row.push(value);
      value = "";
      continue;
    }
    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((field) => field.trim())) rows.push(row);
      row = [];
      value = "";
      continue;
    }
    value += char;
  }

  row.push(value);
  if (row.some((field) => field.trim())) rows.push(row);
  if (rows.length === 0) return [];
  const headers = rows.shift().map((header) => header.trim());
  return rows.map((fields, rowIndex) => {
    const record = { rowNumber: rowIndex + 2 };
    headers.forEach((header, index) => {
      record[header] = fields[index]?.trim() ?? "";
    });
    return record;
  });
}

function extensionFromPath(path) {
  return path.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
}

function contentTypeForPath(path) {
  const extension = extensionFromPath(path);
  if (extension === "mp3") return "audio/mpeg";
  if (extension === "m4a" || extension === "m4b") return "audio/mp4";
  if (extension === "aac") return "audio/aac";
  if (extension === "wav") return "audio/wav";
  if (extension === "webm") return path.startsWith("video/") ? "video/webm" : "audio/webm";
  if (extension === "mp4") return "video/mp4";
  if (extension === "mov") return "video/quicktime";
  return "application/octet-stream";
}

function validateStoragePath(row) {
  const storagePath = row.storage_path;
  if (!storagePath || storagePath.length > 500) return "storage_path is required and must be under 500 characters";
  if (storagePath.startsWith("/") || storagePath.includes("..") || storagePath.includes("\\") || /[{}]/.test(storagePath)) {
    return "storage_path contains unsafe characters";
  }
  if (row.kind === "Sermon Video") {
    if (!storagePath.startsWith("video/")) return "Sermon Video rows must use video/ storage paths";
  } else if (!storagePath.startsWith("audio/")) {
    return "audio-oriented rows must use audio/ storage paths";
  }
  const extension = extensionFromPath(storagePath);
  if (!allowedExtensions.has(extension)) return `unsupported storage_path extension: ${extension || "none"}`;
  return "";
}

async function validateRows(rows) {
  const errors = [];
  const warnings = [];
  const seenStoragePaths = new Set();
  const prepared = [];

  for (const row of rows) {
    const label = `row ${row.rowNumber}`;
    const sourcePath = isAbsolute(row.local_file) ? row.local_file : resolve(repoRoot, row.local_file || "");
    const contentType = row.content_type || contentTypeForPath(row.storage_path);

    for (const field of ["local_file", "storage_path", "kind", "title", "creator", "rights_status", "visibility"]) {
      if (!row[field]) errors.push(`${label}: missing ${field}`);
    }
    if (!allowedKinds.has(row.kind)) errors.push(`${label}: unsupported kind ${row.kind}`);
    if (!publicUploadRights.has(row.rights_status)) errors.push(`${label}: direct media upload requires Public Domain or Approved rights_status`);
    if (!allowedContentTypes.has(contentType)) errors.push(`${label}: unsupported content_type ${contentType}`);
    const pathError = validateStoragePath(row);
    if (pathError) errors.push(`${label}: ${pathError}`);
    if (seenStoragePaths.has(row.storage_path)) errors.push(`${label}: duplicate storage_path ${row.storage_path}`);
    seenStoragePaths.add(row.storage_path);

    let fileStat = null;
    try {
      fileStat = await stat(sourcePath);
      if (!fileStat.isFile()) errors.push(`${label}: local_file is not a file`);
    } catch {
      errors.push(`${label}: local_file not found (${sourcePath})`);
    }
    if (row.rights_status === "Approved" && !row.source_url && !row.notes) {
      warnings.push(`${label}: Approved media should include source_url or notes documenting permission`);
    }

    prepared.push({
      ...row,
      sourcePath,
      contentType,
      size: fileStat?.size ?? 0,
    });
  }

  return { prepared, errors, warnings };
}

async function uploadItem(item, config) {
  const body = await readFile(item.sourcePath);
  const now = new Date();
  const requestDate = amzDate(now);
  const requestDateStamp = dateStamp(now);
  const region = "auto";
  const service = "s3";
  const encodedObjectKey = encodeKey(item.storage_path);
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${config.bucket}/${encodedObjectKey}`;
  const payloadHash = hashHex(body);
  const headers = {
    "content-type": item.contentType,
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": requestDate,
  };
  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers).sort().map((name) => `${name}:${headers[name]}\n`).join("");
  const canonicalRequest = ["PUT", canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${requestDateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", requestDate, credentialScope, hashHex(canonicalRequest)].join("\n");
  const signature = hmac(signingKey(config.secretAccessKey, requestDateStamp, region, service), stringToSign, "hex");
  const authorization = [
    "AWS4-HMAC-SHA256",
    `Credential=${config.accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ");

  const url = `https://${host}${canonicalUri}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: { ...headers, authorization },
    body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Upload failed for ${item.local_file}: ${response.status} ${text.slice(0, 300)}`);
  }
}

async function main() {
  if (!csvPath) {
    console.log("Media batch uploader");
    console.log("Provide a batch CSV before uploading.");
    console.log("Sample: data/media/batches/media-upload-batch.sample.csv");
    console.log("Dry run: npm run media:upload -- --csv=data/media/batches/my-media-batch.csv --dry-run");
    console.log("Execute: npm run media:upload -- --csv=data/media/batches/my-media-batch.csv --execute");
    return;
  }

  const csvFullPath = isAbsolute(csvPath) ? csvPath : join(repoRoot, csvPath);
  const rows = parseCsv(await readFile(csvFullPath, "utf8"));
  const { prepared, errors, warnings } = await validateRows(rows);
  const totalBytes = prepared.reduce((total, item) => total + item.size, 0);

  console.log("Media batch upload summary");
  console.table({
    csv: csvPath,
    rows: rows.length,
    files: prepared.length,
    total_mb: Math.round((totalBytes / 1024 / 1024) * 10) / 10,
    errors: errors.length,
    warnings: warnings.length,
    mode: dryRun ? "dry-run" : "execute",
  });

  if (warnings.length) {
    console.log("Warnings");
    for (const warning of warnings) console.log(`- ${warning}`);
  }
  if (errors.length) {
    console.error("Errors");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  if (dryRun) {
    console.log("Dry run only. No files uploaded.");
    console.log(`Run: npm run media:upload -- --csv=${csvPath} --execute`);
    for (const item of prepared.slice(0, 10)) {
      console.log(`- ${item.local_file} -> ${item.storage_path} (${item.contentType}, ${Math.round(item.size / 1024)} KB)`);
    }
    return;
  }

  const missing = requiredEnv.filter((name) => !process.env[name]);
  const bucket = process.env.R2_BUCKET_MEDIA || process.env.R2_BUCKET_PUBLIC_CONTENT;
  if (!bucket) missing.push("R2_BUCKET_MEDIA or R2_BUCKET_PUBLIC_CONTENT");
  if (missing.length > 0) throw new Error(`Cannot upload. Missing environment variables: ${missing.join(", ")}`);

  const config = {
    accountId: env("R2_ACCOUNT_ID"),
    accessKeyId: env("R2_ACCESS_KEY_ID"),
    secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
    bucket,
  };

  let uploaded = 0;
  for (const item of prepared) {
    await uploadItem(item, config);
    uploaded += 1;
    if (uploaded % 10 === 0 || uploaded === prepared.length) {
      console.log(`Uploaded ${uploaded}/${prepared.length}: ${basename(item.sourcePath)}`);
    }
  }
  console.log(`Upload complete: ${uploaded} media files uploaded to R2 bucket ${config.bucket}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
