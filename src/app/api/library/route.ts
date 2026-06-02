import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { NextResponse } from "next/server";
import { curateLibraryEntry, type LibraryManifestEntry } from "@/lib/library-curation";

const manifestPath = resolve(process.cwd(), "data", "library", "manifests", "curated-public-domain-resources.json");

function slugFromPath(filePath: string) {
  return basename(filePath, ".txt");
}

export async function GET() {
  const raw = await readFile(manifestPath, "utf8");
  const entries = JSON.parse(raw) as LibraryManifestEntry[];

  return NextResponse.json({
    resources: entries.map((entry) => ({
      ...curateLibraryEntry(entry),
      slug: slugFromPath(entry.file_path),
    })),
  });
}
