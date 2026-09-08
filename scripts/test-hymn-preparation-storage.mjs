import assert from "node:assert/strict";
import {
  MAX_SERVICE_SET_HYMNS,
  normalizeHymnPreparations,
  normalizeHymnServiceSet,
} from "../src/lib/hymn-preparation-storage.ts";

const catalog = [
  { id: "known-hymn", stanzaCount: 3, hasRefrain: true },
  { id: "no-refrain", stanzaCount: 2, hasRefrain: false },
];

assert.deepEqual(normalizeHymnPreparations({
  "known-hymn": {
    previewVoice: "full",
    previewTempo: "slow",
    stanzaIndexes: [2, 0, 2, -1, 3, 1.5],
    includeRefrain: true,
  },
  "no-refrain": {
    previewVoice: "unknown",
    previewTempo: "fast",
    stanzaIndexes: [1],
    includeRefrain: true,
  },
  "retired-hymn": {
    previewVoice: "full",
    previewTempo: "slow",
    stanzaIndexes: [0],
    includeRefrain: true,
  },
}, catalog), {
  "known-hymn": {
    previewVoice: "full",
    previewTempo: "slow",
    stanzaIndexes: [0, 2],
    includeRefrain: true,
  },
  "no-refrain": {
    previewVoice: "melody",
    previewTempo: "normal",
    stanzaIndexes: [1],
    includeRefrain: false,
  },
});

assert.deepEqual(normalizeHymnPreparations(null, catalog), {});
assert.deepEqual(normalizeHymnServiceSet(["known-hymn", "retired-hymn", "known-hymn", 42, "no-refrain"], catalog), ["known-hymn", "no-refrain"]);
const largeCatalog = Array.from({ length: MAX_SERVICE_SET_HYMNS + 5 }, (_, index) => ({ id: `hymn-${index}`, stanzaCount: 1, hasRefrain: false }));
assert.equal(normalizeHymnServiceSet(largeCatalog.map((hymn) => hymn.id), largeCatalog).length, MAX_SERVICE_SET_HYMNS);
assert.deepEqual(normalizeHymnServiceSet({}, catalog), []);

console.log("Hymn preparation storage passed: backup data is limited to known hymn IDs, valid stanza indexes, supported preview settings, and a bounded unique service order.");
