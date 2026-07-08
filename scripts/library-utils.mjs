import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export const defaultLibraryManifest = "data/library/manifests/curated-public-domain-resources.json";
export const allowedCategories = new Set([
  "Dictionaries",
  "Topical Bible",
  "Cross References",
  "Bible Handbooks",
  "Bible Survey / Whole Bible / Commentary Helps",
  "Surveys",
  "Commentaries",
  "Biographies",
  "Classics",
  "Christian Living",
  "Preaching & Teaching",
  "KJV / Textual Issues",
  "KJV/Textual Issues",
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
  "www.ttb.org",
]);

export const trustedLibrarySourceHosts = trustedDownloadHosts;

export const verifiedRightsStatuses = new Set([
  "verified",
  "public domain",
  "public-domain",
  "public_domain",
  "verified public domain",
  "permissioned_free_resource",
]);

export const publicLibraryAccessStatuses = new Set([
  ...verifiedRightsStatuses,
  "permissioned_free_resource",
]);

export const reviewedDoctrinalStatuses = new Set([
  "reviewed",
  "beta reviewed",
  "verified",
  "approved",
]);

export function libraryContentPath(entry) {
  return String(entry.content_storage_path || entry.file_path || "");
}

export function isStorageBackedLibraryEntry(entry) {
  return Boolean(entry.content_storage_path || entry.content_storage_status === "uploaded");
}

export async function readLibraryManifest(filePath = defaultLibraryManifest) {
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("Library manifest must be a JSON array.");
  return parsed;
}

export function normalizeTextValue(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function normalizeComparisonValue(value) {
  return normalizeTextValue(value).toLowerCase();
}

export function slugify(value) {
  return normalizeComparisonValue(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 110);
}

export function readingTimeMinutes(wordCount, wordsPerMinute = 225) {
  return Math.max(1, Math.round(Number(wordCount || 0) / wordsPerMinute));
}

export function checksumText(text) {
  return createHash("sha256").update(text).digest("hex");
}

export function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function inferDownloadUrl(sourceUrl) {
  try {
    const url = new URL(sourceUrl);
    const gutenbergMatch = url.hostname === "www.gutenberg.org" && url.pathname.match(/^\/ebooks\/(\d+)/);
    if (gutenbergMatch) return `https://www.gutenberg.org/ebooks/${gutenbergMatch[1]}.txt.utf-8`;
  } catch {
    return "";
  }

  return "";
}

export function stripProjectGutenbergBoilerplate(text) {
  const startPattern = /\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i;
  const endPattern = /\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i;
  const start = text.search(startPattern);
  const end = text.search(endPattern);

  if (start === -1 || end === -1 || end <= start) {
    return { text, cleaned: false };
  }

  const startMatch = text.slice(start).match(startPattern);
  if (!startMatch) return { text, cleaned: false };

  return {
    text: text.slice(start + startMatch[0].length, end).trimStart().trimEnd() + "\n",
    cleaned: true,
  };
}

export function inferYearFromText(text) {
  const releaseMatch = text.match(/Release date:\s*.*?\b(1[5-9]\d{2}|20\d{2})\b/i);
  if (releaseMatch) return Number(releaseMatch[1]);

  const firstPublicationMatch = text.match(/(?:first published|published|copyright)\D{0,40}\b(1[5-9]\d{2}|20\d{2})\b/i);
  if (firstPublicationMatch) return Number(firstPublicationMatch[1]);

  return new Date().getFullYear();
}

export function fallbackCoverMetadata({ title, author, category, collection }) {
  const seed = title.length + author.length + category.length;
  const palettes = [
    { from: "#314c43", to: "#a67d3d" },
    { from: "#583f32", to: "#55705f" },
    { from: "#29435f", to: "#8a7241" },
    { from: "#3f4a34", to: "#7b5641" },
  ];

  return {
    type: "generated-fallback",
    title,
    author,
    category,
    collection: collection || category,
    badge: collection || category,
    palette: palettes[seed % palettes.length],
  };
}

export function validateLibraryEntry(entry, index) {
  const errors = [];
  const required = [
    "title",
    "author",
    "year",
    "category",
    "collection",
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

  if (!publicLibraryAccessStatuses.has(entry.public_domain_status)) {
    errors.push(`entry ${index + 1}: public_domain_status must be verified or permissioned_free_resource for import`);
  }

  if (!String(entry.commercial_use_status).startsWith("verified_allowed")) {
    errors.push(`entry ${index + 1}: commercial_use_status must be verified_allowed* for import`);
  }

  if (!["ready_for_import", "imported_file", "imported_storage"].includes(entry.import_status)) {
    errors.push(`entry ${index + 1}: import_status must be ready_for_import, imported_file, or imported_storage`);
  }

  if (!String(entry.file_path).startsWith("data/library/verified/")) {
    errors.push(`entry ${index + 1}: file_path must be under data/library/verified`);
  }

  if (entry.content_storage_path) {
    if (!String(entry.content_storage_path).startsWith("data/library/verified/")) {
      errors.push(`entry ${index + 1}: content_storage_path must be under data/library/verified`);
    }
    if (String(entry.content_storage_path).includes("..") || String(entry.content_storage_path).includes("\\")) {
      errors.push(`entry ${index + 1}: content_storage_path contains unsafe path characters`);
    }
  }

  if (entry.import_status === "imported_storage") {
    if (entry.content_storage_status !== "uploaded") {
      errors.push(`entry ${index + 1}: imported_storage entries must set content_storage_status to uploaded`);
    }
    for (const field of ["checksum_sha256", "file_size_bytes", "word_count"]) {
      if (!entry[field]) errors.push(`entry ${index + 1}: imported_storage entries must include ${field}`);
    }
  }

  if (entry.download_url) {
    try {
      if (String(entry.download_url).startsWith("/")) {
        if (!String(entry.download_url).startsWith("/library/")) {
          errors.push(`entry ${index + 1}: local download_url must be under /library`);
        }
      } else {
        const host = new URL(entry.download_url).host;
        if (!trustedDownloadHosts.has(host)) {
          errors.push(`entry ${index + 1}: download_url must use a trusted source host`);
        }
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
    checksum_sha256: checksumText(text),
    file_size_bytes: stats.size,
    word_count: wordCount(text),
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
