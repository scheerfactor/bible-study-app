import { basename } from "node:path";
import { NextResponse } from "next/server";

type StudyToolSource = {
  id: string;
  title: string;
  author: string;
  category: "Dictionary" | "Topical Bible" | "Geography" | "Chronology" | "Manners and Customs";
  fileName: string;
  sourceUrl: string;
  rightsStatus: string;
};

const githubRawBase = "https://raw.githubusercontent.com/scheerfactor/bible-study-app";

const sources: StudyToolSource[] = [
  {
    id: "easton",
    title: "Easton's Bible Dictionary",
    author: "M. G. Easton",
    category: "Dictionary",
    fileName: "eastons-bible-dictionary.txt",
    sourceUrl: "https://www.crosswire.org/sword/copyright/ModInfoCopyright.jsp?modName=Easton",
    rightsStatus: "Verified public-domain resource in the curated Library.",
  },
  {
    id: "smith",
    title: "Smith's Comprehensive Dictionary of the Bible",
    author: "William Smith; Samuel W. Barnum, editor",
    category: "Dictionary",
    fileName: "smiths-comprehensive-dictionary-of-the-bible.txt",
    sourceUrl: "https://archive.org/details/SmithWMAComprehensiveDictionaryOfTheBible1868",
    rightsStatus: "Verified public-domain resource in the curated Library.",
  },
  {
    id: "nave",
    title: "Nave's Topical Bible",
    author: "Orville J. Nave",
    category: "Topical Bible",
    fileName: "naves-topical-bible.txt",
    sourceUrl: "https://openlibrary.org/books/OL7245590M/Nave%E2%80%99s_Topical_Bible_A_Digest_Of_The_Holy_Scriptures",
    rightsStatus: "Verified public-domain resource in the curated Library.",
  },
  {
    id: "bible-atlas",
    title: "Bible Atlas: A Manual of Biblical Geography and History",
    author: "Jesse Lyman Hurlbut and John Heyl Vincent",
    category: "Geography",
    fileName: "bible-atlas-a-manual-of-biblical-geography-and-history-jesse-lyman-hurlbut-and-john-heyl-vincent.txt",
    sourceUrl: "https://www.gutenberg.org/",
    rightsStatus: "Verified public-domain resource in the curated Library.",
  },
  {
    id: "biblical-geography-history",
    title: "Biblical Geography and History",
    author: "Charles Foster Kent",
    category: "Geography",
    fileName: "biblical-geography-and-history-kent-charles-foster.txt",
    sourceUrl: "https://www.gutenberg.org/",
    rightsStatus: "Verified public-domain resource in the curated Library.",
  },
  {
    id: "ot-history",
    title: "Studies in Old Testament History",
    author: "Jesse Lyman Hurlbut",
    category: "Chronology",
    fileName: "studies-in-old-testament-history-jesse-lyman-hurlbut.txt",
    sourceUrl: "https://www.gutenberg.org/",
    rightsStatus: "Verified public-domain resource in the curated Library.",
  },
  {
    id: "bible-periods",
    title: "The Bible Period by Period",
    author: "Josiah Blake Tidwell",
    category: "Chronology",
    fileName: "the-bible-period-by-period-a-manual-for-the-study-of-the-bible-by-periods-josiah-blake-tidwell.txt",
    sourceUrl: "https://www.gutenberg.org/",
    rightsStatus: "Verified public-domain resource in the curated Library.",
  },
  {
    id: "bible-animals",
    title: "Bible Animals",
    author: "J. G. Wood",
    category: "Manners and Customs",
    fileName: "bible-animals-being-a-description-of-every-living-creature-mentioned-in-the-scripture-from-the-ape-to-the-cora.txt",
    sourceUrl: "https://www.gutenberg.org/ebooks/42964",
    rightsStatus: "Verified public-domain resource in the curated Library.",
  },
  {
    id: "biblical-history-geography",
    title: "A Class-Book of Biblical History and Geography",
    author: "H. S. Osborn",
    category: "Manners and Customs",
    fileName: "a-class-book-of-biblical-history-and-geography-with-numerous-maps-osborn-h-s-henry-stafford.txt",
    sourceUrl: "https://www.gutenberg.org/",
    rightsStatus: "Verified public-domain resource in the curated Library.",
  },
];

function slugFromFileName(fileName: string) {
  return basename(fileName, ".txt");
}

function rawGithubUrl(fileName: string) {
  const ref = process.env.VERCEL_GIT_COMMIT_SHA ?? "main";
  const filePath = ["data", "library", "verified", fileName]
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${githubRawBase}/${encodeURIComponent(ref)}/${filePath}`;
}

function clean(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function sourceMatchesFilter(source: StudyToolSource, filter: string) {
  if (filter === "all") return true;
  return source.category.toLowerCase().includes(filter);
}

function headingNear(lines: string[], index: number) {
  for (let pointer = index; pointer >= Math.max(0, index - 12); pointer -= 1) {
    const line = compactWhitespace(lines[pointer] ?? "");
    if (!line) continue;
    if (line.length <= 90 && /[A-Za-z]/.test(line)) return line;
  }
  return "Matching section";
}

function snippetFor(lines: string[], index: number) {
  return compactWhitespace(lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 3)).join(" ")).slice(0, 520);
}

async function searchSource(source: StudyToolSource, query: string, perSourceLimit: number) {
  const response = await fetch(rawGithubUrl(source.fileName), { next: { revalidate: 60 * 60 * 24 } });
  if (!response.ok) return [];

  const raw = await response.text();
  const lines = raw.split(/\r?\n/);
  const normalizedQuery = clean(query);
  const terms = normalizedQuery.split(/\s+/).filter((term) => term.length > 1);
  const results = [];
  const seen = new Set<string>();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const normalizedLine = clean(line);
    if (!terms.every((term) => normalizedLine.includes(term))) continue;

    const heading = headingNear(lines, index);
    const key = `${source.id}:${heading}:${index}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      id: key,
      tool_id: source.id,
      title: source.title,
      author: source.author,
      category: source.category,
      resource_slug: slugFromFileName(source.fileName),
      heading,
      snippet: snippetFor(lines, index),
      source_url: source.sourceUrl,
      rights_status: source.rightsStatus,
      line_number: index + 1,
    });
    if (results.length >= perSourceLimit) break;
  }

  return results;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 24), 1), 50);
  const filter = clean(searchParams.get("filter") ?? "all") || "all";

  if (query.length < 2) {
    return NextResponse.json({ entries: [] });
  }

  const activeSources = sources.filter((source) => sourceMatchesFilter(source, filter));
  const perSourceLimit = Math.max(2, Math.ceil(limit / Math.max(1, activeSources.length)));
  const entries = (await Promise.all(activeSources.map((source) => searchSource(source, query, perSourceLimit))))
    .flat()
    .slice(0, limit);

  return NextResponse.json({ entries });
}
