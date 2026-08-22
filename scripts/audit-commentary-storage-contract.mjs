import { readFile } from "node:fs/promises";

const indexPath = "data/commentary/reports/commentary-chapter-file-index.json";
const inventoryPath = "data/storage/public-content-storage-inventory.json";

const [index, inventory] = await Promise.all([
  readFile(indexPath, "utf8").then(JSON.parse),
  readFile(inventoryPath, "utf8").then(JSON.parse),
]);

if (!Array.isArray(index.files) || index.files.length === 0) {
  throw new Error("Commentary chapter index does not contain a public file list.");
}
if (!Array.isArray(inventory.items)) {
  throw new Error("Public content storage inventory does not contain an item list.");
}

const inventoryPaths = new Set(
  inventory.items
    .filter((item) => !item.missing)
    .map((item) => item.storage_path),
);
const requiredIndexPath = inventory.items.find(
  (item) => item.kind === "commentary_index" && item.storage_path === indexPath && !item.missing,
);

if (!requiredIndexPath) {
  throw new Error(`Storage inventory is missing the commentary chapter index: ${indexPath}.`);
}

const expectedBatchPaths = index.files.map((fileName) => `data/imports/${fileName}`);
const missingBatchPaths = expectedBatchPaths.filter((filePath) => !inventoryPaths.has(filePath));
if (missingBatchPaths.length > 0) {
  throw new Error(
    `Storage inventory is missing ${missingBatchPaths.length} indexed commentary batches, beginning with ${missingBatchPaths.slice(0, 5).join(", ")}.`,
  );
}

const commentaryInventory = inventory.items.filter((item) => item.kind === "commentary_batch" && !item.missing);
if (commentaryInventory.length !== expectedBatchPaths.length) {
  throw new Error(
    `Storage inventory has ${commentaryInventory.length} commentary batches; expected ${expectedBatchPaths.length} from the chapter index.`,
  );
}

console.log(`PASS commentary storage index: ${indexPath} is queued for upload.`);
console.log(`PASS commentary storage batches: all ${expectedBatchPaths.length} indexed public files are queued for upload.`);
