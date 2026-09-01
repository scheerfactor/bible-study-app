import { unlink } from "node:fs/promises";

export async function rollbackImportedLibraryEntries({ entries, rows, unlinkFile = unlink }) {
  const rolledBackFiles = new Set(entries.map((entry) => entry.file_path));
  const cleanupFailures = [];

  for (const filePath of rolledBackFiles) {
    try {
      await unlinkFile(filePath);
    } catch (error) {
      cleanupFailures.push({ file_path: filePath, error: error.message });
    }
  }

  for (const row of rows) {
    if (row.file_path && rolledBackFiles.has(row.file_path)) {
      row.status = "rolled_back";
      row.issues.push("Atomic batch rollback: another resource in this batch failed.");
      delete row.file_path;
    }
  }

  const rolledBack = entries.length;
  entries.length = 0;
  return { rolledBack, cleanupFailures };
}
