import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/commentary-excerpt.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { validateCommentaryExcerpt: validate, COMMENTARY_EXCERPT_LIMIT: limit } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const original = "Opening context.\nExact words, with punctuation!\nClosing context.";
assert.deepEqual(validate(original, "  Exact words, with punctuation!  "), { text: "Exact words, with punctuation!", start: 17, error: "" });
assert.equal(validate(original, original).error, "");
assert.equal(validate(original, "context.\nExact words").error, "");
assert.notEqual(validate(original, "exact words, with punctuation!").error, "");
assert.notEqual(validate(original, "Opening context. Closing context.").error, "");
assert.notEqual(validate(original, "  ").error, "");
assert.notEqual(validate(original, "A paraphrase").error, "");
assert.equal(validate("x".repeat(limit), "x".repeat(limit)).error, "");
assert.notEqual(validate("x".repeat(limit + 1), "x".repeat(limit + 1)).error, "");
assert.equal(validate("Repeated. Repeated.", "Repeated.").start, 0);
console.log("PASS: 10 exact-excerpt validation checks (wording, context, whitespace, limits, location).");
