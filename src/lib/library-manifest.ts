import type { LibraryManifestEntry } from "@/lib/library-curation";
import { readTextContent } from "@/lib/server-content-storage";

const manifestRelativePath = ["data", "library", "manifests", "curated-public-domain-resources.json"];
let manifestPromise: Promise<LibraryManifestEntry[]> | null = null;

export async function loadLibraryManifestEntries() {
  manifestPromise ??= readTextContent(manifestRelativePath, { errorLabel: "Library manifest" })
    .then((raw) => JSON.parse(raw) as LibraryManifestEntry[])
    .catch((error) => {
      manifestPromise = null;
      throw error;
    });
  return manifestPromise;
}
