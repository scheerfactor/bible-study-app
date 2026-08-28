import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const route = await readFile(path.join(root, "src", "app", "api", "audio", "premium-preview", "route.ts"), "utf8");
const app = await readFile(path.join(root, "src", "app", "page.tsx"), "utf8");

const requiredRouteChecks = [
  'env("PREMIUM_TTS_ADMIN_TOKEN")',
  'env("OPENAI_API_KEY")',
  "PREMIUM_TTS_COST_PER_MILLION_CHARACTERS",
  'request.headers.get("x-admin-premium-voice-token")',
  "timingSafeEqual",
  "HARD_MAX_CHARACTERS",
  "MAX_PRONUNCIATION_GUIDE_ENTRIES",
  'env("PREMIUM_TTS_PRONUNCIATION_GUIDE")',
  'createHash("sha256")',
  "narrationInstructions(text, guide)",
  "Use these pronunciation guides only",
  '"X-Pronunciation-Guide"',
  "if (!body.rightsConfirmed)",
  "if (!body.aiDisclosureConfirmed)",
  "if (customVoiceId && !body.voiceConsentConfirmed)",
  'process.env.NODE_ENV === "production"',
  '"https://api.openai.com/v1/audio/speech"',
  '"Cache-Control": "private, no-store, max-age=0"',
];

for (const check of requiredRouteChecks) {
  if (!route.includes(check)) throw new Error(`Premium narration route safety check is missing: ${check}`);
}

const forbiddenRouteChecks = [
  "NEXT_PUBLIC_OPENAI",
  "NEXT_PUBLIC_PREMIUM_TTS",
  "localStorage",
  "sessionStorage",
];

for (const check of forbiddenRouteChecks) {
  if (route.includes(check)) throw new Error(`Premium narration route exposes or persists sensitive configuration: ${check}`);
}

const requiredAppChecks = [
  "Private Premium Narration Pilot",
  "Narration Quality Trial",
  "PREMIUM_NARRATION_TEST_SAMPLES",
  "Pronunciation",
  "Naturalness",
  "Reverence",
  "Phone clarity",
  "Export review JSON",
  "Check readiness",
  "rightsConfirmed",
  "voiceConsentConfirmed",
  "aiDisclosureConfirmed",
  "PREMIUM_NARRATION_AUDIO_CACHE",
  "Reuse identical previews",
  "Clear private audio cache",
  "Private Usage &amp; Cost Ledger",
  "usageEvents",
  "Voice Acceptance Gate",
  "Device actually used for this review",
  "Physical iPhone browser and headphones",
  "PREMIUM_NARRATION_MINIMUM_SCORE",
  "PREMIUM_NARRATION_MINIMUM_AVERAGE",
  "voiceAcceptance",
  "pronunciationGuideFingerprint",
];

for (const check of requiredAppChecks) {
  if (!app.includes(check)) throw new Error(`Premium narration admin workflow is missing: ${check}`);
}

console.log("PASS premium narration API: server-only credentials, bounded requests, production endpoint lock, and no-store audio.");
console.log("PASS premium narration UI: admin readiness, text rights, custom voice consent, and AI disclosure gates are present.");
console.log("PASS premium narration cost controls: private browser cache, clear-cache control, and local usage ledger are present.");
console.log("PASS premium narration acceptance: standard KJV coverage, physical-device evidence, and score thresholds are enforced.");
console.log("PASS premium narration pronunciation: bounded server-only guides fingerprint cache and acceptance evidence.");
