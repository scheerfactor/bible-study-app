import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

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
const githubRawBase = "https://raw.githubusercontent.com/scheerfactor/bible-study-app";
let dictionaryPromise: Promise<WebsterEntry[]> | null = null;

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

function localDictionaryPath() {
  return resolve(/* turbopackIgnore: true */ process.cwd(), ...dictionaryRelativePath);
}

function rawGithubDictionaryUrl() {
  const ref = process.env.VERCEL_GIT_COMMIT_SHA ?? "main";
  const filePath = dictionaryRelativePath.map((part) => encodeURIComponent(part)).join("/");
  return `${githubRawBase}/${encodeURIComponent(ref)}/${filePath}`;
}

async function loadDictionaryRaw() {
  if (process.env.NODE_ENV !== "production") {
    return readFile(localDictionaryPath(), "utf8");
  }

  const response = await fetch(rawGithubDictionaryUrl());
  if (!response.ok) {
    throw new Error(`Webster dictionary fetch failed: ${response.status}`);
  }

  return response.text();
}

export async function getDictionaryEntries() {
  dictionaryPromise ??= loadDictionaryRaw().then((raw) => JSON.parse(raw) as WebsterEntry[]);
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
