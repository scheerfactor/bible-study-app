import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);
const manifestArg = args.find((argument) => argument.startsWith("--manifest="));
const apply = args.includes("--apply");

if (!manifestArg) {
  throw new Error("Usage: node scripts/import-timeless-truths-hymn-batch.mjs --manifest=path/to/batch.json [--apply]");
}

const manifestPath = resolve(root, manifestArg.slice("--manifest=".length));
const supplementalPath = resolve(root, "data", "hymns", "supplemental-hymns.json");
const verifiedPath = resolve(root, "data", "hymns", "verified-hymns.json");
const sourcesPath = resolve(root, "data", "hymns", "sources");
const publicDomainMarker = "copyright status is <!-- Creative Commons Public Domain -->";

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const supplemental = JSON.parse(await readFile(supplementalPath, "utf8"));
const verified = JSON.parse(await readFile(verifiedPath, "utf8"));

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function decodeHtml(value) {
  const entities = new Map([
    ["amp", "&"],
    ["apos", "'"],
    ["ldquo", "“"],
    ["lsquo", "‘"],
    ["mdash", "—"],
    ["nbsp", " "],
    ["quot", '"'],
    ["rdquo", "”"],
    ["rsquo", "’"],
  ]);
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, key) => {
    if (key.startsWith("#x")) return String.fromCodePoint(Number.parseInt(key.slice(2), 16));
    if (key.startsWith("#")) return String.fromCodePoint(Number.parseInt(key.slice(1), 10));
    return entities.get(key.toLowerCase()) ?? entity;
  });
}

function pageText(html) {
  return decodeHtml(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}

function normalizedLine(value) {
  return value.replace(/\s+/g, " ").trim();
}

function fragmentText(value) {
  return decodeHtml(value.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""))
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function extractLyrics(html, id) {
  const verses = html.match(/<div class='verses'[^>]*>\s*<ol>([\s\S]*?)<\/ol>/i)?.[1];
  if (!verses) throw new Error(`${id}: unable to locate the source lyrics`);
  const refrainMatch = verses.match(/<ul>\s*<li class="refrain">[\s\S]*?<br\s*\/>([\s\S]*?)<\/li>\s*<\/ul>/i);
  const refrain = refrainMatch ? fragmentText(refrainMatch[1]) : null;
  const stanzaHtml = verses.replace(/<ul>[\s\S]*?<\/ul>/gi, "");
  const stanzas = [...stanzaHtml.matchAll(/<li(?:\s+class="[^"]*")?>([\s\S]*?)<\/li>/gi)].map((match) =>
    fragmentText(match[1]),
  );
  if (stanzas.length < 2 || stanzas.some((stanza) => !stanza)) {
    throw new Error(`${id}: source must contain at least two complete stanzas`);
  }
  return { stanzas, refrain };
}

function requireString(entry, field) {
  if (typeof entry[field] !== "string" || !entry[field].trim()) {
    throw new Error(`${entry.id ?? "unknown"}: ${field} is required`);
  }
}

async function fetchRequired(url) {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`Unable to fetch ${url}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

function normalizedEvidenceBuffer(buffer) {
  return Buffer.from(buffer.toString("utf8").replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, ""));
}

const knownIds = new Set(verified.map((hymn) => hymn.id));
const knownTitles = new Set(verified.map((hymn) => hymn.title.toLowerCase()));
const batchIds = new Set();
const batchTitles = new Set();
const imports = [];

if (!manifest.batchId || !manifest.reviewedAt || !Array.isArray(manifest.entries) || manifest.entries.length === 0) {
  throw new Error("The batch requires batchId, reviewedAt, and at least one entry.");
}

for (const entry of manifest.entries) {
  for (const field of [
    "id",
    "title",
    "lyricist",
    "tune",
    "musicAttribution",
    "textSourceUrl",
    "musicSourceUrl",
  ]) {
    requireString(entry, field);
  }
  if (knownIds.has(entry.id) || batchIds.has(entry.id)) throw new Error(`Duplicate hymn id: ${entry.id}`);
  if (knownTitles.has(entry.title.toLowerCase()) || batchTitles.has(entry.title.toLowerCase())) {
    throw new Error(`Duplicate hymn title: ${entry.title}`);
  }
  if (!Array.isArray(entry.themes) || entry.themes.length === 0) throw new Error(`${entry.id}: themes required`);
  if (!Array.isArray(entry.scriptureReferences) || entry.scriptureReferences.length === 0) {
    throw new Error(`${entry.id}: Scripture references required`);
  }

  const [rawRightsBuffer, midiBuffer] = await Promise.all([
    fetchRequired(entry.textSourceUrl),
    fetchRequired(entry.musicSourceUrl),
  ]);
  const rightsBuffer = normalizedEvidenceBuffer(rawRightsBuffer);
  const rightsHtml = rightsBuffer.toString("utf8");
  const rightsMarkerCount = rightsHtml.split(publicDomainMarker).length - 1;
  if (rightsMarkerCount < 2) {
    throw new Error(`${entry.id}: source page does not mark both text and tune public domain`);
  }

  const { stanzas, refrain } = extractLyrics(rightsHtml, entry.id);
  const sourceText = pageText(rightsHtml);
  for (const line of [...stanzas, refrain].filter(Boolean).flatMap((text) => text.split("\n"))) {
    if (!sourceText.includes(normalizedLine(line))) {
      throw new Error(`${entry.id}: source page does not contain lyric line: ${line}`);
    }
  }
  if (midiBuffer.length < 100 || midiBuffer.subarray(0, 4).toString("ascii") !== "MThd") {
    throw new Error(`${entry.id}: downloaded music is not a MIDI file`);
  }

  const midiFile = `${entry.id}.mid`;
  const rightsEvidenceFile = `${entry.id}-rights.html`;
  imports.push({
    record: {
      ...entry,
      lyricYear: Number(entry.lyricYear),
      stanzas,
      refrain,
      textRights: "Public domain; every retained lyric line was verified against the cited Timeless Truths record.",
      midiFile,
      midiSha256: sha256(midiBuffer),
      rightsEvidenceFile,
      rightsEvidenceSha256: sha256(rightsBuffer),
      rightsEvidenceMarker: publicDomainMarker,
      musicRights: "Public Domain",
      reviewedAt: manifest.reviewedAt,
    },
    midiBuffer,
    rightsBuffer,
  });
  batchIds.add(entry.id);
  batchTitles.add(entry.title.toLowerCase());
}

console.log(`Verified ${imports.length} nonduplicate public-domain hymns from ${manifest.sourceProvider ?? "the source provider"}.`);
if (!apply) {
  console.log("Dry run only. Re-run with --apply to retain sources and update the supplemental manifest.");
  process.exit(0);
}

await mkdir(sourcesPath, { recursive: true });
for (const item of imports) {
  await Promise.all([
    writeFile(resolve(sourcesPath, item.record.midiFile), item.midiBuffer),
    writeFile(resolve(sourcesPath, item.record.rightsEvidenceFile), item.rightsBuffer),
  ]);
}
await writeFile(
  supplementalPath,
  JSON.stringify([...supplemental, ...imports.map((item) => item.record)], null, 2) + "\n",
);
console.log(`Imported ${imports.length} hymns from ${manifest.batchId}. Run npm run hymns:prepare to rebuild playable notes.`);
