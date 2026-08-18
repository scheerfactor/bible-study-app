import { createHash } from "node:crypto";
import { basename } from "node:path";
import { promisify } from "node:util";
import { gzip } from "node:zlib";
import { curateLibraryEntry } from "@/lib/library-curation";
import { loadLibraryManifestEntries } from "@/lib/library-manifest";

export const runtime = "nodejs";

const gzipAsync = promisify(gzip);
const CACHE_CONTROL = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

type LibraryCatalogPayload = {
  json: string;
  gzip: Buffer;
  etag: string;
};

let catalogPayloadPromise: Promise<LibraryCatalogPayload> | null = null;

function slugFromPath(filePath: string) {
  return basename(filePath, ".txt");
}

async function loadCatalogPayload() {
  catalogPayloadPromise ??= loadLibraryManifestEntries()
    .then(async (entries) => {
      const json = JSON.stringify({
        resources: entries.map((entry) => ({
          ...curateLibraryEntry(entry),
          slug: slugFromPath(entry.file_path),
        })),
      });

      return {
        json,
        gzip: await gzipAsync(json, { level: 9 }),
        etag: `W/"${createHash("sha256").update(json).digest("hex")}"`,
      };
    })
    .catch((error) => {
      catalogPayloadPromise = null;
      throw error;
    });

  return catalogPayloadPromise;
}

function responseHeaders(payload: LibraryCatalogPayload) {
  return new Headers({
    "Cache-Control": CACHE_CONTROL,
    "Content-Type": "application/json; charset=utf-8",
    ETag: payload.etag,
    Vary: "Accept-Encoding",
  });
}

export async function GET(request: Request) {
  const payload = await loadCatalogPayload();
  const headers = responseHeaders(payload);

  if (request.headers.get("if-none-match") === payload.etag) {
    return new Response(null, { status: 304, headers });
  }

  if (/\bgzip\b/i.test(request.headers.get("accept-encoding") ?? "")) {
    headers.set("Content-Encoding", "gzip");
    headers.set("Content-Length", String(payload.gzip.byteLength));
    return new Response(new Uint8Array(payload.gzip), { headers });
  }

  headers.set("Content-Length", String(Buffer.byteLength(payload.json)));
  return new Response(payload.json, { headers });
}
