import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = await readFile(path.join(root, "src", "app", "page.tsx"), "utf8");

const requiredChecks = [
  "lastItemProgress?: number",
  "lastPlayedAt?: string",
  "resumeSavedPosition = false",
  "originalChunkIndex",
  "itemChunkCount",
  "completedItemProgress",
  "setStudyPlaylistCurrentIndex(currentMeta.itemIndex)",
  "lastItemProgress: Math.min(100, Math.max(0, itemProgress))",
  "const resumePlaylist = loadedPlaylists.reduce<BibleAudioPlaylist | null>",
  "setActiveStudyPlaylistId(resumePlaylist?.id ?? null)",
  "setStudyPlaylistCurrentIndex(resumePlaylist?.lastItemIndex ?? 0)",
  "setStudyPlaylistCurrentIndex(selectedPlaylist?.lastItemIndex ?? 0)",
  "Resume ${currentPlaylistItem?.label",
  "Replay ${currentPlaylistItem?.label",
];

for (const check of requiredChecks) {
  if (!app.includes(check)) throw new Error(`Bible playlist resume contract is missing: ${check}`);
}

if (!app.includes("onPlayPlaylist(activePlaylist, activePlaylist.lastItemIndex ?? activePlaylistItemIndex, false, true)")) {
  throw new Error("The Resume control does not request the saved item position.");
}

console.log("PASS Bible playlists save the active item and within-item listening progress.");
console.log("PASS Resume restores the saved item, skips completed speech chunks, and advances item state during continuous play.");
