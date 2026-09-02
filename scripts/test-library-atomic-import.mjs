import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rollbackImportedLibraryEntries } from "./library-atomic-import.mjs";

const tempRoot = await mkdtemp(join(tmpdir(), "fathers-business-library-atomic-"));
const firstFile = join(tempRoot, "first.txt");
const secondFile = join(tempRoot, "second.txt");

try {
  await Promise.all([
    writeFile(firstFile, "first reviewed resource", "utf8"),
    writeFile(secondFile, "second reviewed resource", "utf8"),
  ]);

  const entries = [{ file_path: firstFile }, { file_path: secondFile }];
  const rows = [
    { status: "imported", file_path: firstFile, issues: [] },
    { status: "imported", file_path: secondFile, issues: [] },
    { status: "failed", issues: ["simulated download failure"] },
  ];

  const result = await rollbackImportedLibraryEntries({ entries, rows });
  const remaining = await Promise.all([firstFile, secondFile].map(async (filePath) => {
    try {
      await access(filePath);
      return filePath;
    } catch {
      return null;
    }
  }));

  const errors = [];
  if (result.rolledBack !== 2) errors.push(`Expected two rolled-back resources, received ${result.rolledBack}.`);
  if (result.cleanupFailures.length) errors.push(`Unexpected cleanup failures: ${JSON.stringify(result.cleanupFailures)}`);
  if (entries.length) errors.push("The staged entry list was not cleared.");
  if (remaining.some(Boolean)) errors.push("One or more staged resource files remained after rollback.");
  if (rows.slice(0, 2).some((row) => row.status !== "rolled_back" || row.file_path || !row.issues.length)) {
    errors.push("Imported row reports were not marked as rolled back.");
  }
  if (rows[2].status !== "failed") errors.push("The original failed row was changed during rollback.");

  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log("Atomic library rollback test passed: staged files and entries are removed while the original failure remains visible.");
  }
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
