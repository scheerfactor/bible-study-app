import { readFile, readdir } from "node:fs/promises";

const mappingsDirectory = "data/strongs/mappings-by-chapter";
const inventoryPath = "data/storage/public-content-storage-inventory.json";

const [mappingFiles, inventory] = await Promise.all([
  readdir(mappingsDirectory).then((files) => files.filter((file) => file.endsWith(".json")).sort()),
  readFile(inventoryPath, "utf8").then(JSON.parse),
]);

const inventoryMappings = inventory.items.filter(
  (item) => item.kind === "strongs_mapping_chapter" && !item.missing,
);
const inventoryPaths = new Set(inventoryMappings.map((item) => item.storage_path));
const expectedPaths = mappingFiles.map((file) => `${mappingsDirectory}/${file}`);
const missingPaths = expectedPaths.filter((file) => !inventoryPaths.has(file));
const extraPaths = inventoryMappings
  .map((item) => item.storage_path)
  .filter((file) => !expectedPaths.includes(file));

if (missingPaths.length || extraPaths.length || inventoryMappings.length !== mappingFiles.length) {
  throw new Error(
    `Strong's storage inventory mismatch: ${missingPaths.length} missing, ${extraPaths.length} extra, ` +
      `${inventoryMappings.length} inventoried of ${mappingFiles.length} chapter shards.`,
  );
}

const invalidItems = inventoryMappings.filter(
  (item) => !item.checksum_sha256 || !Number.isInteger(item.size_bytes) || item.size_bytes <= 0,
);
if (invalidItems.length) {
  throw new Error(`Strong's storage inventory has ${invalidItems.length} shard(s) without a checksum or valid size.`);
}

const totalBytes = inventoryMappings.reduce((sum, item) => sum + item.size_bytes, 0);
console.log(`PASS Strong's storage inventory: ${inventoryMappings.length} chapter shards are checksum-tracked.`);
console.log(`PASS Strong's storage volume: ${(totalBytes / 1024 / 1024).toFixed(2)} MB queued in book-sized upload batches.`);
