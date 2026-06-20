import { readTextContent } from "@/lib/server-content-storage";

export type WebsterEntry = {
  headword: string;
  normalized_headword: string;
  definition: string;
  source_title: string;
  source_file: string;
  source_line_start: number;
  source_line_end: number;
  review_status: string;
};

const dictionaryRelativePath = ["data", "generated", "websters-1828.entries.json"];
const dictionaryOverrideRelativePath = ["data", "generated", "websters-1828-reviewed-overrides.json"];
let dictionaryPromise: Promise<WebsterEntry[]> | null = null;

const reviewedDictionaryOverlays: WebsterEntry[] = [
  {
    headword: "DO",
    normalized_headword: "do",
    definition:
      "DO, verb transitive or auxiliary; preterit tense Did; participle passive Done. To perform; to execute; to carry into effect; to exert labor or power for bringing any thing to the state desired, or to completion; to bring any thing to pass. Also, to practice or perform, as to do good or evil.",
    source_title: "American Dictionary of the English Language",
    source_file: "https://webstersdictionary1828.com/Home?word=Do",
    source_line_start: 1,
    source_line_end: 1,
    review_status: "reviewed_overlay",
  },
];

const dictionaryAliases: Record<string, string> = {
  believest: "believe",
  believeth: "believe",
  believed: "believe",
  believing: "believe",
  loved: "love",
  loveth: "love",
  lovedst: "love",
  saved: "save",
  saveth: "save",
  condemneth: "condemn",
  condemned: "condemn",
  doeth: "do",
  doth: "do",
  didst: "do",
};

export function cleanDictionaryWord(value: string) {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

export function normalizeDictionaryWord(value: string) {
  const cleaned = cleanDictionaryWord(value);
  if (!cleaned) return "";
  if (dictionaryAliases[cleaned]) return dictionaryAliases[cleaned];

  const suffixRules: Array<[RegExp, string]> = [
    [/eth$/, ""],
    [/est$/, ""],
    [/ies$/, "y"],
    [/ing$/, ""],
    [/ed$/, ""],
    [/s$/, ""],
  ];

  for (const [pattern, replacement] of suffixRules) {
    const candidate = cleaned.replace(pattern, replacement);
    if (candidate.length >= 3) return candidate;
  }

  return cleaned;
}

export async function getDictionaryEntries() {
  dictionaryPromise ??= Promise.all([
    readTextContent(dictionaryRelativePath, { errorLabel: "Webster dictionary" }).then((raw) => JSON.parse(raw) as WebsterEntry[]),
    readTextContent(dictionaryOverrideRelativePath, { errorLabel: "Webster reviewed overrides" })
      .then((raw) => JSON.parse(raw) as WebsterEntry[])
      .catch(() => []),
  ]).then(([entries, overrides]) => [...reviewedDictionaryOverlays, ...overrides, ...entries]);
  return dictionaryPromise;
}

export async function lookupDictionaryWord(word: string) {
  const normalized = normalizeDictionaryWord(word);
  const entries = await getDictionaryEntries();
  const matches = entries
    .filter((entry) => entry.normalized_headword === normalized)
    .sort((a, b) => b.definition.length - a.definition.length);

  return {
    word: cleanDictionaryWord(word) || word,
    lookupWord: normalized,
    found: matches.length > 0,
    entries: matches.slice(0, 5),
  };
}

export async function searchDictionary(query: string, limit = 25) {
  const normalizedQuery = normalizeDictionaryWord(query);
  if (normalizedQuery.length < 2) return [];

  const entries = await getDictionaryEntries();
  return entries
    .filter(
      (entry) =>
        entry.normalized_headword.includes(normalizedQuery) ||
        entry.headword.toLowerCase().replace(/[^a-z]/g, "").includes(normalizedQuery),
    )
    .sort((a, b) => {
      const aExact = a.normalized_headword === normalizedQuery ? 0 : 1;
      const bExact = b.normalized_headword === normalizedQuery ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      const aPrefix = a.normalized_headword.startsWith(normalizedQuery) ? 0 : 1;
      const bPrefix = b.normalized_headword.startsWith(normalizedQuery) ? 0 : 1;
      if (aPrefix !== bPrefix) return aPrefix - bPrefix;
      return a.normalized_headword.localeCompare(b.normalized_headword);
    })
    .slice(0, limit);
}
