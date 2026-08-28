import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type RightsBasis = "Public Domain" | "Owned by ministry" | "Written permission";

type PremiumNarrationRequest = {
  text?: string;
  voiceKey?: string;
  rightsBasis?: RightsBasis;
  rightsConfirmed?: boolean;
  voiceConsentConfirmed?: boolean;
  aiDisclosureConfirmed?: boolean;
};

type VoiceOption = {
  key: string;
  label: string;
  type: "built-in" | "custom";
};

type PronunciationGuideEntry = {
  term: string;
  pronunciation: string;
};

const BUILT_IN_VOICES: VoiceOption[] = [
  { key: "marin", label: "Marin", type: "built-in" },
  { key: "cedar", label: "Cedar", type: "built-in" },
  { key: "onyx", label: "Onyx", type: "built-in" },
  { key: "sage", label: "Sage", type: "built-in" },
];
const RIGHTS_BASES = new Set<RightsBasis>(["Public Domain", "Owned by ministry", "Written permission"]);
const DEFAULT_MAX_CHARACTERS = 800;
const HARD_MAX_CHARACTERS = 2000;
const MAX_PRONUNCIATION_GUIDE_ENTRIES = 32;

function env(name: string) {
  return process.env[name]?.trim() ?? "";
}

function jsonError(error: string, status: number, details?: Record<string, unknown>) {
  return NextResponse.json({ error, ...details }, { status, headers: { "Cache-Control": "no-store" } });
}

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function configuredMaxCharacters() {
  const configured = Number(process.env.PREMIUM_TTS_MAX_CHARACTERS ?? DEFAULT_MAX_CHARACTERS);
  if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_MAX_CHARACTERS;
  return Math.min(Math.floor(configured), HARD_MAX_CHARACTERS);
}

function configuredCostPerMillionCharacters() {
  const configured = Number(process.env.PREMIUM_TTS_COST_PER_MILLION_CHARACTERS);
  return Number.isFinite(configured) && configured > 0 ? configured : null;
}

function pronunciationGuide(): PronunciationGuideEntry[] {
  const configured = env("PREMIUM_TTS_PRONUNCIATION_GUIDE");
  if (!configured) return [];
  return configured
    .split(";")
    .map((entry) => {
      const separator = entry.indexOf("=");
      if (separator < 1) return null;
      const term = entry.slice(0, separator).trim();
      const pronunciation = entry.slice(separator + 1).trim();
      if (!/^[A-Za-z][A-Za-z' -]{1,48}$/.test(term) || !/^[A-Za-z][A-Za-z' .-]{1,80}$/.test(pronunciation)) return null;
      return { term, pronunciation };
    })
    .filter((entry): entry is PronunciationGuideEntry => Boolean(entry))
    .slice(0, MAX_PRONUNCIATION_GUIDE_ENTRIES);
}

function pronunciationGuideFingerprint(entries = pronunciationGuide()) {
  if (!entries.length) return "none";
  return createHash("sha256").update(JSON.stringify(entries)).digest("hex").slice(0, 12);
}

function narrationInstructions(text: string, entries = pronunciationGuide()) {
  const relevantEntries = entries.filter((entry) => text.toLowerCase().includes(entry.term.toLowerCase()));
  const exactTextRule = "Read the supplied text exactly as written in a natural, reverent, warm teaching voice. Do not add, remove, paraphrase, or explain any words.";
  if (!relevantEntries.length) return exactTextRule;
  const guides = relevantEntries.map((entry) => `${entry.term}: ${entry.pronunciation}`).join("; ");
  return `${exactTextRule} Use these pronunciation guides only when the named word appears: ${guides}. The guides are silent instructions and must not be spoken.`;
}

function customVoices() {
  const configured = env("PREMIUM_TTS_CUSTOM_VOICES");
  if (!configured) return new Map<string, string>();
  return new Map(
    configured
      .split(",")
      .map((entry) => entry.split("=").map((part) => part.trim()))
      .filter(([label, id]) => Boolean(label && id && /^voice_[A-Za-z0-9_-]+$/.test(id)))
      .map(([label, id]) => [`custom:${label}`, id]),
  );
}

function safeVoiceOptions(): VoiceOption[] {
  return [
    ...BUILT_IN_VOICES,
    ...Array.from(customVoices().keys()).map((key) => ({
      key,
      label: key.replace(/^custom:/, ""),
      type: "custom" as const,
    })),
  ];
}

function requiredAdminToken(request: NextRequest) {
  const requiredToken = env("PREMIUM_TTS_ADMIN_TOKEN");
  const providedToken = request.headers.get("x-admin-premium-voice-token")?.trim() ?? "";
  if (!requiredToken) return jsonError("Premium narration is not configured on this server.", 503, { missing: ["PREMIUM_TTS_ADMIN_TOKEN"] });
  if (!providedToken || !secureEquals(providedToken, requiredToken)) return jsonError("Admin premium-voice token is required.", 401);
  return null;
}

export async function GET(request: NextRequest) {
  const authError = requiredAdminToken(request);
  if (authError) return authError;

  const guide = pronunciationGuide();
  return NextResponse.json({
    configured: Boolean(env("OPENAI_API_KEY")),
    provider: "OpenAI",
    model: env("PREMIUM_TTS_MODEL") || "gpt-4o-mini-tts",
    maxCharacters: configuredMaxCharacters(),
    costPerMillionCharacters: configuredCostPerMillionCharacters(),
    voices: safeVoiceOptions(),
    customVoiceEligibilityRequired: customVoices().size > 0,
    pronunciationGuideEntries: guide.length,
    pronunciationGuideFingerprint: pronunciationGuideFingerprint(guide),
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const authError = requiredAdminToken(request);
  if (authError) return authError;

  const apiKey = env("OPENAI_API_KEY");
  if (!apiKey) return jsonError("OpenAI premium narration is not configured on this server.", 503, { missing: ["OPENAI_API_KEY"] });

  let body: PremiumNarrationRequest;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const text = String(body.text ?? "").trim();
  const voiceKey = String(body.voiceKey ?? "").trim();
  const rightsBasis = body.rightsBasis;
  const maxCharacters = configuredMaxCharacters();
  if (!text) return jsonError("Preview text is required.", 400);
  if (text.length > maxCharacters) return jsonError(`Preview text must be ${maxCharacters} characters or fewer.`, 413, { maxCharacters });
  if (!rightsBasis || !RIGHTS_BASES.has(rightsBasis)) return jsonError("Choose a valid rights basis for this text.", 400);
  if (!body.rightsConfirmed) return jsonError("Confirm the text rights before generating audio.", 403);
  if (!body.aiDisclosureConfirmed) return jsonError("Confirm that generated narration will be identified as AI audio.", 403);

  const builtInVoice = BUILT_IN_VOICES.find((voice) => voice.key === voiceKey);
  const customVoiceId = customVoices().get(voiceKey);
  if (!builtInVoice && !customVoiceId) return jsonError("Choose an approved premium voice.", 400);
  if (customVoiceId && !body.voiceConsentConfirmed) {
    return jsonError("Custom voice previews require recorded speaker consent.", 403);
  }

  const model = env("PREMIUM_TTS_MODEL") || "gpt-4o-mini-tts";
  const guide = pronunciationGuide();
  let upstream: Response;
  try {
    const endpoint = process.env.NODE_ENV === "production"
      ? "https://api.openai.com/v1/audio/speech"
      : env("PREMIUM_TTS_API_BASE_URL") || "https://api.openai.com/v1/audio/speech";
    upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        voice: customVoiceId ? { id: customVoiceId } : builtInVoice?.key,
        input: text,
        instructions: narrationInstructions(text, guide),
        response_format: "mp3",
      }),
      cache: "no-store",
    });
  } catch {
    return jsonError("The premium voice provider could not be reached.", 502);
  }

  if (!upstream.ok) {
    const requestId = upstream.headers.get("x-request-id") ?? undefined;
    return jsonError("The premium voice provider could not generate this preview.", upstream.status >= 500 ? 502 : 400, requestId ? { requestId } : undefined);
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": "inline; filename=private-premium-narration-preview.mp3",
      "Content-Type": upstream.headers.get("content-type") || "audio/mpeg",
      "X-Narration-Provider": "OpenAI",
      "X-Narration-Voice-Type": customVoiceId ? "custom-consented" : "built-in",
      "X-Rights-Basis": rightsBasis,
      "X-Pronunciation-Guide": pronunciationGuideFingerprint(guide),
    },
  });
}
