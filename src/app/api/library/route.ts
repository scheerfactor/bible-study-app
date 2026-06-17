import { basename } from "node:path";
import { NextResponse } from "next/server";
import { curateLibraryEntry } from "@/lib/library-curation";
import { loadLibraryManifestEntries } from "@/lib/library-manifest";

function slugFromPath(filePath: string) {
  return basename(filePath, ".txt");
}

export async function GET() {
  const entries = await loadLibraryManifestEntries();

  return NextResponse.json({
    resources: entries.map((entry) => ({
      ...curateLibraryEntry(entry),
      slug: slugFromPath(entry.file_path),
    })),
  });
}
