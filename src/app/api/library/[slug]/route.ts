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

function prepareResourceText(entry: LibraryManifestEntry, text: string) {
  if (!entry.file_path.endsWith("notes-on-the-epistle-to-the-philippians-h-a-ironside.txt")) return text;

  const titleStart = text.indexOf("NOTES ON PHILIPPIANS");
  const start = titleStart >= 0 ? titleStart : text.indexOf("Introductory Thoughts");
  const end = text.indexOf("\nTNT ", start);
  if (start < 0 || end < 0) return text;

  return text
    .slice(start, end)
    .replace(/([A-Za-z])-[ \t]*\n[ \t]*([a-z])/g, "$1$2")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph
      .split("\n")
      .map((line) => line.trim().replace(/\s{2,}/g, " "))
      .filter((line) => {
        if (!line || /^\d+$/.test(line)) return false;
        if (/^\d+ Notes on Philippians$/i.test(line)) return false;
        if (/^(?:Notes on Philippians|Introductory Thoughts|The Introduction|Joy in Gospel Testimony|Christ is all in Life or Death|Unity in Gospel Testimony|“?Others”?|“?The Kenosis”?|The Exaltation of the Man Christ Jesus|Working out Salvation|The Mind of Christ Exemplified|Timothy Himself|Epaphroditus, the Devoted Messenger|“?Rejoice”?|Self-confidence set aside for Christ|Paul’s Steadfast Purpose|Perfection in Two Aspects|Enemies of the Cross of Christ|Heavenly Citizenship|Exhortation to Unity|Joy and Peace|Exhortations|Ministry in Temporal Things) \d+$/i.test(line)) return false;
        return true;
      })
      .join(" ")
      .trim())
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const entries = await loadLibraryManifestEntries();
  const entry = entries.find((candidate) => slugFromPath(candidate.file_path) === slug);

  if (!entry) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  }

  const text = prepareResourceText(entry, await fetchResourceText(entry));

  return NextResponse.json({
    resource: {
      ...curateLibraryEntry(entry),
      slug,
    },
    text,
  });
}
