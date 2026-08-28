import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const route = await readFile(path.join(root, "src", "app", "api", "audio", "premium-preview", "route.ts"), "utf8");
const app = await readFile(path.join(root, "src", "app", "page.tsx"), "utf8");

const requiredRouteChecks = [
  'env("PREMIUM_TTS_ADMIN_TOKEN")',
  'env("OPENAI_API_KEY")',
  'request.headers.get("x-admin-premium-voice-token")',
  "timingSafeEqual",
  "HARD_MAX_CHARACTERS",
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
  "Check readiness",
  "rightsConfirmed",
  "voiceConsentConfirmed",
  "aiDisclosureConfirmed",
  "private and not stored by the app",
];

for (const check of requiredAppChecks) {
  if (!app.includes(check)) throw new Error(`Premium narration admin workflow is missing: ${check}`);
}

console.log("PASS premium narration API: server-only credentials, bounded requests, production endpoint lock, and no-store audio.");
console.log("PASS premium narration UI: admin readiness, text rights, custom voice consent, and AI disclosure gates are present.");
