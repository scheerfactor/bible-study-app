import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MANIFEST_PATH = path.join(ROOT, "data/library/manifests/curated-public-domain-resources.json");
const OUTPUT_DIR = path.join(ROOT, "data/library/acquisition");
const CSV_PATH = path.join(OUTPUT_DIR, "high-value-public-domain-resource-ranking.csv");
const REVIEW_CSV_PATH = path.join(OUTPUT_DIR, "high-value-needs-review-resource-candidates.csv");
const REPORT_PATH = path.join(ROOT, "HIGH_VALUE_PUBLIC_DOMAIN_RESOURCE_RESEARCH.md");
const NEXT_CANDIDATES_PATH = path.join(ROOT, "NEXT_LIBRARY_IMPORT_CANDIDATES.csv");

const CATEGORY_SCORE = new Map([
  ["Commentaries", 1000],
  ["Dictionaries", 980],
  ["Topical Bible", 960],
  ["Bible study helps", 940],
  ["Bible Handbooks", 920],
  ["Surveys", 900],
  ["KJV / Textual Issues", 880],
  ["Baptist History", 860],
  ["Preaching & Teaching", 840],
  ["Prayer", 820],
  ["Missions", 800],
  ["Biographies", 780],
  ["Evangelism", 760],
  ["Christian Living", 740],
  ["Christian life", 730],
  ["Classics", 720],
  ["Fiction/classics", 700],
  ["Preaching/teaching", 690],
]);

const AUTHOR_BONUSES = [
  [/spurgeon/i, 140],
  [/ironside/i, 135],
  [/ryle/i, 125],
  [/moody/i, 120],
  [/bounds/i, 120],
  [/murray/i, 115],
  [/torrey/i, 115],
  [/meyer/i, 115],
  [/bunyan/i, 110],
  [/kelly/i, 110],
  [/darby/i, 105],
  [/grant/i, 105],
  [/gaebelein/i, 105],
  [/larkin/i, 105],
  [/carey|judson|brainerd|taylor|goforth|livingstone/i, 95],
  [/broadus|dargan|boyce|strong|pendleton|cathcart|vedder|armitage/i, 90],
  [/henry|barnes|clarke|wesley|jfb|jamieson|fausset|brown|poole|gill/i, 90],
];

const TITLE_BONUSES = [
  [/commentary|exposition|expository|notes on|expositor|lectures on/i, 120],
  [/dictionary|lexicon|cyclopaedia|encyclopedia|encyclopaedia|topical|concordance/i, 120],
  [/atlas|geography|chronology|harmony|handbook|survey|introduction/i, 105],
  [/sermon|preaching|homiletic|pulpit|teacher|teaching|lesson/i, 90],
  [/baptist|baptism|church history|reformation|martyr|martyrs/i, 80],
  [/prayer|intercession|devotion|devotional/i, 75],
  [/mission|missionary|missions|evangelism|soul[- ]?winning/i, 70],
  [/grace|faith|gospel|christ|scripture|bible|salvation/i, 55],
];

const REFERENCE_CATEGORIES = new Set([
  "Dictionaries",
  "Topical Bible",
  "Bible study helps",
  "Bible Handbooks",
  "Surveys",
  "KJV / Textual Issues",
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s]/g, " ")
    .replace(/\b(vol|volume|v|part|book)\s+(?:[ivxlcdm]+|\d+)\b/g, " ")
    .replace(/\b(of)\s+\d+\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function exactDedupeKey(resource) {
  return `${normalizeText(resource.title)}|${normalizeText(resource.author)}`;
}

function workGroupKey(resource) {
  return `${normalizeText(resource.title).replace(/\b\d+\b/g, "").replace(/\s+/g, " ").trim()}|${normalizeText(resource.author)}`;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function categoryKind(resource) {
  if (resource.category === "Commentaries") return "Commentary";
  if (REFERENCE_CATEGORIES.has(resource.category)) return "Bible Study Reference";
  return "Christian Book";
}

function sourceQuality(resource) {
  const source = `${resource.source_url ?? ""} ${resource.download_url ?? ""}`.toLowerCase();
  if (source.includes("gutenberg.org")) return 120;
  if (source.includes("ccel.org")) return 105;
  if (source.includes("stempublishing.com")) return 95;
  if (source.includes("archive.org")) return 75;
  return 50;
}

function authorBonus(author) {
  return AUTHOR_BONUSES.reduce((score, [pattern, bonus]) => score + (pattern.test(author) ? bonus : 0), 0);
}

function titleBonus(title) {
  return TITLE_BONUSES.reduce((score, [pattern, bonus]) => score + (pattern.test(title) ? bonus : 0), 0);
}

function wordCountScore(resource) {
  const words = Number(resource.word_count ?? 0);
  if (words >= 60000) return 80;
  if (words >= 30000) return 65;
  if (words >= 12000) return 45;
  if (words >= 5000) return 25;
  return 0;
}

function usefulnessScore(resource) {
  const category = CATEGORY_SCORE.get(resource.category) ?? 650;
  return category
    + authorBonus(resource.author ?? "")
    + titleBonus(resource.title ?? "")
    + sourceQuality(resource)
    + wordCountScore(resource);
}

function priorityTier(rank) {
  if (rank <= 100) return "Tier 1 - core beta study library";
  if (rank <= 300) return "Tier 2 - high-value study expansion";
  if (rank <= 650) return "Tier 3 - strong curated library";
  return "Tier 4 - useful supporting resource";
}

function safeSnippet(value, max = 220) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function readCandidateCsv() {
  if (!fs.existsSync(NEXT_CANDIDATES_PATH)) return [];
  const lines = fs.readFileSync(NEXT_CANDIDATES_PATH, "utf8").split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines.shift() ?? "");
  return lines.map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""]));
  });
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function countBy(items, keyFn) {
  const counts = new Map();
  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function topCounts(items, keyFn, limit = 12) {
  return Array.from(countBy(items, keyFn).entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
}

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const resources = readJson(MANIFEST_PATH);

  const exactSeen = new Set();
  const deduped = [];
  const duplicateResources = [];
  for (const resource of resources) {
    const key = exactDedupeKey(resource);
    if (exactSeen.has(key)) {
      duplicateResources.push(resource);
      continue;
    }
    exactSeen.add(key);
    deduped.push(resource);
  }

  const workGroups = countBy(deduped, workGroupKey);
  const ranked = deduped
    .map((resource) => ({
      ...resource,
      resource_kind: categoryKind(resource),
      usefulness_score: usefulnessScore(resource),
      work_group_key: workGroupKey(resource),
      edition_or_volume_count: workGroups.get(workGroupKey(resource)) ?? 1,
    }))
    .sort((a, b) => b.usefulness_score - a.usefulness_score || String(a.title).localeCompare(String(b.title)))
    .slice(0, 1000)
    .map((resource, index) => ({ ...resource, rank: index + 1, priority_tier: priorityTier(index + 1) }));

  const csvHeader = [
    "rank",
    "priority_tier",
    "resource_kind",
    "usefulness_score",
    "title",
    "author",
    "year",
    "category",
    "collection",
    "source_url",
    "download_url",
    "public_domain_status",
    "commercial_use_status",
    "rights_basis",
    "recommended_use",
    "file_path",
    "word_count",
    "reading_hours_estimate",
    "work_group_key",
    "edition_or_volume_count",
  ];
  const csvRows = [csvHeader.join(",")];
  for (const resource of ranked) {
    const readingHours = resource.word_count ? (Number(resource.word_count) / 9000).toFixed(1) : "";
    csvRows.push(csvHeader.map((key) => {
      if (key === "reading_hours_estimate") return csvEscape(readingHours);
      if (key === "rights_basis") return csvEscape(safeSnippet(resource.rights_basis, 260));
      if (key === "recommended_use") return csvEscape(safeSnippet(resource.recommended_use, 260));
      return csvEscape(resource[key]);
    }).join(","));
  }
  fs.writeFileSync(CSV_PATH, `${csvRows.join("\n")}\n`);

  const candidates = readCandidateCsv();
  const reviewCandidates = candidates
    .filter((item) => /needs review|permission needed|candidate|source review|exact/i.test(Object.values(item).join(" ")))
    .slice(0, 300);
  const reviewHeader = [
    "title",
    "author",
    "category",
    "collection",
    "source_url",
    "rights_status",
    "review_status",
    "recommended_use",
    "next_action",
  ];
  fs.writeFileSync(
    REVIEW_CSV_PATH,
    [
      reviewHeader.join(","),
      ...reviewCandidates.map((item) => reviewHeader.map((key) => csvEscape(item[key] ?? item[key.replace("_", " ")] ?? "")).join(",")),
    ].join("\n") + "\n",
  );

  const commentaryCount = ranked.filter((item) => item.resource_kind === "Commentary").length;
  const referenceCount = ranked.filter((item) => item.resource_kind === "Bible Study Reference").length;
  const bookCount = ranked.filter((item) => item.resource_kind === "Christian Book").length;
  const report = [
    "# High-Value Public-Domain Christian Resource Research",
    "",
    "Generated by `npm`/Node from the verified local public-domain manifest. This report ranks the already verified and file-backed library first, then keeps uncertain sources in a separate review lane.",
    "",
    "## Summary",
    "",
    `- Verified resources reviewed: ${resources.length.toLocaleString()}`,
    `- Exact duplicate title/author records removed from ranking: ${duplicateResources.length.toLocaleString()}`,
    `- Ranked resources written: ${ranked.length.toLocaleString()}`,
    `- Commentary resources/volumes in ranked list: ${commentaryCount.toLocaleString()}`,
    `- Bible study reference works in ranked list: ${referenceCount.toLocaleString()}`,
    `- Christian books in ranked list: ${bookCount.toLocaleString()}`,
    `- Needs-review candidates tracked separately: ${reviewCandidates.length.toLocaleString()}`,
    "",
    "Important distinction: 100+ distinct complete whole-Bible commentary sets is not realistic from clean public-domain sources. The ranking therefore counts 100+ commentary resources/volumes while separately prioritizing true commentary sets such as Matthew Henry, JFB, Barnes, Clarke, Wesley, Poole, Pulpit Commentary, and Biblical Illustrator for parser/review work.",
    "",
    "## Source Safety Rules",
    "",
    "- Count only verified public-domain/file-backed resources as safe for the ranked 1,000.",
    "- Keep Project Gutenberg license/source notes with downloaded files.",
    "- Treat Internet Archive scans as review inputs, not automatic proof of public-domain/commercial-use rights.",
    "- Keep STEM/CCEL/source-index resources in review until exact reuse rights, source edition, and text quality are documented.",
    "- Do not import modern copyrighted works globally without written permission.",
    "",
    "## Top Categories",
    "",
    ...topCounts(ranked, (item) => item.category, 18).map(([category, count]) => `- ${category}: ${count}`),
    "",
    "## Top Authors In The Ranked 1,000",
    "",
    ...topCounts(ranked, (item) => item.author, 24).map(([author, count]) => `- ${author}: ${count}`),
    "",
    "## Top 50 Ranked Resources",
    "",
    ...ranked.slice(0, 50).map((item) => `${item.rank}. ${item.title} — ${item.author} (${item.resource_kind}, score ${item.usefulness_score})`),
    "",
    "## Priority Commentary Set Review Lane",
    "",
    "- Matthew Henry: keep complete/staged data stable; promote reviewed batches only.",
    "- Jamieson-Fausset-Brown: continue verified promotion where source metadata is clean.",
    "- Barnes, Adam Clarke, Wesley: continue filling gaps from clean reviewed files.",
    "- Matthew Poole: review exact source/edition before parser work.",
    "- Pulpit Commentary: review exact volumes and OCR quality before import.",
    "- Biblical Illustrator: useful for homiletic material, but likely noisy; stage small verified samples only.",
    "- Gill, Ironside, Kelly, Darby, Grant, Gaebelein: keep source/edition/doctrinal labels explicit before public import.",
    "",
    "## Output Files",
    "",
    `- ${path.relative(ROOT, CSV_PATH)}`,
    `- ${path.relative(ROOT, REVIEW_CSV_PATH)}`,
    "",
  ].join("\n");
  fs.writeFileSync(REPORT_PATH, report);

  console.log(`Ranked ${ranked.length} resources.`);
  console.log(`Commentary: ${commentaryCount}; Reference: ${referenceCount}; Books: ${bookCount}.`);
  console.log(`Wrote ${path.relative(ROOT, CSV_PATH)}`);
  console.log(`Wrote ${path.relative(ROOT, REVIEW_CSV_PATH)}`);
  console.log(`Wrote ${path.relative(ROOT, REPORT_PATH)}`);
}

main();
