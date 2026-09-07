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
  if (entry.file_path.endsWith("lectures-on-the-epistle-to-the-colossians-ironside-h-a-henry-allan-1876-1951.txt")) {
    const start = text.indexOf("PREFACE");
    const end = text.indexOf("The Complete Writings of H. A. IRONSIDE", start);
    if (start < 0 || end < 0) return text;

    return text
      .slice(start, end)
      .replace(/([A-Za-z])-[ \t]*\n[ \t]*([a-z])/g, "$1$2")
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph
        .split("\n")
        .map((line) => line.trim().replace(/\s*\|\s*/g, " ").replace(/\s{2,}/g, " "))
        .filter((line) => {
          if (!line || /^\d+$/.test(line) || /^[|{}]+$/.test(line)) return false;
          if (/^\d+ Lectures on Colossians$/i.test(line)) return false;
          if (/^(?:School of Theology|at Claremont)$/i.test(line)) return false;
          if (/^(?:General Considerations and Analysis|The Salutation and Introduction|Paul['’]s Prayer and Thanksgiving|Christ the Firstborn|Paul['’]s Twofold Ministry|Christ the True Wisdom|Christ the Antidote|Christ the Believer['’]s Life and Object|Practical Holiness|The Earthly Relationships of the New Man|Concluding Exhortations|Closing Salutations).*\d+$/i.test(line)) return false;
          return true;
        })
        .join(" ")
        .trim())
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }

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
