import assert from "node:assert/strict";
import { readFile, mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import JSZip from "jszip";

const require = createRequire(import.meta.url);
const page = await readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("page.tsx", page, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const names = ["pptxHex", "pptxFontSize", "pptxCleanText", "exportSlideDeckPowerPoint"];
const functions = ast.statements.filter((node) => ts.isFunctionDeclaration(node) && names.includes(node.name?.text)).map((node) => node.getText(ast));
assert.equal(functions.length, names.length);
const optionsSource = await readFile(new URL("../src/lib/presentation-export.ts", import.meta.url), "utf8");
const input = `${optionsSource}\nconst SERMON_SLIDE_THEMES = { "classic-pulpit": {background:"#203A31",foreground:"#FFFFFF",muted:"#DDEEDD",accent:"#AA9955"} }; const SERMON_SLIDE_IMAGE_SLOTS = {};\n${functions.join("\n")}\nexport {exportSlideDeckPowerPoint};`;
const compiled = ts.transpileModule(input, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace('import("pptxgenjs")', `import(${JSON.stringify(pathToFileURL(require.resolve("pptxgenjs")).href)})`);
const { exportSlideDeckPowerPoint: exportDeck, presentationExportOptions: options, powerPointTextIssues: issues, powerPointBodyText: clean } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const output = await mkdtemp(path.join(tmpdir(), "presentation-privacy-"));
const kjv = "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.";
const base = { imageSlot:"none", showImageMotif:false, backgroundStyle:"Dark", textPlacement:"Left", layout:"Centered", titleScale:"Medium", fontScale:"Medium", showTypeLabel:false, showFooterBranding:false };
const slides = [
  { ...base, type:"Scripture", title:"John 3:16", subtitle:"King James Version", bibleText:kjv, body:"", speakerNotes:"PRIVATE_COUNSEL_SENTINEL" },
  { ...base, type:"Quote", title:"Commentary test", subtitle:"Test author · Test source", bibleText:"", body:"Exact quotation fixture.", speakerNotes:"PRIVATE_TEACHING_SENTINEL\nSource: https://example.org/source" },
];
const original = JSON.stringify(slides);
for (const mode of ["slides-only", "presenter"]) {
  const config = options(mode, "privacy-fixture", "PRIVATE_METADATA_SENTINEL");
  const file = path.join(output, config.filename);
  await exportDeck({ slides, themeId:"classic-pulpit", title:"Privacy fixture", ...config, filename:file });
  const zip = await JSZip.loadAsync(await readFile(file));
  const xml = (await Promise.all(Object.values(zip.files).filter((entry) => entry.name.endsWith(".xml")).map((entry) => entry.async("string")))).join("\n");
  const publicXml = (await Promise.all(Object.values(zip.files).filter((entry) => /^ppt\/slides\/slide\d+\.xml$/.test(entry.name)).map((entry) => entry.async("string")))).join("\n");
  for (const value of [kjv, "Exact quotation fixture.", "Test author · Test source"]) assert.ok(publicXml.includes(value), `Visible content changed: ${value}`);
  assert.ok(!publicXml.includes("PRIVATE_"), "Private notes leaked onto visible slides");
  for (const marker of ["PRIVATE_COUNSEL_SENTINEL", "PRIVATE_TEACHING_SENTINEL", "PRIVATE_METADATA_SENTINEL"]) assert.equal(xml.includes(marker), mode === "presenter", `${mode}: ${marker}`);
  if (mode === "presenter") assert.ok(xml.includes("https://example.org/source"), "Presenter rights/source record lost");
}
assert.equal(JSON.stringify(slides), original, "Export mutated the saved deck");
const boundary = `${"a".repeat(1384)} FINAL_KJV_WORDS`;
assert.equal(boundary.length, 1400);
assert.deepEqual(issues([]), []);
assert.deepEqual(issues([{ ...slides[0], bibleText: boundary }]), []);
assert.deepEqual(issues([{ ...slides[0], bibleText: "", body: "" }]), []);
assert.deepEqual(issues([{ ...slides[0], body: "b".repeat(2000) }]), [], "Unused body should not block Scripture export");
assert.equal(clean(`  ${boundary}\n\n\n `), boundary);
const oversized = [{ ...slides[0], id:"scripture", bibleText: boundary + "!" }, { ...slides[1], id:"quote", title:"", body:"b".repeat(1500) }];
assert.deepEqual(issues(oversized).map(({number, title, length}) => ({number, title, length})), [{number:1,title:"John 3:16",length:1401},{number:2,title:"Untitled slide",length:1500}]);
const beforeBlocked = JSON.stringify(oversized);
for (const mode of ["slides-only", "presenter"]) {
  await assert.rejects(exportDeck({slides:oversized,themeId:"classic-pulpit",title:"Too long",...options(mode,"blocked","PRIVATE"),filename:path.join(output,`blocked-${mode}.pptx`)}), /slides 1, 2 exceed/);
}
assert.equal(JSON.stringify(oversized), beforeBlocked, "Blocked export changed input text");
assert.ok(!(await readdir(output)).some((file) => file.startsWith("blocked-")), "Blocked export wrote a file");
const boundaryFile = path.join(output,"boundary.pptx");
await exportDeck({slides:[{...slides[0], bibleText:boundary}],themeId:"classic-pulpit",title:"Boundary",subject:"",filename:boundaryFile});
const boundaryZip = await JSZip.loadAsync(await readFile(boundaryFile));
assert.ok((await boundaryZip.file("ppt/slides/slide1.xml").async("string")).includes(boundary), "Final words lost at boundary");
assert.equal(options("unknown", "test", "PRIVATE").includeSpeakerNotes, false, "Unknown mode should fail closed");
const presentationHandler = page.slice(page.indexOf("async function exportPresentationPowerPoint"), page.indexOf("function exportPresentationPdfPreview"));
assert.ok(presentationHandler.includes('= "slides-only"'));
assert.ok(!presentationHandler.includes("downloadTextFile"), "Export failure must not silently download a private Markdown plan");
const sermonHandler = page.slice(page.indexOf("async function exportSermonPowerPoint"),page.indexOf("function exportSermonPdfPreview"));
for (const handler of [presentationHandler,sermonHandler]) assert.ok(handler.indexOf("powerPointTextWarning") < handler.indexOf("try {"), "Oversize warning must precede fallback/error handling");
console.log("PASS: 1400/1401 boundary, multiple offenders, body precedence, no mutation, blocked file creation, and final exported words.");
console.log(`PASS: actual PowerPoint ZIPs verified in ${output}; visible KJV/quotation/author text preserved, public copy excludes private notes and metadata, presenter copy retains notes, source unchanged, failure path safe.`);
