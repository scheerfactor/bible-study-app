import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const manifestPath = resolve(root, "public", "media", "sermon-slides", "media-assets.json");
const entries = JSON.parse(await readFile(manifestPath, "utf8"));
const errors = [];
const files = new Set();
const slots = new Set();
const referencePattern = /^(?:[1-3] )?[A-Z][A-Za-z' ]+ \d+:\d+(?:-\d+)?$/;
const jpegStartOfFrameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

function jpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (offset + 2 > buffer.length) break;
    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) break;
    if (jpegStartOfFrameMarkers.has(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }
    offset += segmentLength;
  }
  return null;
}

function pngDimensions(buffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(signature) || buffer.toString("ascii", 12, 16) !== "IHDR") return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function presentationImageDimensions(buffer) {
  return jpegDimensions(buffer) ?? pngDimensions(buffer);
}

if (!Array.isArray(entries) || !entries.length) errors.push("Presentation media manifest must contain at least one entry.");

for (const [index, entry] of entries.entries()) {
  const label = entry.slot || `record ${index + 1}`;
  if (!entry.file || files.has(entry.file)) errors.push(`Missing or duplicate file: ${label}`);
  if (!entry.slot || slots.has(entry.slot)) errors.push(`Missing or duplicate slot: ${label}`);
  files.add(entry.file);
  slots.add(entry.slot);

  for (const field of ["category", "source", "source_url", "rightsStatus", "artist", "credit", "recommendedUse", "optimized"]) {
    if (typeof entry[field] !== "string" || !entry[field].trim()) errors.push(`Missing ${field}: ${label}`);
  }
  if (!Array.isArray(entry.themes) || entry.themes.length < 2 || entry.themes.some((theme) => typeof theme !== "string" || !theme.trim())) {
    errors.push(`At least two themes are required: ${label}`);
  }
  if (!Array.isArray(entry.bibleReferences) || entry.bibleReferences.length < 1) {
    errors.push(`At least one Bible reference is required: ${label}`);
  } else {
    for (const reference of entry.bibleReferences) {
      if (typeof reference !== "string" || !referencePattern.test(reference)) errors.push(`Invalid Bible reference '${reference}': ${label}`);
    }
  }
  if (!/public domain|cc0|original generated asset/i.test(entry.rightsStatus ?? "")) errors.push(`Unclear image rights: ${label}`);
  try {
    const imagePath = resolve(root, "public", "media", "sermon-slides", entry.file);
    await access(imagePath);
    const dimensions = presentationImageDimensions(await readFile(imagePath));
    if (!dimensions) {
      errors.push(`Presentation image is not a readable JPEG or PNG: ${entry.file}`);
    } else if (dimensions.width < 1600 || dimensions.height < 900 || Math.abs(dimensions.width / dimensions.height - 16 / 9) > 0.01) {
      errors.push(`Presentation image must be 16:9 and at least 1600x900: ${entry.file} (${dimensions.width}x${dimensions.height})`);
    }
  } catch {
    errors.push(`Missing local presentation image: ${entry.file}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Presentation media validation passed: ${entries.length} unique local backgrounds with rights, themes, and Bible references.`);
