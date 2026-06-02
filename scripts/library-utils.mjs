import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export const defaultLibraryManifest = "data/library/manifests/curated-public-domain-resources.json";
export const allowedCategories = new Set([
  "Dictionaries",
  "Topical Bible",
  "Cross References",
  "Bible Handbooks",
  "Surveys",
  "Commentaries",
  "Biographies",
  "Classics",
  "Christian Living",
  "Preaching & Teaching",
  "Bible study helps",
  "Baptist history",
  "Baptist History",
  "Evangelism",
  "Prayer",
  "Christian life",
  "Preaching/teaching",
  "Missions",
  "Fiction/classics",
]);

const trustedDownloadHosts = new Set([
  "www.gutenberg.org",
  "archive.org",
  "www.ccel.org",
]);

export async function readLibraryManifest(filePath = defaultLibraryManifest) {
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Library manifest must be a JSON array.");
  return parsed;
}

export function validateLibraryEntry(entry, index) {
  const errors = [];
  const required = [
    "title",
    "author",
    "year",
    "category",
    "source_url",
    "file_path",
    "public_domain_status",
    "commercial_use_status",
    "attribution_required",
    "notes",
    "import_status",
    "rights_basis",
  ];

  for (const field of required) {
    if (entry[field] === undefined || entry[field] === null || entry[field] === "") {
      errors.push(`entry ${index + 1}: missing ${field}`);
    }
  }

  if (!allowedCategories.has(entry.category)) {
    errors.push(`entry ${index + 1}: unsupported category "${entry.category}"`);
  }

  if (entry.public_domain_status !== "verified") {
    errors.push(`entry ${index + 1}: public_domain_status must be verified for import`);
  }

  if (!String(entry.commercial_use_status).startsWith("verified_allowed")) {
    errors.push(`entry ${index + 1}: commercial_use_status must be verified_allowed* for import`);
  }

  if (entry.import_status !== "ready_for_import" && entry.import_status !== "imported_file") {
    errors.push(`entry ${index + 1}: import_status must be ready_for_import or imported_file`);
  }

  if (!String(entry.file_path).startsWith("data/library/verified/")) {
    errors.push(`entry ${index + 1}: file_path must be under data/library/verified`);
  }

  if (entry.download_url) {
    try {
      const host = new URL(entry.download_url).host;
      if (!trustedDownloadHosts.has(host)) {
        errors.push(`entry ${index + 1}: download_url must use a trusted source host`);
      }
    } catch {
      errors.push(`entry ${index + 1}: download_url must be a valid URL`);
    }
  }

  return errors;
}

export async function fileMetadata(filePath) {
  const absolutePath = resolve(filePath);
  const text = await readFile(absolutePath, "utf8");
  const stats = await stat(absolutePath);
  return {
    checksum_sha256: createHash("sha256").update(text).digest("hex"),
    file_size_bytes: stats.size,
    word_count: text.trim().split(/\s+/).filter(Boolean).length,
  };
}

export async function downloadTextFile(url, filePath) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "FathersBusinessBibleStudy/0.1 private-beta-resource-import",
    },
  });

  if (!response.ok) {
    throw new Error(`Download failed ${response.status}: ${url}`);
  }

  const text = await response.text();
  const host = new URL(url).host;
  if (host === "www.gutenberg.org" && !text.includes("PROJECT GUTENBERG")) {
    throw new Error(`Downloaded file did not look like a Project Gutenberg text: ${url}`);
  }
  if (!trustedDownloadHosts.has(host)) {
    throw new Error(`Downloaded file host is not trusted for library imports: ${url}`);
  }

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, text, "utf8");
  return fileMetadata(filePath);
}
