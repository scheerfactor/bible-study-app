import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const page = await readFile(resolve(root, "src/app/page.tsx"), "utf8");
const manifest = JSON.parse(await readFile(resolve(root, "public/media/sermon-slides/media-assets.json"), "utf8"));

const expected = [
  {
    slot: "genesis-creation-dawn",
    file: "generated/genesis-creation-dawn-v1.png",
    books: ["Genesis"],
  },
  {
    slot: "psalms-still-waters-generated",
    file: "generated/psalms-still-waters-v1.png",
    books: ["Psalms"],
  },
  {
    slot: "gospels-empty-tomb-dawn",
    file: "generated/gospels-empty-tomb-dawn-v1.png",
    books: ["Matthew", "Mark", "Luke", "John"],
  },
];

const errors = [];

for (const item of expected) {
  const entry = manifest.find((candidate) => candidate.slot === item.slot && candidate.file === item.file);
  if (!entry) errors.push(`Missing generated media manifest entry: ${item.slot}`);
  if (!page.includes(`assetUrl: "/media/sermon-slides/${item.file}"`)) errors.push(`Missing local image slot: ${item.slot}`);

  for (const book of item.books) {
    if (!page.includes(`${book}: "${item.slot}"`) && !page.includes(`"${book}": "${item.slot}"`)) {
      errors.push(`Missing ${book} background mapping: ${item.slot}`);
    }
  }

  const buffer = await readFile(resolve(root, "public/media/sermon-slides", item.file));
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(signature)) {
    errors.push(`Generated background is not a readable PNG: ${item.file}`);
    continue;
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width < 1600 || height < 900 || Math.abs(width / height - 16 / 9) > 0.01) {
    errors.push(`Generated background must be 16:9 and at least 1600x900: ${item.file} (${width}x${height})`);
  }
}

for (const signal of [
  `slot: "genesis-creation-dawn"`,
  `slot: "psalms-still-waters-generated"`,
  `slot: "gospels-empty-tomb-dawn"`,
]) {
  if (!page.includes(signal)) errors.push(`Missing automatic Scripture background suggestion: ${signal}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Generated book background contract passed: three local 16:9 backgrounds cover Genesis, Psalms, and the four Gospels with automatic verse suggestions.");
