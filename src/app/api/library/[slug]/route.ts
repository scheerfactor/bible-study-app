import { basename, resolve } from "node:path";
import { NextResponse } from "next/server";
import { curateLibraryEntry, type LibraryManifestEntry } from "@/lib/library-curation";
import { readFile } from "node:fs/promises";

const manifestPath = resolve(process.cwd(), "data", "library", "manifests", "curated-public-domain-resources.json");
const githubRawBase = "https://raw.githubusercontent.com/scheerfactor/bible-study-app";

function slugFromPath(filePath: string) {
  return basename(filePath, ".txt");
}

function rawGithubUrl(filePath: string) {
  const ref = process.env.VERCEL_GIT_COMMIT_SHA ?? "main";
  const encodedPath = filePath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${githubRawBase}/${encodeURIComponent(ref)}/${encodedPath}`;
}

function localVerifiedResourcePath(filePath: string) {
  return resolve(process.cwd(), "data", "library", "verified", basename(filePath));
}

async function fetchResourceText(entry: LibraryManifestEntry) {
  if (process.env.NODE_ENV !== "production") {
    return readFile(localVerifiedResourcePath(entry.file_path), "utf8");
  }

  const textUrl = rawGithubUrl(entry.file_path);
  const response = await fetch(textUrl, { next: { revalidate: 60 * 60 * 24 } });

  if (!response.ok) {
    return readFile(localVerifiedResourcePath(entry.file_path), "utf8");
  }

  return response.text();
}

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const raw = await readFile(manifestPath, "utf8");
  const entries = JSON.parse(raw) as LibraryManifestEntry[];
  const entry = entries.find((candidate) => slugFromPath(candidate.file_path) === slug);

  if (!entry) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  const text = await fetchResourceText(entry);

  return NextResponse.json({
    resource: {
      ...curateLibraryEntry(entry),
      slug,
    },
    text,
  });
}
