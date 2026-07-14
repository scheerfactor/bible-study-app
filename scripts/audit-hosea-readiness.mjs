#!/usr/bin/env node
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import verses1769 from "es-kjv/json/verses-1769.js";
import { readJsonOrCsv } from "./import-utils.mjs";

const reportPath = "data/reports/hosea-readiness-audit.json";
const markdownPath = "HOSEA_READINESS_AUDIT.md";
const expectedChapters = Array.from({ length: 14 }, (_, index) => index + 1);
const expectedVerseCount = 197;

const stopWords = new Set(
  "a an and are as at be but by for from had has have he her him his how i in is it me my not of on or our shall she that the their them they thou thy to unto up was we were with ye you your".split(" "),
);

const aliases = {
  hath: "have", hast: "have", hadst: "have", saith: "say", saidst: "say", saying: "say",
  shalt: "shall", spake: "speak", speaketh: "speak", speakest: "speak", spoken: "speak",
  branches: "branch", brethren: "brother", calves: "calf", carried: "carry", committed: "commit", committing: "commit", committest: "commit", craftsmen: "craftsman", dealt: "deal",
  compasseth: "compass", did: "do", didst: "do", died: "die", doth: "do", drew: "draw", dwelt: "dwell",
  dwelleth: "dwell", fishes: "fish", forgat: "forget", fortresses: "fortress", goeth: "go", horsemen: "horseman", known: "know",
  mercies: "mercy", merciful: "mercy", oxen: "ox", prevailed: "prevail", rebelled: "rebel",
  recompence: "recompense", rebuker: "rebuke", saviour: "savior", shewed: "shew", sheweth: "shew", sinned: "sin", smitten: "smite",
  surely: "sure", sware: "swear", sworn: "swear", taken: "take", testifieth: "testify", thyself: "self", took: "take", transgressed: "transgress", transgressions: "transgression",
  wanderers: "wanderer", would: "will", wouldest: "will", yourselves: "self", begotten: "beget",
};

const dirtyPatterns = [
  /[�■]/,
  /\b(?:tlje|tlie|tliat|tliis|wliich|whicli|witli|aiid|iiot|iiito|Ood)\b/i,
  /\b(?:G od|L ord|J esus|C hrist)\b/,
  /[a-z]-\s+[a-z]/i,
];

function normalize(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z]/g, "");
}

function normalizeStrongNumber(value) {
  const match = String(value ?? "").match(/^([GH])0*(\d+)$/);
  return match ? `${match[1]}${Number(match[2])}` : String(value ?? "");
}

function percent(value, total) {
  return total ? Math.round((value / total) * 1000) / 10 : 0;
}

function lookupCandidates(value) {
  const word = normalize(value);
  if (!word) return [];
  const candidates = aliases[word] ? [aliases[word], word] : [word];
  for (const [pattern, replacement] of [[/eth$/, ""], [/est$/, ""], [/ies$/, "y"], [/ing$/, ""], [/ed$/, ""], [/([sxz]|ch|sh)es$/, "$1"], [/s$/, ""]]) {
    if (!pattern.test(word)) continue;
    const candidate = word.replace(pattern, replacement);
    if (candidate.length < 3) continue;
    candidates.push(candidate);
    if (/[^aeiou]$/.test(candidate)) candidates.push(`${candidate}e`);
  }
  return [...new Set(candidates)];
}

function parseReference(reference) {
  const match = String(reference ?? "").match(/^Hosea (\d+):(\d+)$/);
  return match ? { chapter: Number(match[1]), verse: Number(match[2]) } : null;
}

async function readJson(filePath, fallback = []) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function jsonFiles(directory, predicate = () => true) {
  const names = await readdir(directory);
  return names.filter((name) => name.endsWith(".json") && predicate(name)).map((name) => path.join(directory, name)).sort();
}

const hoseaVerses = Object.entries(verses1769).filter(([reference]) => reference.startsWith("Hosea "));
const chapters = new Set(hoseaVerses.map(([reference]) => parseReference(reference)?.chapter).filter(Boolean));
const wordStats = new Map();

for (const [reference, text] of hoseaVerses) {
  for (const rawWord of String(text).match(/[A-Za-z]+(?:-[A-Za-z]+)*/g) ?? []) {
    const word = normalize(rawWord);
    if (word.length < 3 || stopWords.has(word)) continue;
    const stat = wordStats.get(word) ?? { word, count: 0, sampleRefs: [] };
    stat.count += 1;
    if (stat.sampleRefs.length < 4) stat.sampleRefs.push(reference);
    wordStats.set(word, stat);
  }
}

const meaningfulWords = [...wordStats.values()].sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
const reviewedWebster = await readJson("data/generated/websters-1828-reviewed-overrides.json", []);
const baseWebster = await readJson("data/generated/websters-1828.entries.json", []);
const rareTermEntries = await readJson("data/generated/kjv-rare-term-reviewed-overrides.json", []);
const rareWebsterEntries = rareTermEntries.filter((entry) => /american dictionary|webster/i.test(entry.source_title ?? ""));
const websterByHeadword = new Map();
for (const entry of [...reviewedWebster, ...rareWebsterEntries, ...baseWebster]) {
  const key = normalize(entry.normalized_headword || entry.headword);
  if (key && !websterByHeadword.has(key)) websterByHeadword.set(key, entry);
}

const eastonEntries = await readJson("data/generated/eastons-bible-dictionary.entries.json", []);
const eastonHeadwords = new Set(eastonEntries.map((entry) => normalize(entry.normalized_headword || entry.headword)).filter(Boolean));
const naveTopics = await readJson("data/generated/naves-topical-bible.topics.json", []);
const naveHeadwords = new Set(naveTopics.map((entry) => normalize(entry.normalized_topic || entry.topic)).filter(Boolean));
const rareTermHeadwords = new Set(rareTermEntries.map((entry) => normalize(entry.normalized_headword || entry.headword)).filter(Boolean));

const dictionaryRows = meaningfulWords.map((stat) => {
  const candidates = lookupCandidates(stat.word);
  const entry = candidates.map((candidate) => websterByHeadword.get(candidate)).find(Boolean) ?? null;
  const hasBibleDictionaryHelp = candidates.some((candidate) => eastonHeadwords.has(candidate) || naveHeadwords.has(candidate) || rareTermHeadwords.has(candidate));
  const hasReviewedBibleDictionaryHelp = candidates.some((candidate) => eastonHeadwords.has(candidate) || rareTermHeadwords.has(candidate));
  const dirty = Boolean(entry && entry.review_status !== "reviewed_overlay" && dirtyPatterns.some((pattern) => pattern.test(entry.definition ?? "")));
  return { ...stat, hasWebster: Boolean(entry), reviewedOverlay: entry?.review_status === "reviewed_overlay", hasBibleDictionaryHelp, hasReviewedBibleDictionaryHelp, dirty, sourceHeadword: entry?.headword ?? null };
});

const strongsFiles = await jsonFiles("data/strongs/mapping-batches");
const strongsRows = [];
for (const file of strongsFiles) {
  for (const row of await readJson(file, [])) {
    if (row.review_status === "Verified" && parseReference(row.verse_ref)) strongsRows.push({ ...row, file });
  }
}
const strongsChapters = new Set(strongsRows.map((row) => parseReference(row.verse_ref)?.chapter).filter(Boolean));
const strongsVerses = new Set(strongsRows.map((row) => row.verse_ref));
const mappedStrongsNumbers = new Set(strongsRows.map((row) => normalizeStrongNumber(row.strongs_number)).filter(Boolean));

const lexiconIndex = await readJson("data/strongs/lexicon-batches/index.json", { files: [] });
const lexiconNumbers = new Set();
for (const file of lexiconIndex.files ?? []) {
  for (const entry of await readJson(file, [])) {
    if (entry.strongs_number) lexiconNumbers.add(normalizeStrongNumber(entry.strongs_number));
  }
}
for (const entry of await readJson("data/strongs/sample-verified-strongs.json", [])) {
  if (entry.strongs_number) lexiconNumbers.add(normalizeStrongNumber(entry.strongs_number));
}
const missingLexiconNumbers = [...mappedStrongsNumbers].filter((number) => !lexiconNumbers.has(number)).sort();

const tskFiles = await jsonFiles("data/imports", (name) => name.includes("tsk") && !name.includes("needs-review"));
const tskRows = [];
for (const file of tskFiles) {
  for (const row of await readJsonOrCsv(file)) if (parseReference(row.verse_ref)) tskRows.push({ ...row, file });
}
const tskChapters = new Set(tskRows.map((row) => parseReference(row.verse_ref)?.chapter).filter(Boolean));
const tskVerses = new Set(tskRows.map((row) => row.verse_ref));

const pageSource = await readFile("src/app/page.tsx", "utf8");
const immediateImportFiles = new Set(
  [...pageSource.matchAll(/import hosea\w+Commentary from "\.\.\/\.\.\/data\/imports\/([^"]+)";/g)].map((match) => match[1]),
);
const commentaryFiles = await jsonFiles("data/imports", (name) => name.includes("commentary"));
const commentarySets = [];
for (const file of commentaryFiles) {
  const rows = (await readJson(file, [])).filter((row) => row.book === "Hosea" && row.review_status === "Verified");
  if (!rows.length) continue;
  const coveredChapters = [...new Set(rows.map((row) => Number(row.chapter)))].sort((a, b) => a - b);
  commentarySets.push({
    file: path.basename(file),
    author: [...new Set(rows.map((row) => row.author))].join("; "),
    entries: rows.length,
    coveredChapters,
    fullBook: expectedChapters.every((chapter) => coveredChapters.includes(chapter)),
    immediate: immediateImportFiles.has(path.basename(file)),
  });
}

const fullBookCommentaries = commentarySets.filter((set) => set.fullBook);
const immediateFullBookCommentaries = fullBookCommentaries.filter((set) => set.immediate);
const assertions = {
  kjvChapters: chapters.size === 14,
  kjvVerses: hoseaVerses.length === expectedVerseCount,
  strongsEveryChapter: expectedChapters.every((chapter) => strongsChapters.has(chapter)),
  strongsLexiconCards: missingLexiconNumbers.length === 0,
  tskEveryChapter: expectedChapters.every((chapter) => tskChapters.has(chapter)),
  tenImmediateFullBookCommentaries: immediateFullBookCommentaries.length >= 10,
};

const report = {
  generated_at: new Date().toISOString(),
  status: Object.values(assertions).every(Boolean) ? "ready_with_documented_depth_gaps" : "needs_attention",
  assertions,
  kjv: { chapters: chapters.size, verses: hoseaVerses.length, meaningfulUniqueWords: meaningfulWords.length },
  webster1828: {
    wordsWithDefinition: dictionaryRows.filter((row) => row.hasWebster).length,
    coveragePercent: percent(dictionaryRows.filter((row) => row.hasWebster).length, dictionaryRows.length),
    reviewedOverlayWords: dictionaryRows.filter((row) => row.reviewedOverlay).length,
    wordsWithBibleDictionaryFallback: dictionaryRows.filter((row) => (!row.hasWebster || row.dirty) && row.hasBibleDictionaryHelp).length,
    unresolvedWords: dictionaryRows.filter((row) => !row.hasWebster && !row.hasBibleDictionaryHelp).slice(0, 60),
    dirtyBaseEntries: dictionaryRows.filter((row) => row.dirty && !row.hasReviewedBibleDictionaryHelp).slice(0, 60),
    contextualFallbackEntries: dictionaryRows.filter((row) => row.dirty && row.hasReviewedBibleDictionaryHelp).slice(0, 60),
  },
  strongs: { chapters: strongsChapters.size, verses: strongsVerses.size, rows: strongsRows.length, mappedNumbers: mappedStrongsNumbers.size, missingLexiconNumbers },
  tsk: { chapters: tskChapters.size, sourceVerses: tskVerses.size, rows: tskRows.length },
  commentary: { sets: commentarySets.length, fullBookSets: fullBookCommentaries.length, immediateFullBookSets: immediateFullBookCommentaries.length, immediate: immediateFullBookCommentaries },
};

const markdown = [
  "# Hosea Readiness Audit",
  "",
  `Generated: ${report.generated_at}`,
  "",
  `Status: **${report.status}**`,
  "",
  "## Verified Coverage",
  "",
  `- KJV: ${report.kjv.chapters}/14 chapters and ${report.kjv.verses}/${expectedVerseCount} verses.`,
  `- Webster 1828: ${report.webster1828.wordsWithDefinition}/${report.kjv.meaningfulUniqueWords} meaningful unique words have a lookup (${report.webster1828.coveragePercent}%).`,
  `- Supplemental fallback: ${report.webster1828.wordsWithBibleDictionaryFallback} additional Webster gaps have Easton, Nave, or reviewed KJV term help, chiefly names, places, and rare forms.`,
  `- Contextual fallback: ${report.webster1828.contextualFallbackEntries.length} ambiguous or dirty Webster matches have verified Easton or reviewed KJV-term help instead.`,
  `- Strong's: ${report.strongs.chapters}/14 chapters, ${report.strongs.verses}/${expectedVerseCount} verses, ${report.strongs.rows} reviewed word mappings, and ${report.strongs.missingLexiconNumbers.length} missing lexicon cards.`,
  `- TSK: ${report.tsk.chapters}/14 chapters, ${report.tsk.sourceVerses}/${expectedVerseCount} source verses, and ${report.tsk.rows} public cross-reference rows.`,
  `- Commentary: ${report.commentary.immediateFullBookSets} full-book sets load immediately in the app; ${report.commentary.fullBookSets} verified full-book sets exist locally.`,
  "",
  "## Immediate Full-Book Commentary",
  "",
  "| Author | Entries | Source file |",
  "| --- | ---: | --- |",
  ...report.commentary.immediate.map((set) => `| ${set.author} | ${set.entries} | ${set.file} |`),
  "",
  "## Remaining Webster Gaps",
  "",
  "These are retained as review work, not filled with invented definitions.",
  "",
  "| Word | Uses | Sample references |",
  "| --- | ---: | --- |",
  ...report.webster1828.unresolvedWords.slice(0, 30).map((row) => `| ${row.word} | ${row.count} | ${row.sampleRefs.join("; ")} |`),
  "",
  "## Remaining Depth Work",
  "",
  `- Strong's is chapter-complete, but ${expectedVerseCount - report.strongs.verses} verses currently have no reviewed mapped word row.`,
  `- TSK is chapter-complete, but ${expectedVerseCount - report.tsk.sourceVerses} verses currently have no public source-reference row.`,
  `- ${report.webster1828.dirtyBaseEntries.length} actionable Hosea lookup candidates remain without a cleaner Bible-dictionary fallback.`,
  "- Detailed original teaching notes currently concentrate on Hosea 4-9; all chapters still have KJV reading, Strong's where mapped, TSK where available, and full-book commentary comparison.",
  "",
].join("\n");

await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
await writeFile(markdownPath, `${markdown}\n`);

console.table({
  status: report.status,
  kjv_chapters: report.kjv.chapters,
  kjv_verses: report.kjv.verses,
  webster_percent: report.webster1828.coveragePercent,
  strongs_chapters: report.strongs.chapters,
  strongs_verses: report.strongs.verses,
  tsk_chapters: report.tsk.chapters,
  tsk_source_verses: report.tsk.sourceVerses,
  immediate_commentaries: report.commentary.immediateFullBookSets,
});

if (!Object.values(assertions).every(Boolean)) process.exitCode = 1;
