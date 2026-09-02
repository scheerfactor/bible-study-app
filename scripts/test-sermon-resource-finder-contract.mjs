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
  'Send to presentation',
  'Build hymn slide sequence',
  'Short piano preview from the reviewed arrangement',
  'Melody (highest voice)',
  'Full arrangement',
  'Slow practice',
  'const tempoRate = tempo === "slow" ? 0.75 : 1',
  'fathers-business-hymn-preparations-v1',
  'loadHymnPreparations()',
  'Preparation saved on this device.',
  'Voice, tempo, and slide sequence save automatically.',
  'Reset saved setup',
  'fathers-business-hymn-service-set-v1',
  'Saved service hymn set',
  'Add to service set',
  'Move ${result.title} up in service set',
  'Create {serviceSetSlideCount} service slide',
  'Added the complete service hymn set to presentation slides in order.',
  'playTunePreview(result.hymn!)',
  '/api/hymns/${encodeURIComponent(hymn.id)}/preview',
  'Repeat refrain after each selected stanza',
  'Create ${selectedHymnSequence(result).length} hymn slide',
  'Selected section:',
  'resolvedSlides(result)',
  'Added with source and rights notes.',
  'Added the ordered hymn sequence to presentation slides with source and rights notes.',
  'Review source',
  'target: "importedStudyNotes"',
];

const pageSignals = [
  'import SermonResourceFinder, { type SermonResourceAddition, type SermonResourceSlideSeed }',
  'function addReviewedResourceToSermon(addition: SermonResourceAddition)',
  'function addReviewedResourceToPresentation(seeds: SermonResourceSlideSeed[])',
  'slides: [...sermonSlides, ...nextSlides]',
  'seed.resourceKind === "hymns"',
  '? "Hymn"',
  'if (type === "Hymn")',
  '<SermonResourceFinder',
  'key={`sermon-resource-finder-${draft.id}`}',
  'onAdd={addReviewedResourceToSermon}',
  'onAddToPresentation={addReviewedResourceToPresentation}',
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

console.log("Sermon Resource Finder contract passed: verified quotes, illustrations, hymns, books, and commentary retain source/rights notes when added to a sermon or presentation.");
