import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

type ReadContentOptions = {
  errorLabel?: string;
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

function publicContentUrl(relativePath: string) {
  const baseUrl = process.env.CONTENT_PUBLIC_BASE_URL?.replace(/\/+$/, "");

  if (baseUrl) {
    return `${baseUrl}/${encodedPath(relativePath)}`;
  }

  const ref = process.env.VERCEL_GIT_COMMIT_SHA ?? "main";
  return `${githubRawBase}/${encodeURIComponent(ref)}/${encodedPath(relativePath)}`;
}

export async function readTextContent(relativePathInput: string | string[], options: ReadContentOptions = {}) {
  const relativePath = normalizeRelativePath(relativePathInput);

  if (process.env.NODE_ENV !== "production" || process.env.VERCEL !== "1") {
    return readFile(resolve(/* turbopackIgnore: true */ process.cwd(), relativePath), "utf8");
  }

  const response = await fetch(publicContentUrl(relativePath), {
    next: { revalidate: options.revalidateSeconds ?? 60 * 60 * 24 },
  });

  if (!response.ok) {
    const label = options.errorLabel ?? "Content";
    throw new Error(`${label} fetch failed: ${response.status}`);
  }

  return response.text();
}
