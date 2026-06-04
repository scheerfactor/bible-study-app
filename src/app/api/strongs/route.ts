import fs from "node:fs/promises";
import path from "node:path";

type StrongEntry = {
  strongs_number: string;
  language: "Greek" | "Hebrew" | "Aramaic";
  original_word: string;
  transliteration?: string;
  pronunciation?: string;
  english_words: string[];
  root?: string;
  related_numbers?: string[];
  plain_definition: string;
  first_occurrence?: string;
  key_verses?: string[];
  source_title?: string;
  source_url?: string;
  rights_status?: string;
  review_status?: string;
};

let cachedEntries: StrongEntry[] | null = null;

async function loadEntries() {
  if (cachedEntries) return cachedEntries;
  const filePath = path.join(process.cwd(), "data/strongs/sample-verified-strongs.json");
  const raw = await fs.readFile(filePath, "utf8");
  cachedEntries = JSON.parse(raw) as StrongEntry[];
  return cachedEntries;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") ?? searchParams.get("q") ?? "").trim().toLowerCase();
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  if (query.length < 2) {
    return Response.json({ entries: [] });
  }

  const entries = await loadEntries();
  const matches = entries
    .filter((entry) => entry.review_status === "Verified")
    .filter((entry) => {
      const haystack = [
        entry.strongs_number,
        entry.language,
        entry.original_word,
        entry.transliteration ?? "",
        entry.pronunciation ?? "",
        entry.root ?? "",
        ...(entry.english_words ?? []),
        ...(entry.related_numbers ?? []),
        entry.plain_definition,
        entry.first_occurrence ?? "",
        ...(entry.key_verses ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    })
    .slice(0, limit);

  return Response.json({ entries: matches });
}
