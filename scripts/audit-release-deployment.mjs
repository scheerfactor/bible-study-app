const LIVE_BETA_URL = "https://study.fathersbusinessmasteryresources.com/";
const BRAND_MARK_PATH = "/brand/fathers-business-bible-study-mark.png";
const COMING_SOON_PATH = "/coming-soon";
const useLiveBeta = process.argv.includes("--live");
const baseUrl = new URL(
  process.env.RELEASE_AUDIT_BASE_URL ?? (useLiveBeta ? LIVE_BETA_URL : "http://127.0.0.1:3000/"),
);

const failures = [];

function fail(message) {
  failures.push(message);
}

async function fetchReleasePath(pathname) {
  const url = new URL(pathname, baseUrl);
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(60_000),
  });

  return { response, url };
}

const { response } = await fetchReleasePath("/?open=settings");

if (!response.ok) {
  throw new Error(`Release deployment audit failed: ${baseUrl.origin} returned HTTP ${response.status}.`);
}

const html = await response.text();
if (!/Father(?:'|&#x27;)s Business Bible Study/.test(html)) {
  fail(`${baseUrl.origin} is not serving the Father's Business Bible Study app.`);
}

const { response: brandResponse, url: brandUrl } = await fetchReleasePath(BRAND_MARK_PATH);
if (!brandResponse.ok) {
  fail(`${brandUrl.href} returned HTTP ${brandResponse.status}; the public logo asset was not deployed.`);
} else {
  const brandContentType = brandResponse.headers.get("content-type") ?? "";
  const brandBytes = (await brandResponse.arrayBuffer()).byteLength;
  if (!brandContentType.startsWith("image/")) {
    fail(`${brandUrl.href} returned ${brandContentType || "an unknown content type"}, not an image.`);
  }
  if (brandBytes < 1_000) {
    fail(`${brandUrl.href} returned only ${brandBytes} bytes; the logo asset appears incomplete.`);
  }
}

const { response: comingSoonResponse, url: comingSoonUrl } = await fetchReleasePath(COMING_SOON_PATH);
if (!comingSoonResponse.ok) {
  fail(`${comingSoonUrl.href} returned HTTP ${comingSoonResponse.status}.`);
}
const comingSoonHtml = comingSoonResponse.ok ? await comingSoonResponse.text() : "";
for (const [label, marker] of [
  ["founding-beta launch target", "Founding free public beta"],
  ["supporter-interest path", "Support the work"],
  ["current launch-page logo", BRAND_MARK_PATH],
]) {
  if (!comingSoonHtml.includes(marker)) {
    fail(`${comingSoonUrl.href} is missing the ${label} marker.`);
  }
}

const scriptPaths = [...html.matchAll(/<script[^>]+src=["']([^"']+\.js(?:\?[^"']*)?)["']/g)]
  .map((match) => match[1]);
const uniqueScriptUrls = [...new Set(scriptPaths.map((scriptPath) => new URL(scriptPath, baseUrl).href))];

if (uniqueScriptUrls.length === 0) {
  throw new Error("Release deployment audit failed: the page did not expose any JavaScript chunks to inspect.");
}

const scriptResponses = await Promise.all(uniqueScriptUrls.map(async (scriptUrl) => {
  const scriptResponse = await fetch(scriptUrl, { signal: AbortSignal.timeout(60_000) });
  if (!scriptResponse.ok) {
    throw new Error(`Release deployment audit failed: ${scriptUrl} returned HTTP ${scriptResponse.status}.`);
  }
  return scriptResponse.text();
}));
const bundle = `${html}\n${scriptResponses.join("\n")}`;

if (!bundle.includes(BRAND_MARK_PATH)) {
  fail(`${baseUrl.origin} is missing the current header logo code. The deployed app may be behind the approved release commit.`);
}

for (const [label, marker] of [
  ["configured Supabase status", "Supabase configured. Sign in with email."],
  ["account-scoped browser storage", ":account:"],
  ["signed-out isolation status", "Signed out. Local study data is active."],
]) {
  if (!bundle.includes(marker)) {
    fail(`${baseUrl.origin} is missing the ${label} marker.`);
  }
}

const safeRedirect = /emailRedirectTo:\s*`\$\{window\.location\.origin\}\/\?open=settings`/;
if (!safeRedirect.test(bundle)) {
  fail(`${baseUrl.origin} does not send magic-link users to the public Settings screen.`);
}

if (failures.length > 0) {
  throw new Error(`Release deployment audit failed:\n- ${failures.join("\n- ")}`);
}

console.log(`PASS release identity: ${baseUrl.origin} serves Father's Business Bible Study.`);
console.log(`PASS release branding: the header and launch page use ${BRAND_MARK_PATH}.`);
console.log("PASS release launch surface: the founding-beta target and supporter-interest path are public.");
console.log(`PASS release assets: ${uniqueScriptUrls.length} JavaScript chunks loaded successfully.`);
console.log("PASS release auth: Supabase is configured and magic links return to Settings.");
console.log("PASS release isolation: signed-in study data uses account-scoped browser storage.");
