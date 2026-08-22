const LIVE_BETA_URL = "https://bible-study-app-eight.vercel.app/";
const useLiveBeta = process.argv.includes("--live");
const baseUrl = new URL(
  process.env.RELEASE_AUDIT_BASE_URL ?? (useLiveBeta ? LIVE_BETA_URL : "http://127.0.0.1:3000/"),
);

const failures = [];

function fail(message) {
  failures.push(message);
}

const response = await fetch(new URL("/?open=settings", baseUrl), {
  redirect: "follow",
  signal: AbortSignal.timeout(60_000),
});

if (!response.ok) {
  throw new Error(`Release deployment audit failed: ${baseUrl.origin} returned HTTP ${response.status}.`);
}

const html = await response.text();
if (!/Father(?:'|&#x27;)s Business Bible Study/.test(html)) {
  fail(`${baseUrl.origin} is not serving the Father's Business Bible Study app.`);
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
console.log(`PASS release assets: ${uniqueScriptUrls.length} JavaScript chunks loaded successfully.`);
console.log("PASS release auth: Supabase is configured and magic links return to Settings.");
console.log("PASS release isolation: signed-in study data uses account-scoped browser storage.");
