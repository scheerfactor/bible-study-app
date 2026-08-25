import verses1769 from "es-kjv/json/verses-1769.js";

export const runtime = "nodejs";

const CACHE_CONTROL = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";
const PART_BOOKS: ReadonlyArray<ReadonlySet<string>> = [
  new Set(["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings"]),
  new Set(["1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Solomon's Song"]),
  new Set(["Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi"]),
  new Set(["Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"]),
];

function bookFromReference(reference: string) {
  return reference.replace(/ \d+:\d+$/, "");
}

export async function GET(request: Request) {
  const part = Number.parseInt(new URL(request.url).searchParams.get("part") ?? "", 10);
  const books = PART_BOOKS[part - 1];

  if (!books) {
    return Response.json({ error: "Bible part must be an integer from 1 through 4." }, { status: 400 });
  }

  const verses = Object.fromEntries(
    Object.entries(verses1769).filter(([reference]) => books.has(bookFromReference(reference))),
  );

  return Response.json(
    { part, verses },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
