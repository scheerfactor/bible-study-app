import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

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

const sourcePath = path.resolve(
  root,
  args.get("source") ?? "data/strongs/source/crosswire-strongshebrew/strongshebrew.dat",
);
const outputPath = path.resolve(
  root,
  args.get("output") ?? "data/strongs/lexicon-batches/strongs-crosswire-hebrew-complete.json",
);
const batchIndexPath = path.resolve(root, "data/strongs/lexicon-batches/index.json");
const baseFile = path.resolve(root, "data/strongs/sample-verified-strongs.json");
const mappingFile = path.resolve(root, "data/strongs/kjv-strongs-mappings.reviewed.json");
const crossWireRawZipUrl = "https://www.crosswire.org/ftpmirror/pub/sword/packages/rawzip/StrongsHebrew.zip";

function cleanText(value) {
  return String(value ?? "")
    .replace(/\\[0-9]{5}\\?/g, " ")
    .replace(/\r/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

function normalizeStrongNumber(value) {
  return `H${String(value).replace(/\D/g, "").padStart(4, "0")}`;
}

function normalizedStrongKey(value) {
  const match = String(value ?? "").match(/^([GH])0*(\d+)$/);
  if (!match) return String(value ?? "");
  return `${match[1]}${Number(match[2])}`;
}

function parseEnglishWords(renderings) {
  const cleaned = cleanText(renderings)
    .replace(/\bX\b/g, " ")
    .replace(/[()+?]/g, " ")
    .replace(/\s+-\s+/g, "-");

  const words = cleaned
    .split(/[,;]+|\s+or\s+|\s+and\s+/i)
    .map((word) => word.replace(/[^A-Za-z0-9'\-\s]/g, " ").replace(/\s+/g, " ").trim().toLowerCase())
    .filter((word) => word && word.length <= 40)
    .filter((word) => !["a", "an", "the", "to", "of", "in", "for", "with", "by"].includes(word));

  return [...new Set(words)].slice(0, 16);
}

function parseRelatedNumbers(body) {
  const related = new Set();
  for (const match of body.matchAll(/see HEBREW for\s+0*(\d{1,5})/gi)) {
    related.add(normalizeStrongNumber(match[1]));
  }
  return [...related].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function parseEntry(number, body, strongsNumber) {
  const lines = body
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const headLine = lines.find((line) => new RegExp(`^${Number(number)}\\s+`).test(line));
  if (!headLine) return null;

  const headRest = headLine.replace(/^\d+\s+/, "").trim();
  const pronunciationMatch = headRest.match(/([a-z][a-z'\-]+(?:\s*\{[^}]+\})?)$/i);
  const pronunciation = pronunciationMatch ? pronunciationMatch[1].trim() : "";
  const original = pronunciation ? headRest.slice(0, -pronunciation.length).trim() : headRest;

  const bodyWithoutKey = body.replace(/^\\?\d{5}\\?\s*/m, "").replace(headLine, "");
  let splitMatch = bodyWithoutKey.match(/:--|:\s*-|:-|;\s*-|\.\s*--|\s--\s/);
  let splitIndex = splitMatch?.index ?? -1;
  let splitLength = splitMatch?.[0]?.length ?? 0;
  if (!splitMatch) {
    const semicolonIndex = bodyWithoutKey.lastIndexOf(";");
    const colonIndex = bodyWithoutKey.lastIndexOf(":");
    splitIndex = Math.max(semicolonIndex, colonIndex);
    splitLength = splitIndex >= 0 ? 1 : 0;
  }
  const definitionPart = splitIndex >= 0 ? bodyWithoutKey.slice(0, splitIndex) : bodyWithoutKey;
  const renderPart = splitIndex >= 0 ? bodyWithoutKey.slice(splitIndex + splitLength) : "";
  const definition = cleanText(definitionPart.replace(/see HEBREW for\s+0*\d{1,5}/gi, ""));
  const renderings = cleanText(renderPart.replace(/see HEBREW for\s+0*\d{1,5}/gi, ""));
  const englishWords = parseEnglishWords(renderings);
  const language = /\(Aramaic\)/i.test(body) ? "Aramaic" : "Hebrew";
  if (!definition || !englishWords.length) return null;

  return {
    strongs_number: strongsNumber,
    language,
    original_word: original || strongsNumber,
    transliteration: original || undefined,
    pronunciation: pronunciation || undefined,
    english_words: englishWords,
    related_numbers: parseRelatedNumbers(body),
    plain_definition: `Strong's definition: ${definition}. KJV renderings include: ${renderings}.`,
    source_title: "Strong's Hebrew Bible Dictionary",
    source_url: "https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=StrongsHebrew",
    rights_status:
      "CrossWire lists Strong's Hebrew Bible Dictionary as Public Domain / Copy Freely; this entry is imported from the reviewed CrossWire raw module.",
    review_status: "Verified",
  };
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

async function downloadSourceIfNeeded() {
  if (await fileExists(sourcePath)) return sourcePath;

  const downloadDir = path.join(os.tmpdir(), "fbbs-crosswire-strongshebrew");
  const zipPath = path.join(downloadDir, "StrongsHebrew.zip");
  const extractDir = path.join(downloadDir, "extracted");
  const extractedSource = path.join(
    extractDir,
    "modules",
    "lexdict",
    "rawld",
    "strongshebrew",
    "strongshebrew.dat",
  );

  if (await fileExists(extractedSource)) return extractedSource;

  await fs.mkdir(downloadDir, { recursive: true });
  const response = await fetch(crossWireRawZipUrl);
  if (!response.ok) {
    throw new Error(`Could not download ${crossWireRawZipUrl}: ${response.status} ${response.statusText}`);
  }
  await fs.writeFile(zipPath, Buffer.from(await response.arrayBuffer()));

  await fs.rm(extractDir, { recursive: true, force: true });
  await fs.mkdir(extractDir, { recursive: true });
  const unzip = spawnSync("unzip", ["-q", zipPath, "-d", extractDir], { encoding: "utf8" });
  if (unzip.status !== 0) {
    throw new Error(`Could not unzip CrossWire source: ${unzip.stderr || unzip.stdout}`);
  }
  return extractedSource;
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

async function mappedHebrewNumbersByNormalizedKey() {
  const rows = await readJsonIfExists(mappingFile, []);
  const mapped = new Map();
  for (const row of rows) {
    const number = row?.strongs_number;
    if (!/^H[0-9]+$/.test(number ?? "")) continue;
    const key = normalizedStrongKey(number);
    const bucket = mapped.get(key) ?? new Set();
    bucket.add(number);
    mapped.set(key, bucket);
  }
  return mapped;
}

async function main() {
  const resolvedSourcePath = await downloadSourceIfNeeded();
  const source = await fs.readFile(resolvedSourcePath, "utf8");
  const existing = await existingStrongNumbers();
  const mappedNumbersByKey = await mappedHebrewNumbersByNormalizedKey();
  const parts = source.split(/\$\$T0*(\d{1,5})\s*\r?\n/g);
  const entries = [];

  for (let index = 1; index < parts.length; index += 2) {
    const sourceNumber = parts[index];
    const sourceKey = normalizedStrongKey(`H${sourceNumber}`);
    const mappedExactNumbers = [...(mappedNumbersByKey.get(sourceKey) ?? [])];
    const fallbackNumber = normalizeStrongNumber(sourceNumber);
    const outputNumbers = mappedExactNumbers.length ? mappedExactNumbers : [fallbackNumber];

    for (const strongsNumber of outputNumbers) {
      if (existing.has(strongsNumber)) continue;
      const parsed = parseEntry(sourceNumber, parts[index + 1] ?? "", strongsNumber);
      if (!parsed) continue;
      entries.push(parsed);
      existing.add(strongsNumber);
    }
  }

  entries.sort((a, b) => a.strongs_number.localeCompare(b.strongs_number, undefined, { numeric: true }));
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(`${outputPath}.tmp`, `${JSON.stringify(entries, null, 2)}\n`);
  await fs.rename(`${outputPath}.tmp`, outputPath);
  console.log(`Wrote ${entries.length} CrossWire Hebrew/Aramaic Strong's entries to ${path.relative(root, outputPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
