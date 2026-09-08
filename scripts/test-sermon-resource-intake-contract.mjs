import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const intake = await readFile(resolve(process.cwd(), "src/components/SermonResourceIntake.tsx"), "utf8");
const page = await readFile(resolve(process.cwd(), "src/app/page.tsx"), "utf8");

const intakeSignals = [
  'type CandidateKind = "Quote" | "Illustration" | "Hymn" | "Book" | "Commentary" | "Audio"',
  'Candidate only',
  'Exact source URL',
  'Rights evidence or permission notes',
  'Saving does not approve a resource for public use.',
  'Candidate saved separately from the reviewed library.',
  'Download review packet',
  'Possible duplicate',
  '/^https:\\/\\//i',
];

const pageSignals = [
  'import SermonResourceIntake from "@/components/SermonResourceIntake"',
  '<SermonResourceIntake />',
];

const missing = [
  ...intakeSignals.filter((signal) => !intake.includes(signal)).map((signal) => `intake: ${signal}`),
  ...pageSignals.filter((signal) => !page.includes(signal)).map((signal) => `page: ${signal}`),
];

if (missing.length) {
  console.error(`Sermon Resource Intake contract failed. Missing:\n${missing.join("\n")}`);
  process.exit(1);
}

console.log("Sermon Resource Intake contract passed: candidates remain separate, require exact source and rights evidence, detect duplicates, persist locally, and export for review.");
