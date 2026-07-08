import { basename } from "node:path";
import { NextResponse } from "next/server";
import { curateLibraryEntry, type LibraryManifestEntry } from "@/lib/library-curation";
import { loadLibraryManifestEntries } from "@/lib/library-manifest";
import { readTextContent } from "@/lib/server-content-storage";

function slugFromPath(filePath: string) {
  return basename(filePath, ".txt");
}

async function fetchResourceText(entry: LibraryManifestEntry) {
  return readTextContent(entry.content_storage_path ?? entry.file_path, { errorLabel: "Library text" });
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
