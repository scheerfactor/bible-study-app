import { readTextContent } from "@/lib/server-content-storage";

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
  const raw = await readTextContent("data/strongs/sample-verified-strongs.json", { errorLabel: "Strong's lexicon" });
  cachedEntries = JSON.parse(raw) as StrongEntry[];
  return cachedEntries;
}

async function loadMappings() {
  if (cachedMappings) return cachedMappings;
  try {
    const raw = await readTextContent("data/strongs/kjv-strongs-mappings.reviewed.json", {
      errorLabel: "KJV Strong's mappings",
    });
    cachedMappings = JSON.parse(raw) as StrongMapping[];
  } catch {
    cachedMappings = [];
  }
  return cachedMappings;
}

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function scoreEntry(entry: StrongEntry, query: string) {
  const normalizedQuery = normalizeSearch(query);
  const englishWords = entry.english_words ?? [];
  const relatedNumbers = entry.related_numbers ?? [];
  const keyVerses = entry.key_verses ?? [];

  if (entry.strongs_number.toLowerCase() === query) return 120;
  if (englishWords.some((word) => normalizeSearch(word) === normalizedQuery)) return 110;
  if (normalizeSearch(entry.original_word) === normalizedQuery) return 105;
  if (normalizeSearch(entry.transliteration ?? "") === normalizedQuery) return 100;
  if (normalizeSearch(entry.root ?? "") === normalizedQuery) return 95;
  if (relatedNumbers.some((number) => normalizeSearch(number) === normalizedQuery)) return 90;
  if (englishWords.some((word) => normalizeSearch(word).startsWith(normalizedQuery))) return 85;
  if (normalizeSearch(entry.plain_definition).includes(normalizedQuery)) return 60;
  if (keyVerses.some((verse) => normalizeSearch(verse).includes(normalizedQuery))) return 45;

  const haystack = [
    entry.strongs_number,
    entry.language,
    entry.original_word,
    entry.transliteration ?? "",
    entry.pronunciation ?? "",
    entry.root ?? "",
    ...englishWords,
    ...relatedNumbers,
    entry.plain_definition,
    entry.first_occurrence ?? "",
    ...keyVerses,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query) ? 25 : 0;
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
    .map((entry) => ({ entry, score: scoreEntry(entry, query) }))
    .filter((match) => match.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.entry.strongs_number.localeCompare(b.entry.strongs_number, undefined, { numeric: true }),
    )
    .map((match) => match.entry)
    .slice(0, limit);

  return Response.json({ entries: matches });
}
