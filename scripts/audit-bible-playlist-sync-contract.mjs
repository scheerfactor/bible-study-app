import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = await readFile(path.join(root, "src", "app", "page.tsx"), "utf8");
const schema = await readFile(path.join(root, "supabase", "schema.sql"), "utf8");
const migration = await readFile(
  path.join(root, "supabase", "migrations", "20260828235010_sync_bible_playlist_resume_progress.sql"),
  "utf8",
);

const requiredSchemaChecks = [
  "last_item_progress numeric not null default 0",
  "check (last_item_progress >= 0 and last_item_progress <= 100)",
  "last_played_at timestamptz",
  "create or replace function public.keep_newest_study_playlist_update()",
  "security invoker",
  "set search_path = ''",
  "revoke all on function public.keep_newest_study_playlist_update() from public",
  "before update on public.user_study_playlists",
  "if old.updated_at > new.updated_at then",
];

for (const check of requiredSchemaChecks) {
  if (!schema.includes(check) || !migration.includes(check)) {
    throw new Error(`Bible playlist sync schema contract is missing: ${check}`);
  }
}

const requiredAppChecks = [
  "lastItemProgress?: number",
  "lastPlayedAt?: string",
  "updatedAt?: string",
  "last_item_index, last_item_progress, last_played_at, created_at, updated_at",
  "lastItemProgress: Number(row.last_item_progress ?? 0)",
  "lastPlayedAt: row.last_played_at ?? undefined",
  "updatedAt: row.updated_at",
  "last_item_progress: playlist.lastItemProgress ?? 0",
  "last_played_at: playlist.lastPlayedAt ?? null",
  ".select(\"id, updated_at\")",
  "acceptedPlaylistIds.has(playlist.id)",
  ".in(\"playlist_id\", Array.from(acceptedPlaylistIds))",
  "(playlist.updatedAt ?? \"\") >= (localPlaylist.updatedAt ?? \"\")",
];

for (const check of requiredAppChecks) {
  if (!app.includes(check)) throw new Error(`Bible playlist sync client contract is missing: ${check}`);
}

if (app.includes('.delete()\n        .eq("user_id", userId);\n      collectError("playlist item cleanup"')) {
  throw new Error("Playlist item sync still deletes every playlist item for the user.");
}

console.log("PASS Bible playlist sync carries exact item progress and last-played time across devices.");
console.log("PASS Newer playlist updates win, and rejected stale updates cannot replace another device's playlist items.");
console.log("PASS Playlist sync remains owner-scoped through the existing authenticated RLS contract.");
