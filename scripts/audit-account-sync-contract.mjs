import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = await readFile(path.join(root, "supabase", "schema.sql"), "utf8");
const app = await readFile(path.join(root, "src", "app", "page.tsx"), "utf8");

const syncTables = [
  "user_notes",
  "user_highlights",
  "user_bookmarks",
  "user_library_progress",
  "user_completed_resources",
  "user_library_favorites",
  "user_listening_progress",
  "user_bible_listening_progress",
  "user_bible_mastery",
  "user_scripture_memory",
  "user_study_playlists",
  "user_study_playlist_items",
];

const policyActions = ["select", "insert", "update", "delete"];

for (const table of syncTables) {
  const tablePolicies = [...schema.matchAll(new RegExp(
    `create policy "[^"]+"\\s+on public\\.${table} for (select|insert|update|delete)\\s+to authenticated`,
    "g",
  ))].map((match) => match[1]);

  for (const action of policyActions) {
    if (!tablePolicies.includes(action)) {
      throw new Error(`${table} is missing an authenticated-only ${action.toUpperCase()} policy.`);
    }
  }

  const grant = `grant select, insert, update, delete on public.${table} to authenticated`;
  if (!schema.includes(grant)) {
    throw new Error(`${table} is missing its least-privilege authenticated CRUD grant.`);
  }

  if (schema.includes(`grant select, insert, update, delete on public.${table} to anon`)) {
    throw new Error(`${table} grants user-owned data access to anon.`);
  }

  const syncQuery = new RegExp(
    `from\\("${table}"\\)[\\s\\S]{0,420}?\\.eq\\("user_id", user\\.id\\)`,
  );
  if (!syncQuery.test(app)) {
    throw new Error(`${table} account hydration query is missing an explicit current-user filter.`);
  }
}

const clientIsolationContracts = [
  ["account-scoped storage key", "function accountStorageKey(userId: string)"],
  ["account cache hydration", "const accountSaved = loadAccountState(user.id)"],
  ["account cache persistence", "saveAccountState(user.id, mergedSaved)"],
  ["legacy anonymous note cache migration", "stored.notes.filter((note) => !isUuid(note.id))"],
  ["legacy anonymous highlight cache migration", "stored.highlights.filter((highlight) => !isUuid(highlight.id))"],
  ["legacy anonymous bookmark cache migration", "stored.bookmarks.filter((bookmark) => !isUuid(bookmark.id))"],
  ["anonymous cache cleanup after successful sync", "clearLocalState();"],
  ["signed-out anonymous state restoration", "if (!session?.user) setSaved(loadLocalState())"],
  ["safe post-auth destination", 'emailRedirectTo: `${window.location.origin}/?open=settings`'],
];

for (const [label, contract] of clientIsolationContracts) {
  if (!app.includes(contract)) {
    throw new Error(`Account sync client is missing its ${label} contract.`);
  }
}

if (app.includes("saveLocalState(mergedSaved)")) {
  throw new Error("Account hydration must not copy merged cloud records into anonymous device storage.");
}

console.log(`PASS account sync schema: ${syncTables.length} user-owned tables have authenticated-only CRUD policies and grants.`);
console.log(`PASS account sync client: ${syncTables.length} hydration queries filter by the current user ID.`);
console.log(`PASS account sync device isolation: signed-in records use account-scoped storage and sign-out restores anonymous data only.`);
