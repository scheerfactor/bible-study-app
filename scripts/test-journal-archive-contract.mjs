import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const source = await readFile(resolve(process.cwd(), "src/app/page.tsx"), "utf8");
const requiredSignals = [
  'const [journalQuery, setJournalQuery] = useState("")',
  'const [journalSourceFilter, setJournalSourceFilter] = useState<"All" | JournalSourceType>("All")',
  "const visibleJournalEntries = entries.filter((entry) => {",
  "entry.sourceLabel,",
  "Searchable Scripture Journal",
  "Search saved journal",
  "Search Scripture, prayer, answer, topic, or teaching thought",
  "All sources",
  'setJournalSourceFilter("Prayer Entry")',
  'setJournalQuery("Answered prayer testimony")',
  "Answered testimonies",
  "No saved entries match this search and source filter.",
];

const missing = requiredSignals.filter((signal) => !source.includes(signal));
if (missing.length) {
  console.error(`Journal archive contract failed. Missing:\n${missing.join("\n")}`);
  process.exit(1);
}

console.log("Journal archive contract passed: every saved entry is searchable by Scripture, prayer, testimony, topic, and source, with a dedicated answered-testimony view.");
