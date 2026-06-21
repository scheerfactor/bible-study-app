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

type StrongMapping = {
  verse_ref: string;
  token_index: number;
  kjv_word: string;
  normalized_kjv_word: string;
  strongs_number: string;
  source_id: string;
  source_title: string;
  source_url: string;
  rights_status: string;
  rights_basis: string;
  review_status: string;
};

let cachedEntries: StrongEntry[] | null = null;
let cachedMappings: StrongMapping[] | null = null;

async function loadEntries() {
  if (cachedEntries) return cachedEntries;
  const filePath = path.join(process.cwd(), "data/strongs/sample-verified-strongs.json");
  const raw = await fs.readFile(filePath, "utf8");
  cachedEntries = JSON.parse(raw) as StrongEntry[];
  return cachedEntries;
}

async function loadMappings() {
  if (cachedMappings) return cachedMappings;
  const filePath = path.join(process.cwd(), "data/strongs/kjv-strongs-mapping.sample-reviewed.json");
  try {
    const raw = await fs.readFile(filePath, "utf8");
    cachedMappings = JSON.parse(raw) as StrongMapping[];
  } catch {
    cachedMappings = [];
  }
  return cachedMappings;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const verse = (searchParams.get("verse") ?? "").trim();
  const book = (searchParams.get("book") ?? "").trim();
  const chapter = Number(searchParams.get("chapter") ?? 0);
  const query = (searchParams.get("query") ?? searchParams.get("q") ?? "").trim().toLowerCase();
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  if (verse || (book && chapter > 0)) {
    const [entries, mappings] = await Promise.all([loadEntries(), loadMappings()]);
    const entriesByNumber = new Map(entries.map((entry) => [entry.strongs_number, entry]));
    const matchingMappings = mappings
      .filter((mapping) => mapping.review_status === "Verified")
      .filter((mapping) => {
        if (verse) return mapping.verse_ref.toLowerCase() === verse.toLowerCase();
        return mapping.verse_ref.toLowerCase().startsWith(`${book.toLowerCase()} ${chapter}:`);
      })
      .sort((a, b) => a.verse_ref.localeCompare(b.verse_ref, undefined, { numeric: true }) || a.token_index - b.token_index)
      .map((mapping) => ({
        ...mapping,
        strong_entry: entriesByNumber.get(mapping.strongs_number) ?? null,
      }));

    return Response.json({
      entries: [],
      mappings: matchingMappings,
      source_note: "Verse-level KJV Strong's mappings are reviewed samples until a full rights-cleared source is imported.",
    });
  }

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
