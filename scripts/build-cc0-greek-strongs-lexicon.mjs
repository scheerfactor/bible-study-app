import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const root = process.cwd();
const args = new Map(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => {
      const [key, ...valueParts] = arg.slice(2).split("=");
      return [key, valueParts.join("=") || "true"];
    }),
);

const sourceUrl = "https://raw.githubusercontent.com/morphgnt/strongs-dictionary-xml/master/strongsgreek.xml";
const sourcePath = path.resolve(root, args.get("source") ?? "data/strongs/source/morphgnt-strongsgreek/strongsgreek.xml");
const outputPath = path.resolve(
  root,
  args.get("output") ?? "data/strongs/lexicon-batches/strongs-cc0-greek-complete.json",
);
const batchIndexPath = path.resolve(root, "data/strongs/lexicon-batches/index.json");
const baseFile = path.resolve(root, "data/strongs/sample-verified-strongs.json");

function decodeXmlEntities(value) {
  return String(value ?? "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function stripTags(value) {
  return decodeXmlEntities(String(value ?? "").replace(/<[^>]+>/g, " "));
}

function cleanText(value) {
  return stripTags(value)
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function parseAttrs(tag) {
  const attrs = {};
  for (const match of tag.matchAll(/([A-Za-z_:-]+)="([^"]*)"/g)) {
    attrs[match[1]] = decodeXmlEntities(match[2]);
  }
  return attrs;
}

function normalizeStrongNumber(value) {
  return `G${Number(String(value).replace(/\D/g, ""))}`;
}

function parseEnglishWords(kjvDefinition) {
  return [
    ...new Set(
      cleanText(kjvDefinition)
        .replace(/\bX\b/g, " ")
        .replace(/[()+?]/g, " ")
        .split(/[,;]+|\s+or\s+|\s+and\s+/i)
        .map((word) => word.replace(/[^A-Za-z0-9'\-\s]/g, " ").replace(/\s+/g, " ").trim().toLowerCase())
        .filter((word) => word && word.length <= 40)
        .filter((word) => !["a", "an", "the", "to", "of", "in", "for", "with", "by"].includes(word)),
    ),
  ].slice(0, 16);
}

function parseRelatedNumbers(body) {
  const related = new Set();
  for (const match of body.matchAll(/<strongsref\b[^>]*\blanguage="GREEK"[^>]*\bstrongs="([^"]+)"/gi)) {
    related.add(normalizeStrongNumber(match[1]));
  }
  return [...related].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function elementText(body, tagName) {
  const match = body.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)</${tagName}>`, "i"));
  return match ? cleanText(match[1]) : "";
}

async function readJsonIfExists(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadSourceXml() {
  if (await fileExists(sourcePath)) return fs.readFile(sourcePath, "utf8");
  const cachePath = path.join(os.tmpdir(), "fbbs-strongsgreek.xml");
  if (await fileExists(cachePath)) return fs.readFile(cachePath, "utf8");

  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Could not download ${sourceUrl}: ${response.status} ${response.statusText}`);
  }
  const xml = await response.text();
  await fs.writeFile(cachePath, xml);
  return xml;
}

async function existingStrongNumbers() {
  const numbers = new Set();
  const baseEntries = await readJsonIfExists(baseFile, []);
  for (const entry of baseEntries) {
    if (entry?.strongs_number) numbers.add(entry.strongs_number);
  }

  const batchIndex = await readJsonIfExists(batchIndexPath, { files: [] });
  for (const file of batchIndex.files ?? []) {
    const resolvedFile = path.resolve(root, file);
    if (resolvedFile === outputPath) continue;
    const entries = await readJsonIfExists(resolvedFile, []);
    for (const entry of entries) {
      if (entry?.strongs_number) numbers.add(entry.strongs_number);
    }
  }
  return numbers;
}

function parseEntry(strongsNumber, body) {
  const greekTag = body.match(/<greek\b[^>]*>/i)?.[0] ?? "";
  const greekAttrs = parseAttrs(greekTag);
  const pronunciationTag = body.match(/<pronunciation\b[^>]*>/i)?.[0] ?? "";
  const pronunciationAttrs = parseAttrs(pronunciationTag);
  let definition = elementText(body, "strongs_def");
  const derivation = elementText(body, "strongs_derivation");
  const kjvDefinition = elementText(body, "kjv_def");
  const englishWords = parseEnglishWords(kjvDefinition);
  if (!definition && derivation) definition = derivation;

  if (!definition || !englishWords.length) return null;

  return {
    strongs_number: strongsNumber,
    language: "Greek",
    original_word: greekAttrs.unicode || greekAttrs.BETA || strongsNumber,
    transliteration: greekAttrs.translit || undefined,
    pronunciation: pronunciationAttrs.strongs || undefined,
    english_words: englishWords,
    related_numbers: parseRelatedNumbers(body),
    plain_definition: `Strong's definition: ${[derivation, definition].filter(Boolean).join(" ")}. KJV renderings include: ${kjvDefinition}.`,
    source_title: "Strong's Greek Dictionary in XML with real Greek",
    source_url: "https://github.com/morphgnt/strongs-dictionary-xml",
    rights_status:
      "The morphgnt Strong's Greek Dictionary XML README states the project is released under the Creative Commons CC0 waiver; entries derive from James Strong's 1890 public-domain dictionary.",
    review_status: "Verified",
  };
}

async function main() {
  const xml = await loadSourceXml();
  const existing = await existingStrongNumbers();
  const entries = [];

  for (const match of xml.matchAll(/<entry\b([^>]*)>([\s\S]*?)<\/entry>/gi)) {
    const attrs = parseAttrs(match[1]);
    const strongsNumber = normalizeStrongNumber(attrs.strongs);
    if (existing.has(strongsNumber)) continue;
    const parsed = parseEntry(strongsNumber, match[2]);
    if (!parsed) continue;
    entries.push(parsed);
    existing.add(strongsNumber);
  }

  entries.sort((a, b) => a.strongs_number.localeCompare(b.strongs_number, undefined, { numeric: true }));
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(`${outputPath}.tmp`, `${JSON.stringify(entries, null, 2)}\n`);
  await fs.rename(`${outputPath}.tmp`, outputPath);
  console.log(`Wrote ${entries.length} CC0 Greek Strong's entries to ${path.relative(root, outputPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
