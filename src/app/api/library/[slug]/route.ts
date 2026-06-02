import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { NextResponse } from "next/server";
import { curateLibraryEntry, type LibraryManifestEntry } from "@/lib/library-curation";

const manifestPath = resolve(process.cwd(), "data", "library", "manifests", "curated-public-domain-resources.json");
const libraryRoot = resolve(process.cwd(), "data", "library", "verified");

function slugFromPath(filePath: string) {
  return basename(filePath, ".txt");
}

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const raw = await readFile(manifestPath, "utf8");
  const entries = JSON.parse(raw) as LibraryManifestEntry[];
  const entry = entries.find((candidate) => slugFromPath(candidate.file_path) === slug);

  if (!entry) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  const filePath = resolve(libraryRoot, basename(entry.file_path));
  if (!filePath.startsWith(libraryRoot)) {
    return NextResponse.json({ error: "Invalid resource path." }, { status: 400 });
  }

  const text = await readFile(filePath, "utf8");

  return NextResponse.json({
    resource: {
      ...curateLibraryEntry(entry),
      slug,
    },
    text,
  });
}
