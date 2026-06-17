import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { LibraryManifestEntry } from "@/lib/library-curation";

const manifestRelativePath = ["data", "library", "manifests", "curated-public-domain-resources.json"];
const githubRawBase = "https://raw.githubusercontent.com/scheerfactor/bible-study-app";
let manifestPromise: Promise<LibraryManifestEntry[]> | null = null;

function localManifestPath() {
  return resolve(/* turbopackIgnore: true */ process.cwd(), ...manifestRelativePath);
}

function rawGithubManifestUrl() {
  const ref = process.env.VERCEL_GIT_COMMIT_SHA ?? "main";
  const filePath = manifestRelativePath.map((part) => encodeURIComponent(part)).join("/");
  return `${githubRawBase}/${encodeURIComponent(ref)}/${filePath}`;
}

async function loadManifestRaw() {
  if (process.env.NODE_ENV !== "production") {
    return readFile(localManifestPath(), "utf8");
  }

  const response = await fetch(rawGithubManifestUrl());
  if (!response.ok) {
    throw new Error(`Library manifest fetch failed: ${response.status}`);
  }

  return response.text();
}

export async function loadLibraryManifestEntries() {
  manifestPromise ??= loadManifestRaw().then((raw) => JSON.parse(raw) as LibraryManifestEntry[]);
  return manifestPromise;
}
