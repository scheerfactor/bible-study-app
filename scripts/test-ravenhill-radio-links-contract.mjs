#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const page = await readFile("src/app/page.tsx", "utf8");
const radioWorkspace = await readFile("src/components/RadioWorkspace.tsx", "utf8");
const radioManifest = JSON.parse(await readFile("data/media/manifests/radio-stations.json", "utf8"));
const licensedResources = JSON.parse(await readFile("data/library/manifests/licensed-resource-links.json", "utf8"));

const errors = [];
const collection = "Leonard Ravenhill — Free Noncommercial Listening";
const ravenhillResources = licensedResources.filter((resource) => resource.collection === collection);
const stationTrackIds = new Set(radioManifest.stations.flatMap((station) => station.trackIds ?? []));

if (ravenhillResources.length < 3) {
  errors.push("The Ravenhill source-link pilot must retain at least three reviewed sermon links.");
}

if (!page.includes(`resource.collection === "${collection}"`)) {
  errors.push("The Radio tab must select the Ravenhill permission-limited collection explicitly.");
}

if (!page.includes("externalSermons={LICENSED_RESOURCE_LINKS.filter")) {
  errors.push("The Radio workspace must receive Ravenhill links through its external-sermon shelf.");
}

for (const phrase of [
  "Leonard Ravenhill — free listening",
  "Permission-approved source links",
  "not copied into the station playlist, downloaded, rebroadcast, or included in paid access",
  "Free · noncommercial · source attributed",
  "Listen at verified source",
]) {
  if (!radioWorkspace.includes(phrase)) errors.push(`The Radio shelf must show: ${phrase}`);
}

for (const resource of ravenhillResources) {
  if (stationTrackIds.has(resource.id)) {
    errors.push(`${resource.id} must remain outside every continuous radio station queue.`);
  }
}

if (errors.length) {
  console.error(`Ravenhill Radio link contract failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Ravenhill Radio link contract passed: ${ravenhillResources.length} source-linked sermons remain outside station playback.`);
