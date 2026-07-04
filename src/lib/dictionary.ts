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

type NaveTopicEntry = {
  topic: string;
  normalized_topic: string;
  body: string;
  references?: string[];
  reference_count?: number;
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
const naveTopicalRelativePath = ["data", "generated", "naves-topical-bible.topics.json"];
let dictionaryPromise: Promise<WebsterEntry[]> | null = null;
let eastonDictionaryPromise: Promise<WebsterEntry[]> | null = null;
let naveTopicalPromise: Promise<WebsterEntry[]> | null = null;
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
  hath: "have",
  hast: "have",
  hadst: "have",
  having: "have",
  shalt: "shall",
  saith: "say",
  saidst: "say",
  saying: "say",
  sayings: "say",
  spake: "speak",
  speaketh: "speak",
  speakest: "speak",
  speaking: "speak",
  spoken: "speak",
  things: "thing",
  fathers: "father",
  did: "do",
  brethren: "brother",
  begat: "beget",
  begotten: "beget",
  dwelt: "dwell",
  dwelleth: "dwell",
  dwelling: "dwell",
  should: "should",
  shouldest: "should",
  surely: "sure",
  taken: "take",
  took: "take",
  taketh: "take",
  taking: "take",
  shewed: "shew",
  sheweth: "shew",
  shewing: "shew",
  those: "that",
  would: "will",
  known: "know",
  thyself: "self",
  yourselves: "self",
  died: "die",
  slew: "slay",
  began: "begin",
  arose: "arise",
  carried: "carry",
  goeth: "go",
  sinned: "sin",
  buried: "bury",
  oxen: "ox",
  committed: "commit",
  drew: "draw",
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
  sanctified: "sanctification",
  sanctifieth: "sanctification",
  sanctify: "sanctification",
  holiness: "holy",
  mercies: "mercy",
  merciful: "mercy",
  prophecies: "prophecy",
  prophets: "prophecy",
  prophesied: "prophecy",
  transgressions: "transgression",
  visions: "vision",
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
    [/\btlie\b/gi, "the"],
    [/\btliese\b/gi, "these"],
    [/\btliem\b/gi, "them"],
    [/\btliat\b/gi, "that"],
    [/\btliis\b/gi, "this"],
    [/\btliere\b/gi, "there"],
    [/\bwhicli\b/gi, "which"],
    [/\bwliich\b/gi, "which"],
    [/\bwhicb\b/gi, "which"],
    [/\bwliat\b/gi, "what"],
    [/\bwlio\b/gi, "who"],
    [/\bwliere\b/gi, "where"],
    [/\bwlieii\b/gi, "when"],
    [/\bwitli\b/gi, "with"],
    [/\baiid\b/gi, "and"],
    [/\baiiy\b/gi, "any"],
    [/\bauy\b/gi, "any"],
    [/\bthc\b/gi, "the"],
    [/\bcomiection\b/gi, "connection"],
    [/\bcoimection\b/gi, "connection"],
    [/\bcomiected\b/gi, "connected"],
    [/\bcoimected\b/gi, "connected"],
    [/\bcomiect\b/gi, "connect"],
    [/\bcoimect\b/gi, "connect"],
    [/\biiot\b/gi, "not"],
    [/\biiito\b/gi, "into"],
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
    [/\bAp plied\b/g, "Applied"],
    [/\bap plied\b/g, "applied"],
    [/\bho- ly\b/gi, "holy"],
    [/\both ers\b/gi, "others"],
    [/\bliiw\b/gi, "law"],
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

function formatNaveTopicDefinition(entry: NaveTopicEntry) {
  const cleanedBody = cleanDictionaryDefinition(entry.body);
  const firstReferenceMatch = cleanedBody.match(
    /\b(?:Gen|Ex|Exod|Lev|Num|Deut|Josh|Judg|Ruth|1\s*Sam|2\s*Sam|1\s*Kin|2\s*Kin|1\s*Chr|2\s*Chr|Ezra|Neh|Esth|Job|Psa|Ps|Prov|Eccl|Song|Isa|Jer|Lam|Ezek|Dan|Hos|Joel|Amos|Obad|Jonah|Mic|Nah|Hab|Zeph|Hag|Zech|Mal|Matt|Mark|Luke|John|Acts|Rom|1\s*Cor|2\s*Cor|Gal|Eph|Phil|Col|1\s*Thess|2\s*Thess|1\s*Tim|2\s*Tim|Titus|Philem|Heb|Jas|James|1\s*Pet|2\s*Pet|1\s*John|2\s*John|3\s*John|Jude|Rev)\.?\s*\d+\s*[: ]\s*\d+/i,
  );
  const displayBody = firstReferenceMatch && firstReferenceMatch.index && firstReferenceMatch.index > 0 ? cleanedBody.slice(firstReferenceMatch.index) : cleanedBody;
  const body = displayBody.slice(0, 1200);
  const references = entry.references?.slice(0, 12) ?? [];
  const referenceLine = references.length ? `\n\nKey references: ${references.join("; ")}` : "";
  const reviewLine = "\n\nReview note: Nave's OCR topic text is provided for discovery and should be spot-checked before quotation.";
  return `${body}${displayBody.length > 1200 ? "..." : ""}${referenceLine}${reviewLine}`;
}

export async function getNaveTopicalEntries() {
  naveTopicalPromise ??= readTextContent(naveTopicalRelativePath, { errorLabel: "Nave topical Bible index" })
    .then((raw) => JSON.parse(raw) as NaveTopicEntry[])
    .then((entries) =>
      entries
        .filter((entry) => entry.topic && entry.normalized_topic && entry.body && (entry.reference_count ?? 0) > 0)
        .map((entry) => ({
          headword: entry.topic,
          normalized_headword: entry.normalized_topic,
          definition: formatNaveTopicDefinition(entry),
          source_title: entry.source ?? "Nave's Topical Bible",
          source_file: entry.source_file,
          source_line_start: entry.line_start,
          source_line_end: entry.line_end,
          review_status: entry.review_status,
        }))
        .map(cleanDictionaryEntry),
    );

  return naveTopicalPromise;
}

export async function getAllDictionaryEntries() {
  allDictionaryPromise ??= Promise.all([getDictionaryEntries(), getEastonDictionaryEntries(), getNaveTopicalEntries()]).then(([websterEntries, eastonEntries, naveEntries]) => [
    ...websterEntries,
    ...eastonEntries,
    ...naveEntries,
  ]);
  return allDictionaryPromise;
}

function dictionarySourcePriority(entry: WebsterEntry) {
  if (/american dictionary|webster/i.test(entry.source_title)) return 0;
  if (/easton/i.test(entry.source_title)) return 1;
  if (/nave/i.test(entry.source_title)) return 2;
  return 3;
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
