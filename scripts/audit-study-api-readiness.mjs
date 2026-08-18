const LIVE_BETA_URL = "https://bible-study-app-eight.vercel.app/";
const useLiveBeta = process.argv.includes("--live");
const baseUrl = new URL(
  process.env.STUDY_API_AUDIT_BASE_URL ?? (useLiveBeta ? LIVE_BETA_URL : "http://127.0.0.1:3000/"),
);

const probes = [
  {
    label: "Webster lookup",
    path: "/api/dictionary/believeth",
    validate(data) {
      return data?.found === true && data?.lookupWord === "believe" && data?.entries?.length > 0;
    },
    summary(data) {
      return `${data.entries.length} entries for ${data.lookupWord}`;
    },
  },
  {
    label: "Strong's lexicon",
    path: "/api/strongs?query=G25&limit=5",
    validate(data) {
      return data?.entries?.some((entry) => entry.strongs_number === "G25");
    },
    summary(data) {
      return `${data.entries.length} entries; G25 found`;
    },
  },
  {
    label: "Strong's verse mapping",
    path: "/api/strongs?verse=John%203%3A16",
    validate(data) {
      return data?.mapping_source === "chapter-shard" && data?.mappings?.length > 0;
    },
    summary(data) {
      return `${data.mappings.length} reviewed John 3:16 mappings`;
    },
  },
  {
    label: "Commentary catalog",
    path: "/api/commentary/catalog",
    validate(data) {
      const john = data?.books?.find((entry) => entry.book === "John");
      return data?.rowCount > 0 && data?.chapterCount > 0 && john?.chapters?.includes(3);
    },
    summary(data) {
      return `${data.rowCount} rows across ${data.chapterCount} chapters`;
    },
  },
  {
    label: "Commentary chapter",
    path: "/api/commentary/chapter/John/3",
    validate(data) {
      return Array.isArray(data) && data.length > 0;
    },
    summary(data) {
      return `${data.length} public John 3 entries`;
    },
  },
  {
    label: "Library catalog",
    path: "/api/library",
    validate(data) {
      return data?.resources?.length > 0;
    },
    summary(data) {
      return `${data.resources.length} public resources`;
    },
  },
  {
    label: "Library paginated search",
    path: "/api/library?q=Spurgeon&category=Evangelism&page=1&limit=5",
    validate(data) {
      return data?.resources?.length > 0 &&
        data.resources.length <= 5 &&
        data?.resources?.every((resource) => resource.category === "Evangelism") &&
        data?.pagination?.page === 1 &&
        data?.pagination?.limit === 5 &&
        data?.pagination?.total >= data.resources.length &&
        data?.filters?.query === "Spurgeon" &&
        data?.facets?.categories?.some((entry) => entry.value === "Evangelism") &&
        data?.totals?.resources > data.pagination.total;
    },
    summary(data) {
      return `${data.resources.length} of ${data.pagination.total} matching resources; ${data.pagination.totalPages} pages`;
    },
  },
  {
    label: "Library discovery filter",
    path: "/api/library?filter=Prayer&page=1&limit=5",
    validate(data) {
      return data?.resources?.length > 0 &&
        data.resources.length <= 5 &&
        data?.filters?.discovery === "Prayer" &&
        data?.pagination?.page === 1 &&
        data?.pagination?.limit === 5 &&
        data?.pagination?.total >= data.resources.length &&
        data.resources.every((resource) => /pray|intercession/i.test(JSON.stringify(resource)));
    },
    summary(data) {
      return `${data.resources.length} of ${data.pagination.total} prayer resources`;
    },
  },
  {
    label: "Study-tool search",
    path: "/api/study-tools?query=prayer&limit=10",
    validate(data) {
      return data?.entries?.length > 0;
    },
    summary(data) {
      return `${data.entries.length} results for prayer`;
    },
  },
];

const results = await Promise.all(probes.map(async (probe) => {
  const url = new URL(probe.path, baseUrl);
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(60_000),
    });
    const elapsedMs = Math.round(performance.now() - startedAt);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false,
        label: probe.label,
        message: `${probe.path} returned HTTP ${response.status}${data?.error ? `: ${data.error}` : ""}`,
      };
    }
    if (!probe.validate(data)) {
      return {
        ok: false,
        label: probe.label,
        message: `${probe.path} returned an incomplete study-data response.`,
      };
    }

    return {
      ok: true,
      label: probe.label,
      message: `${probe.summary(data)} (${elapsedMs} ms)`,
    };
  } catch (error) {
    return {
      ok: false,
      label: probe.label,
      message: `${probe.path} could not be checked: ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }
}));

for (const result of results) {
  console.log(`${result.ok ? "PASS" : "FAIL"} ${result.label}: ${result.message}`);
}

const failures = results.filter((result) => !result.ok);
if (failures.length > 0) {
  throw new Error(`Study API readiness audit failed for ${failures.length} of ${results.length} endpoints at ${baseUrl.origin}.`);
}

console.log(`Study API readiness audit passed for ${baseUrl.origin}.`);
