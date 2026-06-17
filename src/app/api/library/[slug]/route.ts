import { basename, resolve } from "node:path";
import { NextResponse } from "next/server";
import { curateLibraryEntry, type LibraryManifestEntry } from "@/lib/library-curation";
import { readFile } from "node:fs/promises";
import { loadLibraryManifestEntries } from "@/lib/library-manifest";

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

function localResourcePath(filePath: string) {
  return resolve(/* turbopackIgnore: true */ process.cwd(), filePath);
}

async function fetchResourceText(entry: LibraryManifestEntry) {
  if (process.env.NODE_ENV !== "production") {
    return readFile(localResourcePath(entry.file_path), "utf8");
  }

  const textUrl = rawGithubUrl(entry.file_path);
  const response = await fetch(textUrl, { next: { revalidate: 60 * 60 * 24 } });

  if (!response.ok) {
    throw new Error(`Library text fetch failed: ${response.status}`);
  }

  return response.text();
}

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const entries = await loadLibraryManifestEntries();
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
