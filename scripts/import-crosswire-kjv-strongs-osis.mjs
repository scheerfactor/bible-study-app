#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import verses1769 from "es-kjv/json/verses-1769.js";

const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => {
      const [key, ...valueParts] = arg.slice(2).split("=");
      return [key, valueParts.join("=") || "true"];
    }),
);

const inputPath = args.get("input");
const refsArg = args.get("refs") ?? "John 3";
const outputPath = args.get("output") ?? "data/strongs/mapping-staging/kjv-strongs-crosswire.staging-needs-review.json";
const reviewStatus = args.get("review-status") ?? "Needs Review";

const sourceMetadata = {
  source_id: "strongs-crosswire-kjv",
  source_title: "CrossWire KJV 1769 with Strong's Numbers and Morphology",
  source_url: "https://crosswire.org/sword/modules/ModInfo.jsp?modName=KJV",
  rights_status: "CrossWire general public license for any purpose; distribution license GPL.",
  rights_basis:
    "CrossWire states that copyright in its maintained KJV effort is held by CrossWire Bible Society and grants a general public license to use the text for any purpose. The module is distributed under GPL. Preserve CrossWire attribution and source links; Old Testament Strong's data derives from The Bible Foundation.",
};

const osisBookToKjv = new Map([
  ["Gen", "Genesis"],
  ["Exod", "Exodus"],
  ["Lev", "Leviticus"],
  ["Num", "Numbers"],
  ["Deut", "Deuteronomy"],
  ["Josh", "Joshua"],
  ["Judg", "Judges"],
  ["Ruth", "Ruth"],
  ["1Sam", "1 Samuel"],
  ["2Sam", "2 Samuel"],
  ["1Kgs", "1 Kings"],
  ["2Kgs", "2 Kings"],
  ["1Chr", "1 Chronicles"],
  ["2Chr", "2 Chronicles"],
  ["Ezra", "Ezra"],
  ["Neh", "Nehemiah"],
  ["Esth", "Esther"],
  ["Job", "Job"],
  ["Ps", "Psalms"],
  ["Prov", "Proverbs"],
  ["Eccl", "Ecclesiastes"],
  ["Song", "Solomon's Song"],
  ["Isa", "Isaiah"],
  ["Jer", "Jeremiah"],
  ["Lam", "Lamentations"],
  ["Ezek", "Ezekiel"],
  ["Dan", "Daniel"],
  ["Hos", "Hosea"],
  ["Joel", "Joel"],
  ["Amos", "Amos"],
  ["Obad", "Obadiah"],
  ["Jonah", "Jonah"],
  ["Mic", "Micah"],
  ["Nah", "Nahum"],
  ["Hab", "Habakkuk"],
  ["Zeph", "Zephaniah"],
  ["Hag", "Haggai"],
  ["Zech", "Zechariah"],
  ["Mal", "Malachi"],
  ["Matt", "Matthew"],
  ["Mark", "Mark"],
  ["Luke", "Luke"],
  ["John", "John"],
  ["Acts", "Acts"],
  ["Rom", "Romans"],
  ["1Cor", "1 Corinthians"],
  ["2Cor", "2 Corinthians"],
  ["Gal", "Galatians"],
  ["Eph", "Ephesians"],
  ["Phil", "Philippians"],
  ["Col", "Colossians"],
  ["1Thess", "1 Thessalonians"],
  ["2Thess", "2 Thessalonians"],
  ["1Tim", "1 Timothy"],
  ["2Tim", "2 Timothy"],
  ["Titus", "Titus"],
  ["Phlm", "Philemon"],
  ["Heb", "Hebrews"],
  ["Jas", "James"],
  ["1Pet", "1 Peter"],
  ["2Pet", "2 Peter"],
  ["1John", "1 John"],
  ["2John", "2 John"],
  ["3John", "3 John"],
  ["Jude", "Jude"],
  ["Rev", "Revelation"],
]);

function normalizeWord(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const kjvSpellingBridge = {
  ankles: "ancles",
  achsah: "achsa",
  floats: "flotes",
  geshan: "gesham",
  hapharaim: "haphraim",
  shemida: "shemidah",
  soap: "sope",
};

function verseTokens(verseText) {
  return String(verseText ?? "").match(/[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?/g) ?? [];
}

function stripTags(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function stripNonVerseMarkup(value) {
  return String(value ?? "")
    .replace(/<title\b[\s\S]*?<\/title>/g, " ")
    .replace(/<milestone\b[^>]*\/>/g, " ");
}

function parseRefs(value) {
  return String(value)
    .split(",")
    .map((ref) => ref.trim())
    .filter(Boolean);
}

function osisIdToVerseRef(osisId) {
  const parts = String(osisId).split(".");
  if (parts.length !== 3) return null;
  const [osisBook, chapter, verse] = parts;
  const book = osisBookToKjv.get(osisBook);
  if (!book) return null;
  return `${book} ${Number(chapter)}:${Number(verse)}`;
}

function refMatches(verseRef, targets) {
  return targets.some((target) => verseRef === target || verseRef.startsWith(`${target}:`) || verseRef.startsWith(`${target} `));
}

function strongNumbersFromLemma(lemma) {
  const matches = String(lemma ?? "").match(/strong:([GH][0-9]+)/g) ?? [];
  return matches.map((match) => {
    const [, prefix, digits] = match.match(/strong:([GH])([0-9]+)/) ?? [];
    if (!prefix || !digits) return match.replace("strong:", "");
    return `${prefix}${Number(digits)}`;
  });
}

function rowsFromWordTag({ verseRef, tokenIndex, tag, body }) {
  const lemma = tag.match(/\slemma="([^"]+)"/)?.[1] ?? "";
  const strongs = strongNumbersFromLemma(lemma);
  if (!strongs.length) return [];

  const text = stripTags(body);
  const tokens = verseTokens(text);
  if (!tokens.length) return [];

  return tokens.map((token, phraseIndex) => {
    const strongsNumber =
      tokens.length === 1
        ? strongs[strongs.length - 1]
        : strongs.length === tokens.length
          ? strongs[phraseIndex]
          : strongs.length === 1
            ? strongs[0]
            : strongs[Math.min(phraseIndex, strongs.length - 1)];

    return {
      verse_ref: verseRef,
      token_index: tokenIndex + phraseIndex,
      kjv_word: token,
      normalized_kjv_word: normalizeWord(token),
      strongs_number: strongsNumber,
      ...sourceMetadata,
      review_status: reviewStatus,
    };
  });
}

function note(row, message) {
  row.notes = row.notes ? `${row.notes} ${message}` : message;
}

function collapseSourcePhraseIfNeeded(wordRows, tokenIndex, kjvTokens) {
  if (wordRows.length < 2) return wordRows;

  const expectedToken = kjvTokens[tokenIndex - 1];
  const combinedSource = wordRows.map((row) => row.kjv_word).join("");
  if (!expectedToken || normalizeWord(expectedToken) !== normalizeWord(combinedSource)) return wordRows;

  const [firstRow] = wordRows;
  const collapsedRow = {
    ...firstRow,
    token_index: tokenIndex,
    kjv_word: expectedToken,
    normalized_kjv_word: normalizeWord(expectedToken),
  };
  note(collapsedRow, `KJV spelling normalized to app text. Source phrase: ${wordRows.map((row) => row.kjv_word).join("-")}.`);
  return [collapsedRow];
}

function collapseCurrentAndNextIfNeeded(row, nextRow, tokenIndex, kjvTokens) {
  if (!nextRow) return { row, consumed: 1 };

  const expectedToken = kjvTokens[tokenIndex - 1];
  const combinedSource = `${row.kjv_word}${nextRow.kjv_word}`;
  if (!expectedToken || normalizeWord(expectedToken) !== normalizeWord(combinedSource)) return { row, consumed: 1 };

  const collapsedRow = {
    ...row,
    token_index: tokenIndex,
    kjv_word: expectedToken,
    normalized_kjv_word: normalizeWord(expectedToken),
  };
  note(collapsedRow, `KJV spelling normalized to app text. Source phrase: ${row.kjv_word}-${nextRow.kjv_word}.`);
  return { row: collapsedRow, consumed: 2 };
}

function expandSourceWordIfNeeded(row, tokenIndex, kjvTokens) {
  const expectedToken = kjvTokens[tokenIndex - 1];
  const nextExpectedToken = kjvTokens[tokenIndex];
  if (!expectedToken || !nextExpectedToken) return [row];
  if (matchesExpectedToken(row, expectedToken)) return [row];
  if (normalizeWord(`${expectedToken}${nextExpectedToken}`) !== row.normalized_kjv_word) return [row];

  const firstRow = {
    ...row,
    token_index: tokenIndex,
    kjv_word: expectedToken,
    normalized_kjv_word: normalizeWord(expectedToken),
  };
  const secondRow = {
    ...row,
    token_index: tokenIndex + 1,
    kjv_word: nextExpectedToken,
    normalized_kjv_word: normalizeWord(nextExpectedToken),
  };
  note(firstRow, `KJV spelling split to app text. Source token: ${row.kjv_word}.`);
  note(secondRow, `KJV spelling split to app text. Source token: ${row.kjv_word}.`);
  return [firstRow, secondRow];
}

function matchesExpectedToken(row, expectedToken) {
  if (!expectedToken) return false;
  if (normalizeWord(expectedToken) === row.normalized_kjv_word) return true;

  const sourceWord = normalizeWord(row.kjv_word);
  const bridgedWord = kjvSpellingBridge[sourceWord];
  return Boolean(bridgedWord && bridgedWord === normalizeWord(expectedToken));
}

function alignTokenIndex(row, kjvTokens) {
  let expectedToken = kjvTokens[row.token_index - 1];
  if (matchesExpectedToken(row, expectedToken)) return expectedToken;

  for (let offset = 1; offset <= 8; offset += 1) {
    const candidateToken = kjvTokens[row.token_index - 1 + offset];
    if (matchesExpectedToken(row, candidateToken)) {
      row.token_index += offset;
      note(row, `Token index advanced ${offset} to follow app KJV wording.`);
      return candidateToken;
    }
  }

  return expectedToken;
}

function extractRows(xml, targetRefs) {
  const rows = [];
  const versePattern = /<verse\s+osisID="([^"]+)"\s+sID="[^"]+"\s*\/>([\s\S]*?)<verse\s+eID="\1"\s*\/>/g;
  let verseMatch;

  while ((verseMatch = versePattern.exec(xml))) {
    const verseRef = osisIdToVerseRef(verseMatch[1]);
    if (!verseRef || !refMatches(verseRef, targetRefs)) continue;

    const kjvTokens = verseTokens(verses1769[verseRef] ?? "");
    if (!kjvTokens.length) continue;

    const verseBody = stripNonVerseMarkup(verseMatch[2]).replace(/<w\b[^>]*\/>/g, "");
    const wordPattern = /<w\b([^>]*)>([\s\S]*?)<\/w>/g;
    let wordMatch;
    let tokenIndex = 1;
    let cursor = 0;

    while ((wordMatch = wordPattern.exec(verseBody))) {
      const beforeTag = verseBody.slice(cursor, wordMatch.index);
      tokenIndex += verseTokens(stripTags(beforeTag)).length;

      const wordRows = collapseSourcePhraseIfNeeded(
        rowsFromWordTag({
          verseRef,
          tokenIndex,
          tag: wordMatch[1],
          body: wordMatch[2],
        }),
        tokenIndex,
        kjvTokens,
      );

      let nextTokenIndex = tokenIndex;
      for (let rowIndex = 0; rowIndex < wordRows.length; rowIndex += 1) {
        const collapsed = collapseCurrentAndNextIfNeeded(wordRows[rowIndex], wordRows[rowIndex + 1], nextTokenIndex, kjvTokens);
        const row = collapsed.row;
        rowIndex += collapsed.consumed - 1;
        row.token_index = nextTokenIndex;

        const expandedRows = expandSourceWordIfNeeded(row, nextTokenIndex, kjvTokens);
        for (const expandedRow of expandedRows) {
          const expectedToken = alignTokenIndex(expandedRow, kjvTokens);
          if (expectedToken && normalizeWord(expectedToken) === expandedRow.normalized_kjv_word && expectedToken !== expandedRow.kjv_word) {
            note(expandedRow, `KJV spelling normalized to app text. Source token: ${expandedRow.kjv_word}.`);
            expandedRow.kjv_word = expectedToken;
            expandedRow.normalized_kjv_word = normalizeWord(expectedToken);
          } else if (!expectedToken || normalizeWord(expectedToken) !== expandedRow.normalized_kjv_word) {
            const sourceWord = normalizeWord(expandedRow.kjv_word);
            const bridgedWord = kjvSpellingBridge[sourceWord];
            if (expectedToken && bridgedWord && bridgedWord === normalizeWord(expectedToken)) {
              note(expandedRow, `KJV spelling normalized to app text. Source token: ${expandedRow.kjv_word}.`);
              expandedRow.kjv_word = expectedToken;
              expandedRow.normalized_kjv_word = normalizeWord(expectedToken);
            } else {
              expandedRow.review_status = "Needs Manual Alignment";
              note(expandedRow, `Token alignment needs review. Expected ${expectedToken ?? "no token"} at KJV token ${expandedRow.token_index}.`);
            }
          }
          rows.push(expandedRow);
          nextTokenIndex = expandedRow.token_index + 1;
        }
      }

      tokenIndex = nextTokenIndex;
      cursor = wordPattern.lastIndex;
    }
  }

  return rows;
}

if (!inputPath) {
  console.error("Missing --input=/path/to/kjv.xml");
  process.exit(1);
}

const resolvedInput = path.resolve(process.cwd(), inputPath);
const resolvedOutput = path.resolve(process.cwd(), outputPath);
const targetRefs = parseRefs(refsArg);
const xml = await fs.readFile(resolvedInput, "utf8");
const rows = extractRows(xml, targetRefs);

await fs.mkdir(path.dirname(resolvedOutput), { recursive: true });
await fs.writeFile(resolvedOutput, `${JSON.stringify(rows, null, 2)}\n`);

console.log("CrossWire KJV Strong's OSIS staging import complete");
console.table({
  input: path.relative(process.cwd(), resolvedInput),
  output: path.relative(process.cwd(), resolvedOutput),
  refs: targetRefs.join(", "),
  rows: rows.length,
  reviewStatus,
  publicImport: "No - staging only",
});
