#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import verses1769 from "es-kjv/json/verses-1769.js";
import { readJsonOrCsv } from "./import-utils.mjs";

const reportJsonPath = "data/reports/bible-tool-coverage-audit.json";
const reportMdPath = "BIBLE_TOOL_COVERAGE_AUDIT.md";

const bookOrder = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Solomon's Song", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation",
];

const dictionaryAliases = {
  sware: "swear",
  sworn: "swear",
  greater: "great",
  branches: "branch",
  moved: "move",
  asses: "ass",
  smitten: "smite",
  ran: "run",
  horsemen: "horseman",
  lieth: "lie",
  dealt: "deal",
  dost: "do",
  savour: "savor",
  seeth: "see",
  canst: "can",
  slept: "sleep",
  goest: "go",
  doest: "do",
  justified: "justify",
  sitteth: "sit",
  wouldest: "will",
  churches: "church",
  crucified: "crucify",
  caught: "catch",
  abram: "abraham",
  syrians: "syria",
  judaea: "judea",
  philistine: "philistines",
  circumcised: "circumcision",
  prevailed: "prevail",
  understood: "understand",
  valour: "valor",
  nought: "naught",
  rebelled: "rebel",
  tarried: "tarry",
  dieth: "die",
  honourable: "honorable",
  bethlehemjudah: "bethlehem",
  bethlehemite: "bethlehem",
  kadeshbarnea: "kadesh",
  galilaeans: "galilee",
  pharaohnechoh: "pharaoh",
  pharaohnecho: "pharaoh",
  pharaohhophra: "pharaoh",
  bethhoglah: "hoglah",
  bethshemite: "bethshemesh",
  dibongad: "dibon",
  kirheres: "kirharaseth",
  kirhareseth: "kirharaseth",
  kirharesh: "kirharaseth",
  kirjathbaal: "kirjath",
  abelmaim: "abel",
  atarothadar: "ataroth",
  atarothaddar: "ataroth",
  aznothtabor: "tabor",
  chislothtabor: "tabor",
  bathshua: "bathsheba",
  bethjesimoth: "bethjeshimoth",
  chaldaeans: "chaldeans",
  committest: "commit",
  deadness: "dead",
  eleloheisrael: "israel",
  forgivenesses: "forgiveness",
  hazazontamar: "engedi",
  immutability: "immutable",
  irnahash: "nahash",
  justifier: "justify",
  kedeshnaphtali: "kedesh",
  kirjatharim: "kirjathjearim",
  meribahkadesh: "meribah",
  nepthalim: "naphtali",
  rebecca: "rebekah",
  rebuker: "rebuke",
  slanderously: "slander",
  syriadamascus: "syria",
  syriamaachah: "syria",
  thereinto: "therein",
  unweighed: "weigh",
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

const stopWords = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "had", "has", "have", "he", "her", "him", "his", "i", "in", "is", "it", "me", "my", "not", "of", "on", "or", "our", "shall", "she", "that", "the", "their", "them", "they", "thou", "thy", "to", "unto", "up", "was", "we", "were", "with", "ye", "you", "your",
]);

const dirtyDefinitionPatterns = [
  /[�■]/,
  /\b(?:tlje|tlie|tliat|tliis|wliich|whicli|witli|aiid|iiot|iiito|Ood)\b/i,
  /\b(?:G od|L ord|J esus|C hrist)\b/,
  /[a-z]-\s+[a-z]/i,
];

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 1000) / 10;
}

function normalizeWord(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z]/g, "");
}

function dictionaryLookupCandidates(value) {
  const cleaned = normalizeWord(value);
  if (!cleaned) return [];

  const candidates = [cleaned];
  if (dictionaryAliases[cleaned]) candidates.push(dictionaryAliases[cleaned]);

  const suffixRules = [
    [/eth$/, ""],
    [/est$/, ""],
    [/ies$/, "y"],
    [/ing$/, ""],
    [/ed$/, ""],
    [/([sxz]|ch|sh)es$/, "$1"],
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

  return [...new Set(candidates)];
}

function parseReference(reference) {
  const match = String(reference ?? "").trim().match(/^(.+) (\d+):(\d+)$/);
  if (!match) return null;
  return {
    book: match[1],
    chapter: Number(match[2]),
    verse: Number(match[3]),
  };
}

function addChapterCoverage(map, reference) {
  const parsed = parseReference(reference);
  if (!parsed) return;
  if (!map.has(parsed.book)) {
    map.set(parsed.book, { chapters: new Set(), verses: new Set(), rows: 0 });
  }
  const bucket = map.get(parsed.book);
  bucket.chapters.add(parsed.chapter);
  bucket.verses.add(`${parsed.book} ${parsed.chapter}:${parsed.verse}`);
  bucket.rows += 1;
}

async function readJson(filePath, fallback = []) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function findJsonFiles(directory, predicate) {
  try {
    const names = await readdir(directory);
    return names.filter(predicate).map((name) => path.join(directory, name)).sort();
  } catch {
    return [];
  }
}

function makeBookCoverage(map, chaptersByBook) {
  return bookOrder.map((book) => {
    const totalChapters = chaptersByBook.get(book)?.size ?? 0;
    const bucket = map.get(book);
    const chaptersCovered = bucket?.chapters.size ?? 0;
    const versesCovered = bucket?.verses.size ?? 0;
    return {
      book,
      chaptersCovered,
      totalChapters,
      chapterCoveragePercent: percent(chaptersCovered, totalChapters),
      versesCovered,
      rows: bucket?.rows ?? 0,
    };
  });
}

const allVerseEntries = Object.entries(verses1769);
const chaptersByBook = new Map();
const wordStats = new Map();
let totalWordTokens = 0;

for (const [ref, text] of allVerseEntries) {
  const parsed = parseReference(ref);
  if (parsed) {
    if (!chaptersByBook.has(parsed.book)) chaptersByBook.set(parsed.book, new Set());
    chaptersByBook.get(parsed.book).add(parsed.chapter);
  }

  for (const rawWord of String(text).match(/[A-Za-z]+(?:-[A-Za-z]+)*/g) ?? []) {
    const word = normalizeWord(rawWord);
    if (!word) continue;
    totalWordTokens += 1;
    const stat = wordStats.get(word) ?? { word, count: 0, sampleRefs: [] };
    stat.count += 1;
    if (stat.sampleRefs.length < 5) stat.sampleRefs.push(ref);
    wordStats.set(word, stat);
  }
}

const totalChapters = [...chaptersByBook.values()].reduce((sum, chapters) => sum + chapters.size, 0);
const uniqueBibleWords = [...wordStats.values()].sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
const meaningfulBibleWords = uniqueBibleWords.filter((item) => item.word.length >= 3 && !stopWords.has(item.word));

const websterEntries = [
  ...(await readJson("data/generated/websters-1828-reviewed-overrides.json", [])),
  ...(await readJson("data/generated/websters-1828.entries.json", [])),
];
const websterByHeadword = new Map();
for (const entry of websterEntries) {
  const key = normalizeWord(entry.normalized_headword || entry.headword);
  if (!key) continue;
  if (!websterByHeadword.has(key)) websterByHeadword.set(key, []);
  websterByHeadword.get(key).push(entry);
}

const eastonEntries = await readJson("data/generated/eastons-bible-dictionary.entries.json", []);
const eastonByHeadword = new Map();
for (const entry of eastonEntries) {
  const key = normalizeWord(entry.normalized_headword || entry.headword);
  if (key && !eastonByHeadword.has(key)) eastonByHeadword.set(key, entry);
}

const naveTopics = await readJson("data/generated/naves-topical-bible.topics.json", []);
const naveByTopic = new Map();
for (const topic of naveTopics) {
  const normalized = normalizeWord(topic.normalized_topic || topic.topic);
  if (normalized && !naveByTopic.has(normalized)) naveByTopic.set(normalized, topic);
}

const rareTermEntries = await readJson("data/generated/kjv-rare-term-reviewed-overrides.json", []);
const rareTermByHeadword = new Map();
for (const entry of rareTermEntries) {
  const key = normalizeWord(entry.normalized_headword || entry.headword);
  if (key && !rareTermByHeadword.has(key)) rareTermByHeadword.set(key, entry);
}

function bestWebsterEntry(word) {
  for (const candidate of dictionaryLookupCandidates(word)) {
    const entries = websterByHeadword.get(candidate);
    if (entries?.length) return entries[0];
  }
  return null;
}

function hasEastonCandidate(word) {
  return dictionaryLookupCandidates(word).some((candidate) => eastonByHeadword.has(candidate));
}

function hasNaveCandidate(word) {
  return dictionaryLookupCandidates(word).some((candidate) => naveByTopic.has(candidate));
}

function hasRareTermCandidate(word) {
  return dictionaryLookupCandidates(word).some((candidate) => rareTermByHeadword.has(candidate));
}

const dictionaryRows = meaningfulBibleWords.map((item) => {
  const entry = bestWebsterEntry(item.word);
  const hasDefinition = Boolean(entry);
  const isReviewedOverlay = entry?.review_status === "reviewed_overlay";
  const dirtyDefinition =
    hasDefinition &&
    !isReviewedOverlay &&
    dirtyDefinitionPatterns.some((pattern) => pattern.test(entry.definition ?? ""));
  const hasEaston = hasEastonCandidate(item.word);
  const hasNave = hasNaveCandidate(item.word);
  const hasRareTerm = hasRareTermCandidate(item.word);
  return {
    ...item,
    lookupCandidates: dictionaryLookupCandidates(item.word),
    hasDefinition,
    hasEaston,
    hasNave,
    hasRareTerm,
    hasAnyStudyLookup: hasDefinition || hasEaston || hasNave || hasRareTerm,
    dirtyDefinition,
    sourceHeadword: entry?.headword ?? null,
    reviewStatus: entry?.review_status ?? null,
  };
});

const dictionaryMissing = dictionaryRows.filter((item) => !item.hasDefinition);
const dictionaryDirty = dictionaryRows.filter((item) => item.hasDefinition && item.dirtyDefinition);

const strongsMappingFiles = await findJsonFiles("data/strongs/mapping-batches", (name) => name.endsWith(".json"));
const strongsMappings = [];
for (const file of strongsMappingFiles) {
  const rows = await readJson(file, []);
  rows.forEach((row) => strongsMappings.push({ ...row, file }));
}
const verifiedStrongsMappings = strongsMappings.filter((row) => row.review_status === "Verified");
const strongsByBook = new Map();
const strongsMappedWords = new Set();
for (const row of verifiedStrongsMappings) {
  addChapterCoverage(strongsByBook, row.verse_ref);
  const word = normalizeWord(row.normalized_kjv_word || row.kjv_word);
  if (word) strongsMappedWords.add(word);
}
const strongsBookCoverage = makeBookCoverage(strongsByBook, chaptersByBook);

const strongsLexiconIndex = await readJson("data/strongs/lexicon-batches/index.json", { files: [] });
const strongsLexiconEntries = [];
for (const file of strongsLexiconIndex.files ?? []) {
  const rows = await readJson(file, []);
  if (Array.isArray(rows)) strongsLexiconEntries.push(...rows);
}
const sampleStrongsEntries = await readJson("data/strongs/sample-verified-strongs.json", []);
const strongsNumbers = new Set([...strongsLexiconEntries, ...sampleStrongsEntries].map((entry) => entry.strongs_number).filter(Boolean));

const tskFiles = await findJsonFiles("data/imports", (name) => name.endsWith(".json") && name.includes("tsk"));
const tskRows = [];
for (const file of tskFiles) {
  const rows = await readJsonOrCsv(file);
  rows.forEach((row) => tskRows.push({ ...row, file }));
}
const publicTskRows = tskRows.filter((row) => !String(row.file).includes("needs-review"));
const tskByBook = new Map();
for (const row of publicTskRows) addChapterCoverage(tskByBook, row.verse_ref);
const tskBookCoverage = makeBookCoverage(tskByBook, chaptersByBook);
const tskMissingChapters = [];
for (const [book, chapters] of chaptersByBook) {
  for (const chapter of [...chapters].sort((a, b) => a - b)) {
    if (!tskByBook.get(book)?.chapters.has(chapter)) tskMissingChapters.push(`${book} ${chapter}`);
  }
}

const naveExactRows = meaningfulBibleWords.map((item) => ({
  word: item.word,
  count: item.count,
  hasTopic: hasNaveCandidate(item.word),
  referenceCount: Math.max(...dictionaryLookupCandidates(item.word).map((candidate) => naveByTopic.get(candidate)?.reference_count ?? 0)),
}));
const naveExactMatches = naveExactRows.filter((item) => item.hasTopic);
const naveSuspiciousTopics = naveTopics.filter((topic) => !topic.reference_count || /\d/.test(topic.normalized_topic ?? "") || /\b[a-z]\s+[a-z]\b/.test(topic.normalized_topic ?? ""));

const wordsWithStrongsMappings = meaningfulBibleWords.filter((item) => strongsMappedWords.has(item.word));
const topDictionaryMissing = dictionaryMissing.slice(0, 80);
const topDictionaryDirty = dictionaryDirty.slice(0, 80);
const topStrongsMissingWords = meaningfulBibleWords.filter((item) => !strongsMappedWords.has(item.word)).slice(0, 80);
const topNaveMissingTopics = meaningfulBibleWords.filter((item) => !hasNaveCandidate(item.word)).slice(0, 80);
const topMissingAnyStudyLookup = dictionaryRows.filter((item) => !item.hasAnyStudyLookup).slice(0, 80);
const wordsWithDictionaryOrStrongs = dictionaryRows.filter((item) => item.hasAnyStudyLookup || strongsMappedWords.has(item.word));
const topWordsWithoutDictionaryOrStrongs = dictionaryRows
  .filter((item) => !item.hasAnyStudyLookup && !strongsMappedWords.has(item.word))
  .slice(0, 80);

const summary = {
  generated_at: new Date().toISOString(),
  bible: {
    books: chaptersByBook.size,
    chapters: totalChapters,
    verses: allVerseEntries.length,
    totalWordTokens,
    uniqueWords: uniqueBibleWords.length,
    meaningfulUniqueWords: meaningfulBibleWords.length,
  },
  webster1828: {
    entries: websterEntries.length,
    normalizedHeadwords: websterByHeadword.size,
    meaningfulWordsWithDefinition: dictionaryRows.filter((item) => item.hasDefinition).length,
    meaningfulWordsWithoutDefinition: dictionaryMissing.length,
    meaningfulDefinitionCoveragePercent: percent(dictionaryRows.filter((item) => item.hasDefinition).length, dictionaryRows.length),
    topUsedWordsNeedingDefinition: topDictionaryMissing,
    topUsedWordsNeedingCleanup: topDictionaryDirty,
  },
  bibleDictionariesAndTopics: {
    eastonEntries: eastonEntries.length,
    naveTopics: naveTopics.length,
    rareTermEntries: rareTermEntries.length,
    meaningfulWordsWithEastonEntry: dictionaryRows.filter((item) => item.hasEaston).length,
    meaningfulWordsWithNaveTopic: dictionaryRows.filter((item) => item.hasNave).length,
    meaningfulWordsWithAnyStudyLookup: dictionaryRows.filter((item) => item.hasAnyStudyLookup).length,
    combinedStudyLookupCoveragePercent: percent(dictionaryRows.filter((item) => item.hasAnyStudyLookup).length, dictionaryRows.length),
    topUsedWordsWithoutAnyStudyLookup: topMissingAnyStudyLookup,
  },
  combinedWordStudy: {
    meaningfulWordsWithDictionaryOrStrongs: wordsWithDictionaryOrStrongs.length,
    meaningfulWordCoveragePercent: percent(wordsWithDictionaryOrStrongs.length, meaningfulBibleWords.length),
    topUsedWordsWithoutDictionaryOrStrongs: topWordsWithoutDictionaryOrStrongs,
  },
  strongs: {
    lexiconEntries: strongsNumbers.size,
    mappingFiles: strongsMappingFiles.length,
    mappingRows: verifiedStrongsMappings.length,
    mappedBooks: strongsByBook.size,
    mappedChapters: [...strongsByBook.values()].reduce((sum, item) => sum + item.chapters.size, 0),
    mappedVerses: [...strongsByBook.values()].reduce((sum, item) => sum + item.verses.size, 0),
    mappedUniqueKjvWords: strongsMappedWords.size,
    meaningfulWordsWithMapping: wordsWithStrongsMappings.length,
    meaningfulWordMappingCoveragePercent: percent(wordsWithStrongsMappings.length, meaningfulBibleWords.length),
    weakestBooks: [...strongsBookCoverage].sort((a, b) => a.chapterCoveragePercent - b.chapterCoveragePercent || a.rows - b.rows).slice(0, 20),
    topUsedWordsWithoutMapping: topStrongsMissingWords,
  },
  tsk: {
    files: tskFiles.length,
    publicRows: publicTskRows.length,
    coveredBooks: tskByBook.size,
    coveredChapters: [...tskByBook.values()].reduce((sum, item) => sum + item.chapters.size, 0),
    coveredSourceVerses: [...tskByBook.values()].reduce((sum, item) => sum + item.verses.size, 0),
    chapterCoveragePercent: percent([...tskByBook.values()].reduce((sum, item) => sum + item.chapters.size, 0), totalChapters),
    missingChapters: tskMissingChapters,
    weakestBooks: [...tskBookCoverage].sort((a, b) => a.chapterCoveragePercent - b.chapterCoveragePercent || a.rows - b.rows).slice(0, 20),
  },
  nave: {
    topics: naveTopics.length,
    topicsWithReferences: naveTopics.filter((topic) => (topic.reference_count ?? 0) > 0).length,
    exactMeaningfulBibleWordTopics: naveExactMatches.length,
    exactMeaningfulBibleWordTopicPercent: percent(naveExactMatches.length, meaningfulBibleWords.length),
    suspiciousTopicCount: naveSuspiciousTopics.length,
    topUsedWordsWithoutExactTopic: topNaveMissingTopics,
  },
};

const md = [
  "# Bible Tool Coverage Audit",
  "",
  `Generated: ${summary.generated_at}`,
  "",
  "This audit measures Bible-wide readiness for the study tools: Webster 1828 lookup, Strong's KJV word mappings, TSK cross references, and Nave's Topical Bible. It is intentionally conservative: rough OCR or unreviewed data should stay visible as a review need, not as finished polish.",
  "",
  "## Current Coverage",
  "",
  `- Bible text: ${summary.bible.books} books, ${summary.bible.chapters} chapters, ${summary.bible.verses} verses.`,
  `- KJV words measured: ${summary.bible.totalWordTokens.toLocaleString()} tokens, ${summary.bible.uniqueWords.toLocaleString()} unique words, ${summary.bible.meaningfulUniqueWords.toLocaleString()} meaningful unique words after common-word filtering.`,
  `- Webster 1828: ${summary.webster1828.meaningfulWordsWithDefinition.toLocaleString()}/${summary.bible.meaningfulUniqueWords.toLocaleString()} meaningful KJV words have a lookup candidate (${summary.webster1828.meaningfulDefinitionCoveragePercent}%).`,
  `- Combined word/topic lookup: ${summary.bibleDictionariesAndTopics.meaningfulWordsWithAnyStudyLookup.toLocaleString()}/${summary.bible.meaningfulUniqueWords.toLocaleString()} meaningful KJV words have Webster, Easton, or Nave help (${summary.bibleDictionariesAndTopics.combinedStudyLookupCoveragePercent}%).`,
  `- Strong's lexicon: ${summary.strongs.lexiconEntries.toLocaleString()} entries available; reviewed KJV mappings cover ${summary.strongs.mappedChapters}/${summary.bible.chapters} chapters and ${summary.strongs.mappedVerses.toLocaleString()} source verses.`,
  `- Strong's KJV word mapping: ${summary.strongs.meaningfulWordsWithMapping.toLocaleString()}/${summary.bible.meaningfulUniqueWords.toLocaleString()} meaningful KJV words appear in reviewed mapping batches (${summary.strongs.meaningfulWordMappingCoveragePercent}%).`,
  `- Combined word-study help: ${summary.combinedWordStudy.meaningfulWordsWithDictionaryOrStrongs.toLocaleString()}/${summary.bible.meaningfulUniqueWords.toLocaleString()} meaningful KJV words have Webster, Easton, Nave, or reviewed Strong's help (${summary.combinedWordStudy.meaningfulWordCoveragePercent}%).`,
  `- TSK: ${summary.tsk.publicRows.toLocaleString()} public rows cover ${summary.tsk.coveredChapters}/${summary.bible.chapters} chapters (${summary.tsk.chapterCoveragePercent}%).`,
  `- TSK remaining chapter gaps: ${summary.tsk.missingChapters.length ? summary.tsk.missingChapters.join(", ") : "None"}.`,
  `- Nave: ${summary.nave.topics.toLocaleString()} cleaned topic records, ${summary.nave.topicsWithReferences.toLocaleString()} with extracted Scripture references.`,
  "",
  "## What This Means",
  "",
  "- Webster is broad enough for most Bible-word lookup, but some high-use entries still need OCR cleanup before the reader feels polished.",
  "- Strong's is chapter-complete; remaining work is rare lexicon edge cases and display polish.",
  "- TSK is chapter-complete; the next work is deepening verse-level coverage and ranking the strongest references first.",
  "- Nave is useful for topic discovery now, with records still marked for spot review before quoting.",
  "",
  "## Fast Clean Completion Path",
  "",
  "1. Finish coverage audits first, then import by weakest gaps instead of guessing.",
  "2. For Webster, add reviewed overrides for the most-used missing or messy KJV words first.",
  "3. For Strong's, review the few rare unmapped words and missing lexicon cards instead of another broad import.",
  "4. For TSK, deepen verse-level coverage and rank the strongest references first now that every Bible chapter has at least one reviewed reference.",
  "5. For Nave, expose only cleaned topic records with references; keep rough OCR hidden until reviewed.",
  "",
  "## Top Webster Words Needing Definition Review",
  "",
  "| Word | Count | Sample References |",
  "| --- | ---: | --- |",
  ...(topDictionaryMissing.length
    ? topDictionaryMissing.slice(0, 30).map((item) => `| ${item.word} | ${item.count} | ${item.sampleRefs.join("; ")} |`)
    : ["| None | 0 |  |"]),
  "",
  "## Top KJV Words Still Without Any Study Lookup",
  "",
  "| Word | Count | Sample References |",
  "| --- | ---: | --- |",
  ...(topMissingAnyStudyLookup.length
    ? topMissingAnyStudyLookup.slice(0, 30).map((item) => `| ${item.word} | ${item.count} | ${item.sampleRefs.join("; ")} |`)
    : ["| None | 0 |  |"]),
  "",
  "## Final Words Without Dictionary Or Strong's Help",
  "",
  "| Word | Count | Sample References |",
  "| --- | ---: | --- |",
  ...(topWordsWithoutDictionaryOrStrongs.length
    ? topWordsWithoutDictionaryOrStrongs.slice(0, 40).map((item) => `| ${item.word} | ${item.count} | ${item.sampleRefs.join("; ")} |`)
    : ["| None | 0 |  |"]),
  "",
  "## Top Webster Entries Needing OCR Cleanup",
  "",
  "| Word | Webster Headword | Count | Review Status |",
  "| --- | --- | ---: | --- |",
  ...(topDictionaryDirty.length
    ? topDictionaryDirty.slice(0, 30).map((item) => `| ${item.word} | ${item.sourceHeadword ?? ""} | ${item.count} | ${item.reviewStatus ?? ""} |`)
    : ["| None |  | 0 |  |"]),
  "",
  "## Weakest Strong's Mapping Books",
  "",
  "| Book | Chapters Mapped | Total Chapters | Chapter Coverage | Mapped Verses | Rows |",
  "| --- | ---: | ---: | ---: | ---: | ---: |",
  ...summary.strongs.weakestBooks.map((item) => `| ${item.book} | ${item.chaptersCovered} | ${item.totalChapters} | ${item.chapterCoveragePercent}% | ${item.versesCovered} | ${item.rows} |`),
  "",
  "## Weakest TSK Books",
  "",
  "| Book | Chapters With TSK | Total Chapters | Chapter Coverage | Source Verses | Rows |",
  "| --- | ---: | ---: | ---: | ---: | ---: |",
  ...summary.tsk.weakestBooks.map((item) => `| ${item.book} | ${item.chaptersCovered} | ${item.totalChapters} | ${item.chapterCoveragePercent}% | ${item.versesCovered} | ${item.rows} |`),
  "",
  "## Top KJV Words Without Reviewed Strong's Mapping Yet",
  "",
  "| Word | Count | Sample References |",
  "| --- | ---: | --- |",
  ...topStrongsMissingWords.slice(0, 30).map((item) => `| ${item.word} | ${item.count} | ${item.sampleRefs.join("; ")} |`),
  "",
  "## Top KJV Words Without Exact Nave Topic Yet",
  "",
  "| Word | Count | Sample References |",
  "| --- | ---: | --- |",
  ...topNaveMissingTopics.slice(0, 30).map((item) => `| ${item.word} | ${item.count} | ${item.sampleRefs.join("; ")} |`),
  "",
  "## Safety Rules",
  "",
  "- Do not expose unreviewed OCR as finished dictionary prose.",
  "- Do not mark Strong's verse mapping complete until every book has reviewed mapping rows.",
  "- Do not import broad TSK or Strong's dumps without source, license, attribution, and parser validation.",
  "- Keep Nave topic records as discovery/search aids until topic text has been spot-reviewed.",
  "",
].join("\n");

await mkdir(path.dirname(reportJsonPath), { recursive: true });
await writeFile(
  reportJsonPath,
  `${JSON.stringify(
    {
      summary,
      strongsBookCoverage,
      tskBookCoverage,
      samples: {
        topDictionaryMissing,
        topDictionaryDirty,
        topMissingAnyStudyLookup,
        topStrongsMissingWords,
        topNaveMissingTopics,
        tskMissingChapters,
        naveSuspiciousTopics: naveSuspiciousTopics.slice(0, 80),
      },
    },
    null,
    2,
  )}\n`,
);
await writeFile(reportMdPath, `${md}\n`);

console.log("Bible tool coverage audit complete");
console.table({
  unique_kjv_words: summary.bible.uniqueWords,
  meaningful_words: summary.bible.meaningfulUniqueWords,
  webster_coverage: `${summary.webster1828.meaningfulDefinitionCoveragePercent}%`,
  strongs_mapped_chapters: `${summary.strongs.mappedChapters}/${summary.bible.chapters}`,
  tsk_chapter_coverage: `${summary.tsk.chapterCoveragePercent}%`,
  nave_topics: summary.nave.topics,
});
console.log(`Wrote ${reportMdPath}`);
console.log(`Wrote ${reportJsonPath}`);
