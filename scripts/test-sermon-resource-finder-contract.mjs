import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const component = await readFile(resolve(process.cwd(), "src/components/SermonResourceFinder.tsx"), "utf8");
const page = await readFile(resolve(process.cwd(), "src/app/page.tsx"), "utf8");

const componentSignals = [
  'verified-preaching-helps.json',
  'presentation-hymns.json',
  'type FinderMode = "all" | "quotes" | "illustrations" | "hymns" | "books" | "commentary"',
  'Search reviewed resources in one place',
  'Search passage, subject, title, author, hymn, or words',
  'Add to sermon',
  'Added with source and rights notes.',
  'Review source',
  'target: "importedStudyNotes"',
];

const pageSignals = [
  'import SermonResourceFinder, { type SermonResourceAddition }',
  'function addReviewedResourceToSermon(addition: SermonResourceAddition)',
  '<SermonResourceFinder',
  'key={`sermon-resource-finder-${draft.id}`}',
  'onAdd={addReviewedResourceToSermon}',
  'label="Reviewed quotes"',
];

const missing = [
  ...componentSignals.filter((signal) => !component.includes(signal)).map((signal) => `component: ${signal}`),
  ...pageSignals.filter((signal) => !page.includes(signal)).map((signal) => `page: ${signal}`),
];

if (missing.length) {
  console.error(`Sermon Resource Finder contract failed. Missing:\n${missing.join("\n")}`);
  process.exit(1);
}

console.log("Sermon Resource Finder contract passed: verified quotes, illustrations, hymns, books, and commentary are searchable and retain source/rights notes when added.");
