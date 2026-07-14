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
const cachedMappingShards = new Map<string, StrongMapping[]>();

const strongSearchAliases: Record<string, string> = {
  believest: "believe",
  believeth: "believe",
  believed: "believe",
  believing: "believe",
  believes: "believe",
  prayers: "prayer",
  prayed: "pray",
  prayeth: "pray",
  praying: "pray",
  loveth: "love",
  loved: "love",
  loving: "love",
  saved: "save",
  saveth: "save",
  saving: "save",
  saith: "say",
  spake: "speak",
  shewed: "show",
  sheweth: "show",
  doeth: "do",
  doth: "do",
  didst: "do",
  children: "child",
  brethren: "brother",
};

function cleanStrongText(value: string) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00ad/g, "")
    .replace(/([A-Za-z]{3,})-\s+([a-z]{2,})/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanStrongEntry(entry: StrongEntry): StrongEntry {
  return {
    ...entry,
    original_word: cleanStrongText(entry.original_word),
    transliteration: entry.transliteration ? cleanStrongText(entry.transliteration) : entry.transliteration,
    pronunciation: entry.pronunciation ? cleanStrongText(entry.pronunciation) : entry.pronunciation,
    english_words: (entry.english_words ?? []).map(cleanStrongText).filter(Boolean),
    plain_definition: cleanStrongText(entry.plain_definition),
    first_occurrence: entry.first_occurrence ? cleanStrongText(entry.first_occurrence) : entry.first_occurrence,
    key_verses: (entry.key_verses ?? []).map(cleanStrongText).filter(Boolean),
  };
}

async function loadEntries() {
  if (cachedEntries) return cachedEntries;
  const raw = await readTextContent("data/strongs/sample-verified-strongs.json", { errorLabel: "Strong's lexicon" });
  const baseEntries = JSON.parse(raw) as StrongEntry[];
  let batchEntries: StrongEntry[] = [];

  try {
    const batchIndexRaw = await readTextContent("data/strongs/lexicon-batches/index.json", {
      errorLabel: "Strong's lexicon batch index",
      revalidateSeconds: 86400,
    });
    const batchIndex = JSON.parse(batchIndexRaw) as { files?: string[] };
    const batchFiles = Array.isArray(batchIndex.files) ? batchIndex.files : [];
    const batches = await Promise.all(
      batchFiles.map(async (file) => {
        const batchRaw = await readTextContent(file, {
          errorLabel: `Strong's lexicon batch ${file}`,
          revalidateSeconds: 86400,
        });
        return JSON.parse(batchRaw) as StrongEntry[];
      }),
    );
    batchEntries = batches.flat();
  } catch {
    batchEntries = [];
  }

  const entriesByNumber = new Map<string, StrongEntry>();
  for (const entry of [...baseEntries, ...batchEntries]) {
    if (!entriesByNumber.has(entry.strongs_number)) {
      entriesByNumber.set(entry.strongs_number, cleanStrongEntry(entry));
    }
  }

  cachedEntries = [...entriesByNumber.values()];
  return cachedEntries;
}

function slugForBook(book: string) {
  return book
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseVerseRef(ref: string) {
  const match = ref.match(/^(.+) (\d+):(\d+)$/);
  if (!match) return null;
  return {
    book: match[1],
    chapter: Number(match[2]),
    verse: Number(match[3]),
  };
}

async function loadMappingShard(book: string, chapter: number) {
  const normalizedBook = book.trim();
  const normalizedChapter = Number(chapter);
  if (!normalizedBook || normalizedChapter <= 0) return null;

  const key = `${normalizedBook.toLowerCase()}-${normalizedChapter}`;
  if (cachedMappingShards.has(key)) return cachedMappingShards.get(key) ?? null;

  try {
    const raw = await readTextContent(`data/strongs/mappings-by-chapter/${slugForBook(normalizedBook)}-${normalizedChapter}.json`, {
      errorLabel: `KJV Strong's mappings for ${normalizedBook} ${normalizedChapter}`,
      revalidateSeconds: 86400,
    });
    const rows = JSON.parse(raw) as StrongMapping[];
    cachedMappingShards.set(key, rows);
    return rows;
  } catch {
    return null;
  }
}

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function strongSearchCandidates(value: string) {
  const normalized = normalizeSearch(value);
  const compact = normalized.replace(/\s+/g, "");
  const candidates = [normalized, compact, strongSearchAliases[compact]];
  const suffixRules: Array<[RegExp, string]> = [
    [/eth$/, ""],
    [/est$/, ""],
    [/ies$/, "y"],
    [/ing$/, ""],
    [/ed$/, ""],
    [/([sxz]|ch|sh)es$/, "$1"],
    [/s$/, ""],
  ];

  for (const [pattern, replacement] of suffixRules) {
    if (!pattern.test(compact)) continue;
    const candidate = compact.replace(pattern, replacement);
    if (candidate.length >= 3) {
      candidates.push(candidate);
      if (/[^aeiou]$/.test(candidate)) candidates.push(`${candidate}e`);
    }
  }

  return [...new Set(candidates.filter(Boolean))];
}

function normalizeStrongNumber(value: string) {
  const match = String(value ?? "").match(/^([GH])0*(\d+)$/i);
  if (!match) return String(value ?? "");
  return `${match[1].toUpperCase()}${Number(match[2])}`;
}

function scoreEntry(entry: StrongEntry, query: string) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return 0;
  const englishWords = entry.english_words ?? [];
  const relatedNumbers = entry.related_numbers ?? [];
  const keyVerses = entry.key_verses ?? [];

  if (normalizeStrongNumber(entry.strongs_number).toLowerCase() === normalizeStrongNumber(query).toLowerCase()) return 120;
  if (englishWords.some((word) => normalizeSearch(word) === normalizedQuery)) return 110;
  if (normalizeSearch(entry.original_word) === normalizedQuery) return 105;
  if (normalizeSearch(entry.transliteration ?? "") === normalizedQuery) return 100;
  if (normalizeSearch(entry.root ?? "") === normalizedQuery) return 95;
  if (relatedNumbers.some((number) => normalizeSearch(number) === normalizedQuery)) return 90;
  if (englishWords.some((word) => normalizeSearch(word).startsWith(normalizedQuery))) return 85;
  if (normalizeSearch(entry.plain_definition).includes(normalizedQuery)) return 60;
  if (keyVerses.some((verse) => normalizeSearch(verse).includes(normalizedQuery))) return 45;

  const haystack = normalizeSearch([
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
    .join(" "));

  return haystack.includes(normalizedQuery) ? 25 : 0;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const verse = (searchParams.get("verse") ?? "").trim();
  const book = (searchParams.get("book") ?? "").trim();
  const chapter = Number(searchParams.get("chapter") ?? 0);
  const query = (searchParams.get("query") ?? searchParams.get("q") ?? "").trim().toLowerCase();
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));

  if (verse || (book && chapter > 0)) {
    const parsedVerse = verse ? parseVerseRef(verse) : null;
    const shardBook = parsedVerse?.book ?? book;
    const shardChapter = parsedVerse?.chapter ?? chapter;
    const [entries, mappingShard] = await Promise.all([loadEntries(), loadMappingShard(shardBook, shardChapter)]);
    const mappings = mappingShard ?? [];
    const usedChapterShard = Boolean(mappingShard);
    const entriesByNumber = new Map(entries.map((entry) => [normalizeStrongNumber(entry.strongs_number), entry]));
    const matchingMappings = mappings
      .filter((mapping) => mapping.review_status === "Verified")
      .filter((mapping) => {
        if (verse) return mapping.verse_ref.toLowerCase() === verse.toLowerCase();
        return mapping.verse_ref.toLowerCase().startsWith(`${book.toLowerCase()} ${chapter}:`);
      })
      .sort((a, b) => a.verse_ref.localeCompare(b.verse_ref, undefined, { numeric: true }) || a.token_index - b.token_index)
      .map((mapping) => ({
        ...mapping,
        strong_entry: entriesByNumber.get(normalizeStrongNumber(mapping.strongs_number)) ?? null,
      }));

    return Response.json({
      entries: [],
      mappings: matchingMappings,
      mapping_source: usedChapterShard ? "chapter-shard" : "chapter-shard-missing",
      source_note:
        "Verse-level KJV Strong's mappings use reviewed content-storage shards. Chapters not mapped yet return no Strong's rows until reviewed.",
    });
  }

  if (query.length < 2) {
    return Response.json({ entries: [] });
  }

  const entries = await loadEntries();
  const queryCandidates = strongSearchCandidates(query);
  const matches = entries
    .filter((entry) => entry.review_status === "Verified")
    .map((entry) => ({ entry, score: Math.max(...queryCandidates.map((candidate) => scoreEntry(entry, candidate))) }))
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
