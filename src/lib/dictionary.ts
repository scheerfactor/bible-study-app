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

type EastonEntry = {
  headword: string;
  normalized_headword: string;
  definition: string;
  source?: string;
  source_file: string;
  rights_status: string;
  review_status: string;
  line_start: number;
  line_end: number;
};

const dictionaryRelativePath = ["data", "generated", "websters-1828.entries.json"];
const dictionaryOverrideRelativePath = ["data", "generated", "websters-1828-reviewed-overrides.json"];
const eastonDictionaryRelativePath = ["data", "generated", "eastons-bible-dictionary.entries.json"];
let dictionaryPromise: Promise<WebsterEntry[]> | null = null;
let eastonDictionaryPromise: Promise<WebsterEntry[]> | null = null;
let allDictionaryPromise: Promise<WebsterEntry[]> | null = null;

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
  believes: "believe",
  loved: "love",
  loveth: "love",
  lovedst: "love",
  loves: "love",
  loving: "love",
  saved: "save",
  saveth: "save",
  saves: "save",
  saving: "save",
  prayed: "pray",
  prayest: "pray",
  prayeth: "pray",
  praying: "pray",
  prayers: "prayer",
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
  return cleaned;
}

function uniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function dictionaryLookupCandidates(value: string) {
  const cleaned = cleanDictionaryWord(value);
  if (!cleaned) return [];

  const candidates = [cleaned, normalizeDictionaryWord(cleaned)];
  const suffixRules: Array<[RegExp, string]> = [
    [/eth$/, ""],
    [/est$/, ""],
    [/ies$/, "y"],
    [/ing$/, ""],
    [/ed$/, ""],
    [/s$/, ""],
  ];

  for (const [pattern, replacement] of suffixRules) {
    if (!pattern.test(cleaned)) continue;
    const candidate = cleaned.replace(pattern, replacement);
    if (candidate.length >= 3) {
      candidates.push(candidate);
      if (/[^aeiou]$/.test(candidate)) candidates.push(`${candidate}e`);
    }
  }

  return uniqueValues(candidates);
}

function cleanDictionaryDefinition(value: string) {
  const safeReplacements: Array<[RegExp, string]> = [
    [/\btlje\b/gi, "the"],
    [/\btliese\b/gi, "these"],
    [/\btliem\b/gi, "them"],
    [/\btlie\b/gi, "the"],
    [/\btliat\b/gi, "that"],
    [/\btliis\b/gi, "this"],
    [/\btliere\b/gi, "there"],
    [/\bwitli\b/gi, "with"],
    [/\bot\b/g, "of"],
    [/\bhi\.s\b/gi, "his"],
    [/\bapi\)ears\b/gi, "appears"],
    [/\binijilied\b/gi, "implied"],
    [/\bpeniiission\b/gi, "permission"],
    [/\bJt\b/g, "It"],
    [/\bOod\b/g, "God"],
    [/\bG od\b/g, "God"],
    [/\bL ord\b/g, "Lord"],
    [/\bJ esus\b/g, "Jesus"],
    [/\bC hrist\b/g, "Christ"],
    [/\bP aul\b/g, "Paul"],
    [/\bM oses\b/g, "Moses"],
    [/\bD avid\b/g, "David"],
    [/\bA braham\b/g, "Abraham"],
  ];

  let cleaned = String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00ad/g, "")
    .replace(/([A-Za-z]{3,})-\s+([a-z]{2,})/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();

  for (const [pattern, replacement] of safeReplacements) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  cleaned = cleaned.replace(/^([A-Z][A-Z' -]*),\s*71\./, "$1, n.");

  return cleaned
    .replace(/(^|[.;])\s+([1-9]|1[0-9]|20)\.\s+(?=[A-Z])/g, "$1\n\n$2. ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanDictionaryEntry(entry: WebsterEntry): WebsterEntry {
  return {
    ...entry,
    headword: String(entry.headword ?? "").replace(/\s+/g, " ").trim(),
    normalized_headword: cleanDictionaryWord(entry.normalized_headword || entry.headword),
    definition: cleanDictionaryDefinition(entry.definition),
  };
}

export async function getDictionaryEntries() {
  dictionaryPromise ??= Promise.all([
    readTextContent(dictionaryRelativePath, { errorLabel: "Webster dictionary" }).then((raw) => JSON.parse(raw) as WebsterEntry[]),
    readTextContent(dictionaryOverrideRelativePath, { errorLabel: "Webster reviewed overrides" })
      .then((raw) => JSON.parse(raw) as WebsterEntry[])
      .catch(() => []),
  ]).then(([entries, overrides]) => [...reviewedDictionaryOverlays, ...overrides, ...entries].map(cleanDictionaryEntry));
  return dictionaryPromise;
}

export async function getEastonDictionaryEntries() {
  eastonDictionaryPromise ??= readTextContent(eastonDictionaryRelativePath, { errorLabel: "Easton Bible dictionary" })
    .then((raw) => JSON.parse(raw) as EastonEntry[])
    .then((entries) =>
      entries.map((entry) => ({
        headword: entry.headword,
        normalized_headword: entry.normalized_headword,
        definition: entry.definition,
        source_title: entry.source ?? "Easton's Bible Dictionary",
        source_file: entry.source_file,
        source_line_start: entry.line_start,
        source_line_end: entry.line_end,
        review_status: entry.review_status,
      })).map(cleanDictionaryEntry),
    );

  return eastonDictionaryPromise;
}

export async function getAllDictionaryEntries() {
  allDictionaryPromise ??= Promise.all([getDictionaryEntries(), getEastonDictionaryEntries()]).then(([websterEntries, eastonEntries]) => [
    ...websterEntries,
    ...eastonEntries,
  ]);
  return allDictionaryPromise;
}

function dictionarySourcePriority(entry: WebsterEntry) {
  if (/american dictionary|webster/i.test(entry.source_title)) return 0;
  if (/easton/i.test(entry.source_title)) return 1;
  return 2;
}

export async function lookupDictionaryWord(word: string) {
  const candidates = dictionaryLookupCandidates(word);
  const entries = await getAllDictionaryEntries();
  const matches = entries
    .filter((entry) => candidates.includes(entry.normalized_headword))
    .sort((a, b) => {
      const candidatePriority = candidates.indexOf(a.normalized_headword) - candidates.indexOf(b.normalized_headword);
      if (candidatePriority !== 0) return candidatePriority;
      const priority = dictionarySourcePriority(a) - dictionarySourcePriority(b);
      if (priority !== 0) return priority;
      return b.definition.length - a.definition.length;
    });

  return {
    word: cleanDictionaryWord(word) || word,
    lookupWord: matches[0]?.normalized_headword ?? candidates[0] ?? normalizeDictionaryWord(word),
    found: matches.length > 0,
    entries: matches.slice(0, 5),
  };
}

export async function searchDictionary(query: string, limit = 25) {
  const normalizedQuery = normalizeDictionaryWord(query);
  if (normalizedQuery.length < 2) return [];

  const entries = await getAllDictionaryEntries();
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
      const sourcePriority = dictionarySourcePriority(a) - dictionarySourcePriority(b);
      if (sourcePriority !== 0) return sourcePriority;
      return a.normalized_headword.localeCompare(b.normalized_headword);
    })
    .slice(0, limit);
}
