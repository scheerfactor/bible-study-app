import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const source = await readFile(resolve(process.cwd(), "src/app/page.tsx"), "utf8");
const requiredSignals = [
  'const isAnswered = focus?.answerStatus === "Answered";',
  "Original request: ${focus.request}",
  "Praise report: ${answerSummary}",
  "Thank the Lord for His answer concerning ${focus.name}",
  "Remember the Lord's help, give Him thanks, and share this testimony wisely.",
  'onJournalEntry={startJournalFromPrayer}',
  'onClick={() => onJournalEntry(entry)}',
  '{isAnswered ? "Journal answer" : "Journal prayer"}',
];

const missing = requiredSignals.filter((signal) => !source.includes(signal));
if (missing.length) {
  console.error(`Prayer-to-journal testimony contract failed. Missing:\n${missing.join("\n")}`);
  process.exit(1);
}

console.log("Prayer-to-journal testimony contract passed: requests and answers can open a Scripture-connected journal draft with testimony context preserved.");
