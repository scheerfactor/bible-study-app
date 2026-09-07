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
  if (entry.file_path.endsWith("the-gospel-of-matthew-an-exposition-gaebelein-arno-clemens-1861-1945-2.txt")) {
    const start = text.indexOf("The  Gospel  of  Matthew  stands  first");
    const end = text.indexOf("\nINDEX  TO  VOLUME", start);
    if (start < 0 || end < 0) return text;

    return text
      .slice(start, end)
      .replace(/([A-Za-z])-[ \t]*\n[ \t]*([a-z])/g, "$1$2")
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph
        .split("\n")
        .map((line) => line.trim().replace(/\s{2,}/g, " "))
        .filter((line) => line && !/^\d+$/.test(line))
        .join(" ")
        .trim())
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }

  if (entry.file_path.endsWith("the-acts-of-the-apostles-an-exposition-arno-c-gaebelein.txt")) {
    const start = text.indexOf("CHAPTER I.");
    const end = text.indexOf("\nTABE-END,", start);
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
          if (/^Chapter\s+\S{1,3}\s+\S{1,5}$/i.test(line)) return false;
          if (line.length < 50 && /The Acts of the Apostles/i.test(line)) return false;
          return true;
        })
        .join(" ")
        .trim())
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }

  if (entry.file_path.endsWith("commentary-on-the-gospel-of-mark-alexander-joseph-addison-1809-1860.txt")) {
    const start = text.indexOf("PREFACE");
    const end = text.indexOf("\nDate  Due", start);
    if (start < 0 || end < 0) return text;

    return text
      .slice(start, end)
      .replace(/([A-Za-z])-[ \t]*\n[ \t]*([a-z])/g, "$1$2")
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph
        .split("\n")
        .map((line) => line.trim().replace(/\s{2,}/g, " "))
        .filter((line) => {
          if (!line || /^\d+[.*]?$/.test(line)) return false;
          if (line.length < 50 && /MARKS?/i.test(line) && /\d/.test(line)) return false;
          if (/^(?:[IVXLCDM]+\s+)?(?:PREFACE|INTRODUCTION)\.?(?:\s+[IVXLCDM]+)?$/i.test(line) && line !== "PREFACE" && line !== "INTRODUCTION.") return false;
          return true;
        })
        .join(" ")
        .trim())
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }

  if (entry.file_path.endsWith("the-gospel-of-john-a-popular-commentary-upon-a-critical-basis-especialy-designed-for-pastors-and-sunday-school.txt")) {
    const start = text.indexOf("PREFACE.");
    const end = text.indexOf("\nINDEX.", start);
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
          if (/^A\.\s*D\.\s*[0-9A-Z.,:\s-]+$/i.test(line)) return false;
          if (/^\d+\s+JOHN\s+[IVXLCDM]+\.?$/i.test(line)) return false;
          if (/^JOHN\s+\S{1,6}$/i.test(line)) return false;
          return true;
        })
        .join(" ")
        .trim())
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }

  if (entry.file_path.endsWith("lectures-on-the-epistle-to-the-romans-h-a-ironside.txt")) {
    const start = text.indexOf("FOREWORD");
    const finalStart = text.indexOf("“To God only wise be glory through Jesus", start);
    const finalLine = "Christ for ever. Amen.”";
    const finalEnd = text.indexOf(finalLine, finalStart);
    if (start < 0 || finalStart < 0 || finalEnd < 0) return text;

    return text
      .slice(start, finalEnd + finalLine.length)
      .replace(/([A-Za-z])-[ \t]*\n[ \t]*([a-z])/g, "$1$2")
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph
        .split("\n")
        .map((line) => line.trim().replace(/\s*\|\s*/g, " ").replace(/\s{2,}/g, " "))
        .filter((line) => {
          if (!line || /^\d+$/.test(line) || /^[|{}]+$/.test(line)) return false;
          if (/^[TL]HE CINCINNATI BIBLE(?: SEMINARY)?/i.test(line)) return false;
          if (/^(?:SEMINARY )?LIBRARY\b/i.test(line)) return false;
          if (/^\d+ Lectures on Romans$/i.test(line)) return false;
          if (/^(?:The Theme and Analysis|Salutation and Introduction|Introduction|The Need of the Gospel|The Gospel in Relation to our Sins|The Gospel in Relation to Indwelling Sin|The Triumph of Grace|The Christian’s Relation to Governments|Christian Liberty & Consideration for Others|Christ, the Believer’s Pattern|Conclusion|Salutations|The Mystery Revealed) \d+$/i.test(line)) return false;
          return true;
        })
        .join(" ")
        .trim())
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }

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
