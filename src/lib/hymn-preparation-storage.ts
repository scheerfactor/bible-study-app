export type HymnPreviewVoice = "melody" | "full";
export type HymnPreviewTempo = "slow" | "normal";

export type HymnPreparation = {
  previewVoice: HymnPreviewVoice;
  previewTempo: HymnPreviewTempo;
  stanzaIndexes: number[];
  includeRefrain: boolean;
};

export type HymnPreparationCatalogEntry = {
  id: string;
  stanzaCount: number;
  hasRefrain: boolean;
};

export const HYMN_PREPARATIONS_STORAGE_KEY = "fathers-business-hymn-preparations-v1";
export const HYMN_SERVICE_SET_STORAGE_KEY = "fathers-business-hymn-service-set-v1";
export const MAX_SERVICE_SET_HYMNS = 30;

export function defaultHymnPreparation(hymn: HymnPreparationCatalogEntry): HymnPreparation {
  return {
    previewVoice: "melody",
    previewTempo: "normal",
    stanzaIndexes: hymn.stanzaCount ? [0] : [],
    includeRefrain: hymn.hasRefrain,
  };
}

export function normalizeHymnPreparations(value: unknown, catalog: HymnPreparationCatalogEntry[]): Record<string, HymnPreparation> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const stored = value as Record<string, Partial<HymnPreparation>>;
  return Object.fromEntries(catalog.flatMap((hymn) => {
    const preparation = stored[hymn.id];
    if (!preparation || typeof preparation !== "object" || Array.isArray(preparation)) return [];
    const stanzaIndexes = Array.isArray(preparation.stanzaIndexes)
      ? [...new Set(preparation.stanzaIndexes.filter((index) => Number.isInteger(index) && index >= 0 && index < hymn.stanzaCount))].sort((left, right) => left - right)
      : defaultHymnPreparation(hymn).stanzaIndexes;
    return [[hymn.id, {
      previewVoice: preparation.previewVoice === "full" ? "full" : "melody",
      previewTempo: preparation.previewTempo === "slow" ? "slow" : "normal",
      stanzaIndexes,
      includeRefrain: Boolean(hymn.hasRefrain && preparation.includeRefrain),
    } satisfies HymnPreparation]];
  }));
}

export function normalizeHymnServiceSet(value: unknown, catalog: HymnPreparationCatalogEntry[]): string[] {
  if (!Array.isArray(value)) return [];
  const knownHymnIds = new Set(catalog.map((hymn) => hymn.id));
  return [...new Set(value.filter((id): id is string => typeof id === "string" && knownHymnIds.has(id)))].slice(0, MAX_SERVICE_SET_HYMNS);
}

function loadStoredJson(key: string, fallback: unknown): unknown {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? JSON.stringify(fallback)) as unknown;
  } catch {
    return fallback;
  }
}

export function loadHymnPreparations(catalog: HymnPreparationCatalogEntry[]): Record<string, HymnPreparation> {
  return normalizeHymnPreparations(loadStoredJson(HYMN_PREPARATIONS_STORAGE_KEY, {}), catalog);
}

export function loadHymnServiceSet(catalog: HymnPreparationCatalogEntry[]): string[] {
  return normalizeHymnServiceSet(loadStoredJson(HYMN_SERVICE_SET_STORAGE_KEY, []), catalog);
}

export function storeHymnPreparations(preparations: Record<string, HymnPreparation>) {
  if (typeof window === "undefined") return;
  if (Object.keys(preparations).length) {
    window.localStorage.setItem(HYMN_PREPARATIONS_STORAGE_KEY, JSON.stringify(preparations));
  } else {
    window.localStorage.removeItem(HYMN_PREPARATIONS_STORAGE_KEY);
  }
}

export function storeHymnServiceSet(hymnIds: string[]) {
  if (typeof window === "undefined") return;
  if (hymnIds.length) {
    window.localStorage.setItem(HYMN_SERVICE_SET_STORAGE_KEY, JSON.stringify(hymnIds));
  } else {
    window.localStorage.removeItem(HYMN_SERVICE_SET_STORAGE_KEY);
  }
}
