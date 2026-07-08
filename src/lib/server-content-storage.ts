import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

type ReadContentOptions = {
  errorLabel?: string;
  preferRepository?: boolean;
  revalidateSeconds?: number;
};

const githubRawBase = "https://raw.githubusercontent.com/scheerfactor/bible-study-app";

function normalizeRelativePath(relativePath: string | string[]) {
  return Array.isArray(relativePath) ? relativePath.join("/") : relativePath;
}

function encodedPath(relativePath: string) {
  return relativePath
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function withContentVersion(url: string) {
  const version = process.env.VERCEL_GIT_COMMIT_SHA;
  if (!version) return url;

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(version)}`;
}

function publicContentUrl(relativePath: string) {
  const baseUrl = (process.env.CONTENT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_CONTENT_BASE_URL)?.replace(/\/+$/, "");

  if (baseUrl) {
    return withContentVersion(`${baseUrl}/${encodedPath(relativePath)}`);
  }

  const ref = process.env.VERCEL_GIT_COMMIT_SHA ?? "main";
  return `${githubRawBase}/${encodeURIComponent(ref)}/${encodedPath(relativePath)}`;
}

function githubRawContentUrl(relativePath: string) {
  const ref = process.env.VERCEL_GIT_COMMIT_SHA ?? "main";
  return withContentVersion(`${githubRawBase}/${encodeURIComponent(ref)}/${encodedPath(relativePath)}`);
}

function candidateContentUrls(relativePath: string) {
  const primaryUrl = publicContentUrl(relativePath);
  const fallbackUrl = githubRawContentUrl(relativePath);
  return primaryUrl === fallbackUrl ? [primaryUrl] : [primaryUrl, fallbackUrl];
}

export async function readTextContent(relativePathInput: string | string[], options: ReadContentOptions = {}) {
  const relativePath = normalizeRelativePath(relativePathInput);

  if (process.env.NODE_ENV !== "production" || process.env.VERCEL !== "1") {
    return readFile(resolve(/* turbopackIgnore: true */ process.cwd(), relativePath), "utf8");
  }

  const urls = options.preferRepository ? [githubRawContentUrl(relativePath)] : candidateContentUrls(relativePath);
  let lastStatus = 0;

  for (const url of urls) {
    const response = await fetch(url, {
      next: { revalidate: options.revalidateSeconds ?? 60 * 60 * 24 },
    });

    if (response.ok) return response.text();

    lastStatus = response.status;
  }

  const label = options.errorLabel ?? "Content";
  throw new Error(`${label} fetch failed: ${lastStatus}`);
}
