import { createHash } from "node:crypto";
import { basename } from "node:path";
import { promisify } from "node:util";
import { gzip } from "node:zlib";
import { curateLibraryEntry } from "@/lib/library-curation";
import { loadLibraryManifestEntries } from "@/lib/library-manifest";

export const runtime = "nodejs";

const gzipAsync = promisify(gzip);
const CACHE_CONTROL = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";
const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 100;
const MAX_QUERY_LENGTH = 120;

const DISCOVERY_FILTER_TERMS: Record<string, string[]> = {
  Commentaries: ["commentary", "commentaries", "exposition", "expository"],
  "Dictionaries / Helps": ["dictionary", "dictionaries", "encyclopedia", "topical", "handbook", "survey", "cross references", "study helps", "bible study"],
  Prayer: ["prayer", "pray", "intercession"],
  "Preaching & Teaching": ["preaching", "teaching", "sermon", "lesson", "illustration"],
  "Baptist History": ["baptist history", "baptist", "church history"],
  Missions: ["missions", "missionary", "mission"],
  "KJV / Textual Issues": ["kjv", "king james", "authorized", "textual", "scripture"],
};

const STUDY_HELP_TERMS = ["commentary", "dictionary", "encyclopedia", "topical", "handbook", "survey", "cross references"];

type LibraryCatalogResource = ReturnType<typeof curateLibraryEntry> & { slug: string };

type LibraryCatalogPayload = {
  json: string;
  gzip: Buffer;
  etag: string;
};

type LibraryCatalogData = {
  resources: LibraryCatalogResource[];
  payload: LibraryCatalogPayload;
  totals: {
    resources: number;
    authors: number;
    categories: number;
    words: number;
  };
};

let catalogDataPromise: Promise<LibraryCatalogData> | null = null;

function slugFromPath(filePath: string) {
  return basename(filePath, ".txt");
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function searchableResourceText(resource: LibraryCatalogResource) {
  return normalizeSearchText([
    resource.title,
    resource.author,
    resource.category,
    resource.collection,
    resource.original_category ?? "",
    resource.description,
    resource.perspective_notes,
    resource.recommended_use,
    resource.publisher ?? "",
    ...resource.resource_labels,
    ...resource.resource_warnings,
  ].join(" "));
}

function resourceSearchScore(resource: LibraryCatalogResource, normalizedQuery: string) {
  if (!normalizedQuery) return 0;
  const title = normalizeSearchText(resource.title);
  const author = normalizeSearchText(resource.author);
  const category = normalizeSearchText(resource.category);
  if (title === normalizedQuery) return 500;
  if (author === normalizedQuery) return 450;
  if (title.startsWith(normalizedQuery)) return 400;
  if (author.startsWith(normalizedQuery)) return 350;
  if (title.includes(normalizedQuery)) return 300;
  if (author.includes(normalizedQuery)) return 250;
  if (category === normalizedQuery) return 200;
  return 100;
}

function resourceMatchesDiscoveryFilter(resource: LibraryCatalogResource, filter: string) {
  if (!filter || filter === "All") return true;
  const haystack = searchableResourceText(resource);
  if (filter === "Books") return !STUDY_HELP_TERMS.some((term) => haystack.includes(term));
  return (DISCOVERY_FILTER_TERMS[filter] ?? []).some((term) => haystack.includes(term));
}

function parsePositiveInteger(value: string | null, fallback: number, maximum?: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return maximum ? Math.min(parsed, maximum) : parsed;
}

async function createPayload(body: unknown): Promise<LibraryCatalogPayload> {
  const json = JSON.stringify(body);
  return {
    json,
    gzip: await gzipAsync(json, { level: 9 }),
    etag: `W/"${createHash("sha256").update(json).digest("hex")}"`,
  };
}

async function loadCatalogData() {
  catalogDataPromise ??= loadLibraryManifestEntries()
    .then(async (entries) => {
      const resources = entries.map((entry) => ({
        ...curateLibraryEntry(entry),
        slug: slugFromPath(entry.file_path),
      }));

      return {
        resources,
        payload: await createPayload({ resources }),
        totals: {
          resources: resources.length,
          authors: new Set(resources.map((resource) => resource.author.trim()).filter(Boolean)).size,
          categories: new Set(resources.map((resource) => resource.category)).size,
          words: resources.reduce((total, resource) => total + (resource.word_count ?? 0), 0),
        },
      };
    })
    .catch((error) => {
      catalogDataPromise = null;
      throw error;
    });

  return catalogDataPromise;
}

function responseHeaders(payload: LibraryCatalogPayload) {
  return new Headers({
    "Cache-Control": CACHE_CONTROL,
    "Content-Type": "application/json; charset=utf-8",
    ETag: payload.etag,
    Vary: "Accept-Encoding",
  });
}

function payloadResponse(request: Request, payload: LibraryCatalogPayload, extraHeaders?: Record<string, string>) {
  const headers = responseHeaders(payload);
  for (const [name, value] of Object.entries(extraHeaders ?? {})) headers.set(name, value);

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

function paginatedRequest(searchParams: URLSearchParams) {
  return ["q", "query", "category", "filter", "page", "limit"].some((name) => searchParams.has(name));
}

async function paginatedCatalogPayload(searchParams: URLSearchParams, data: LibraryCatalogData) {
  const query = (searchParams.get("q") ?? searchParams.get("query") ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  const normalizedQuery = normalizeSearchText(query);
  const terms = normalizedQuery.split(/\s+/).filter(Boolean).slice(0, 10);
  const category = (searchParams.get("category") ?? "").trim();
  const normalizedCategory = normalizeSearchText(category);
  const discoveryFilter = (searchParams.get("filter") ?? "").trim();
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const limit = parsePositiveInteger(searchParams.get("limit"), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

  const matches = data.resources
    .filter((resource) => !normalizedCategory || normalizeSearchText(resource.category) === normalizedCategory)
    .filter((resource) => resourceMatchesDiscoveryFilter(resource, discoveryFilter))
    .filter((resource) => {
      if (!terms.length) return true;
      const haystack = searchableResourceText(resource);
      return terms.every((term) => haystack.includes(term));
    })
    .sort((a, b) => {
      const scoreDifference = resourceSearchScore(b, normalizedQuery) - resourceSearchScore(a, normalizedQuery);
      return scoreDifference || a.title.localeCompare(b.title) || a.author.localeCompare(b.author) || a.slug.localeCompare(b.slug);
    });

  const total = matches.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const resources = matches.slice(start, start + limit);
  const categoryCounts = new Map<string, number>();
  const authorCounts = new Map<string, number>();

  for (const resource of matches) {
    categoryCounts.set(resource.category, (categoryCounts.get(resource.category) ?? 0) + 1);
    authorCounts.set(resource.author, (authorCounts.get(resource.author) ?? 0) + 1);
  }

  const body = {
    resources,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1 && totalPages > 0,
    },
    filters: { query, category, discovery: discoveryFilter },
    facets: {
      categories: [...categoryCounts.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)),
      authors: [...authorCounts.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
        .slice(0, 25),
    },
    totals: data.totals,
  };

  return { payload: await createPayload(body), total };
}

export async function GET(request: Request) {
  const data = await loadCatalogData();
  const { searchParams } = new URL(request.url);

  if (!paginatedRequest(searchParams)) {
    return payloadResponse(request, data.payload);
  }

  const { payload, total } = await paginatedCatalogPayload(searchParams, data);
  return payloadResponse(request, payload, { "X-Total-Count": String(total) });
}
