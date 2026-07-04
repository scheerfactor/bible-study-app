import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const sourcePath = "data/library/verified/naves-topical-bible.txt";
const outputPath = "data/generated/naves-topical-bible.topics.json";
const reportJsonPath = "data/reports/nave-topical-index.json";
const reportMdPath = "data/reports/NAVE_TOPICAL_INDEX.md";

const bookPattern =
  "\\b(?:Gen|Ex|Exod|Lev|Num|Deut|Josh|Judg|Ruth|1\\s*Sam|2\\s*Sam|1\\s*Kin|2\\s*Kin|1\\s*Chr|2\\s*Chr|Ezra|Neh|Esth|Job|Psa|Ps|Prov|Eccl|Song|Cant|Isa|Jer|Lam|Ezek|Dan|Hos|Joel|Amos|Obad|Jonah|Mic|Nah|Hab|Zeph|Hag|Zech|Mal|Matt|Mark|Luke|John|Acts|Rom|1\\s*Cor|2\\s*Cor|Gal|Eph|Phil|Col|1\\s*Thess|2\\s*Thess|1\\s*Tim|2\\s*Tim|Titus|Philem|Heb|Jas|James|1\\s*Pet|2\\s*Pet|1\\s*John|2\\s*John|3\\s*John|Jude|Rev)\\.?\\s*\\d+\\s*[: ]\\s*\\d+";
const referenceRegex = new RegExp(bookPattern, "gi");

function compactWhitespace(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeTopic(value) {
  return compactWhitespace(value)
    .toLowerCase()
    .replace(/see\s+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTopicHeading(value) {
  return compactWhitespace(value)
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/\s+-\s+/g, "-")
    .replace(/[,.;:]+$/, "")
    .replace(/\.$/, "")
    .trim();
}

function isLikelyStandaloneHeading(line) {
  const text = compactWhitespace(line);
  if (!text || text.length < 3 || text.length > 70) return false;
  if (/^(THE TOPICAL BIBLE|NAVE'?S TOPICAL BIBLE|WEST|SOUTH|NORTH|EAST)$/i.test(text)) return false;
  if (/^\d+$/.test(text)) return false;
  if (/^[A-Z]\.?$/.test(text)) return false;
  if (!/^[A-Z][A-Z '&()/-]+[.,]?$/.test(text)) return false;
  if (!/[A-Z]/.test(text)) return false;

  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 3) return false;

  const uppercaseLetters = letters.replace(/[^A-Z]/g, "").length;
  const uppercaseRatio = uppercaseLetters / letters.length;
  if (uppercaseRatio < 0.78) return false;

  return /[.,]$/.test(text);
}

function headingAndRemainder(line) {
  const text = compactWhitespace(line);

  const inlineMatch = text.match(/^([A-Z][A-Z '&()/-]{2,48})[.,]\s+(.+)$/);
  if (inlineMatch && !/^\d/.test(inlineMatch[1]) && inlineMatch[2].length >= 8) {
    return {
      heading: cleanTopicHeading(inlineMatch[1]),
      remainder: inlineMatch[2],
    };
  }

  if (isLikelyStandaloneHeading(line)) {
    return {
      heading: cleanTopicHeading(text),
      remainder: "",
    };
  }

  return null;
}

function extractReferences(text) {
  const references = [];
  for (const match of text.matchAll(referenceRegex)) {
    references.push(
      compactWhitespace(match[0])
        .replace(/\s+:/g, ":")
        .replace(/:\s+/g, ":")
        .replace(/\s+/g, " "),
    );
  }
  return [...new Set(references)].slice(0, 80);
}

function flushTopic(topics, current, endLine) {
  if (!current) return;

  const body = compactWhitespace(current.body.join(" "));
  const topic = cleanTopicHeading(current.topic);
  const normalizedTopic = normalizeTopic(topic);
  if (!normalizedTopic || body.length < 12) return;
  if (/\d/.test(normalizedTopic)) return;

  const topicTokens = normalizedTopic.split(" ");
  if (topicTokens[0]?.length === 1) return;

  const singleLetterTokens = topicTokens.filter((token) => token.length === 1).length;
  if (topicTokens.length >= 3 && singleLetterTokens / topicTokens.length > 0.5) return;

  const references = extractReferences(`${topic} ${body}`);
  topics.push({
    topic,
    normalized_topic: normalizedTopic,
    body,
    references,
    reference_count: references.length,
    source: "Nave's Topical Bible",
    source_file: sourcePath,
    rights_status: "public_domain",
    review_status: "ocr_topic_parse_needs_spot_review",
    line_start: current.line_start,
    line_end: endLine,
  });
}

function parseNave(raw) {
  const lines = raw.split(/\r?\n/);
  const topics = [];
  let current = null;
  let started = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineNumber = index + 1;
    const text = compactWhitespace(line);

    if (lineNumber > 250000 && /^INDEX\.?$/i.test(text)) break;
    if (!started && /^THE\s+TOPICAL\s+BIBLE\.?$/i.test(text)) {
      started = true;
      continue;
    }
    if (!started) continue;

    const parsedHeading = headingAndRemainder(line);
    if (parsedHeading) {
      flushTopic(topics, current, lineNumber - 1);
      current = {
        topic: parsedHeading.heading,
        line_start: lineNumber,
        body: parsedHeading.remainder ? [parsedHeading.remainder] : [],
      };
      continue;
    }

    if (current && text) current.body.push(text);
  }

  flushTopic(topics, current, lines.length);

  const byTopic = new Map();
  for (const topic of topics) {
    const existing = byTopic.get(topic.normalized_topic);
    if (!existing || topic.body.length > existing.body.length) byTopic.set(topic.normalized_topic, topic);
  }

  return [...byTopic.values()].sort((a, b) => a.normalized_topic.localeCompare(b.normalized_topic));
}

const raw = await readFile(sourcePath, "utf8");
const topics = parseNave(raw);
const suspicious = topics.filter((topic) => topic.reference_count === 0 || topic.body.length < 40).slice(0, 100);
const summary = {
  generated_at: new Date().toISOString(),
  source_file: sourcePath,
  topic_count: topics.length,
  topics_with_references: topics.filter((topic) => topic.reference_count > 0).length,
  topics_without_references: topics.filter((topic) => topic.reference_count === 0).length,
  suspicious_sample_count: suspicious.length,
  review_status: "OCR topic parse requires spot review before quotation.",
};

await mkdir(dirname(outputPath), { recursive: true });
await mkdir(dirname(reportJsonPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(topics, null, 2) + "\n");
await writeFile(reportJsonPath, JSON.stringify({ summary, suspicious }, null, 2) + "\n");

const md = [
  "# Nave Topical Bible Index",
  "",
  `Generated: ${summary.generated_at}`,
  "",
  "This index parses the verified public-domain Nave's Topical Bible text into topic records for faster Bible Tools search. The source is OCR-heavy, so records are marked for spot review before quotation.",
  "",
  "## Summary",
  "",
  `- Topics parsed: ${summary.topic_count}`,
  `- Topics with extracted references: ${summary.topics_with_references}`,
  `- Topics without extracted references: ${summary.topics_without_references}`,
  `- Output: \`${outputPath}\``,
  "",
  "## Review Rule",
  "",
  "- Use the index for discovery/search.",
  "- Verify against source text before quoting in sermon notes, handouts, or public excerpts.",
  "- Do not treat OCR topic splits as doctrinally reviewed commentary.",
  "",
  "## Suspicious Sample",
  "",
  suspicious.length
    ? suspicious.slice(0, 20).map((topic) => `- ${topic.topic} (${topic.line_start}-${topic.line_end}, refs: ${topic.reference_count})`).join("\n")
    : "- None",
  "",
].join("\n");

await writeFile(reportMdPath, md);

console.log(`Nave topical index built: ${summary.topic_count} topics.`);
console.log(`Topics with references: ${summary.topics_with_references}`);
console.log(`Report written: ${reportMdPath}`);
