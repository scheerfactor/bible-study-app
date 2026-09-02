import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = await readFile(path.join(root, "supabase", "schema.sql"), "utf8");
const migration = await readFile(
  path.join(root, "supabase", "migrations", "20260823200401_secure_presentation_sessions_for_authenticated_owner.sql"),
  "utf8",
);
const actionMigration = await readFile(
  path.join(root, "supabase", "migrations", "20260827164153_authorize_presentation_actions_with_rpc.sql"),
  "utf8",
);
const app = await readFile(path.join(root, "src", "app", "page.tsx"), "utf8");

const requiredDatabaseClauses = [
  "revoke all on public.presentation_sessions from anon, authenticated",
  "revoke all on public.presentation_session_events from anon, authenticated",
  'create policy "Users can read their presentation sessions"',
  'create policy "Users can read their presentation events"',
  "(select auth.uid()) = presenter_user_id",
];

for (const source of [schema, migration]) {
  for (const clause of requiredDatabaseClauses) {
    if (!source.includes(clause)) {
      throw new Error(`Presentation security contract is missing: ${clause}`);
    }
  }
}

const requiredActionClauses = [
  "add column if not exists presenter_auth_session_id text",
  "create or replace function public.apply_presentation_session_action(",
  "security definer",
  "set search_path = ''",
  "auth.jwt() ->> 'session_id'",
  "for update",
  "v_session.presenter_user_id is distinct from v_user_id",
  "item ->> 'authSessionId' = v_auth_session_id",
  "Controller is not approved or is locked.",
  "revoke insert, update on public.presentation_sessions from authenticated",
  "revoke insert on public.presentation_session_events from authenticated",
  "revoke execute on function public.apply_presentation_session_action(text, text, jsonb, text, text) from public, anon",
  "grant execute on function public.apply_presentation_session_action(text, text, jsonb, text, text) to authenticated",
];

for (const source of [schema, actionMigration]) {
  for (const clause of requiredActionClauses) {
    if (!source.includes(clause)) {
      throw new Error(`Presentation action security contract is missing: ${clause}`);
    }
  }
}

function normalizedActionFunction(source) {
  const start = source.indexOf("create or replace function public.apply_presentation_session_action(");
  const end = source.indexOf("\n$$;", start);
  if (start < 0 || end < 0) throw new Error("Presentation action RPC definition could not be extracted.");
  return source.slice(start, end + 4).replace(/\s+/g, " ").trim();
}

if (normalizedActionFunction(schema) !== normalizedActionFunction(actionMigration)) {
  throw new Error("Presentation action RPC differs between schema.sql and its migration.");
}

const forbiddenActiveClauses = [
  'create policy "Presentation sessions are joinable by code"',
  'create policy "Presentation sessions can be controlled by code"',
  'create policy "Presentation events are readable"',
  "grant select, insert, update on public.presentation_sessions to anon",
  "grant select, insert on public.presentation_session_events to anon",
];

for (const clause of forbiddenActiveClauses) {
  if (schema.includes(clause) || actionMigration.includes(clause)) {
    throw new Error(`Presentation security contract contains unsafe active access: ${clause}`);
  }
}

const forbiddenDirectMutationClauses = [
  'create policy "Users can start their presentation sessions"',
  'create policy "Users can update their presentation sessions"',
  'create policy "Users can create their presentation events"',
  "grant select, insert, update on public.presentation_sessions to authenticated",
  "grant select, insert on public.presentation_session_events to authenticated",
];

for (const clause of forbiddenDirectMutationClauses) {
  if (schema.includes(clause) || actionMigration.includes(clause)) {
    throw new Error(`Presentation action security permits a direct mutation: ${clause}`);
  }
}

const requiredAppChecks = [
  "if (!supabase || !user?.id)",
  "if (supabase && user?.id)",
  'const unsignedBetaOwner = Boolean(remoteMode === "local"',
  "Use this same signed-in account on the presenter, projector, and controller devices.",
  "Signed-out presentations remain local to this browser.",
  '.rpc("apply_presentation_session_action"',
  'p_controller_id: view === "controller" ? controllerClientId : null',
  'goToRemoteSlide(index, "jump")',
  "The shared action was rejected by presentation security.",
];

for (const check of requiredAppChecks) {
  if (!app.includes(check)) {
    throw new Error(`Presentation UI security check is missing: ${check}`);
  }
}

if (/\.from\("presentation_sessions"\)[\s\S]{0,120}\.upsert\(/.test(app)) {
  throw new Error("Presentation UI still upserts shared session rows directly.");
}

if (/\.from\("presentation_session_events"\)[\s\S]{0,120}\.insert\(/.test(app)) {
  throw new Error("Presentation UI still inserts shared session events directly.");
}

console.log("PASS presentation database: anonymous session and event access is revoked.");
console.log("PASS presentation ownership: session and event policies require the signed-in presenter.");
console.log("PASS presentation actions: live mutations are atomic, auth-session-bound, and RPC-only.");
console.log("PASS presentation UI: shared control uses the secure RPC and local fallback remains available.");
