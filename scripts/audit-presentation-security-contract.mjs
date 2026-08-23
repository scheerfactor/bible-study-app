import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = await readFile(path.join(root, "supabase", "schema.sql"), "utf8");
const migration = await readFile(
  path.join(root, "supabase", "migrations", "20260823200401_secure_presentation_sessions_for_authenticated_owner.sql"),
  "utf8",
);
const app = await readFile(path.join(root, "src", "app", "page.tsx"), "utf8");

const requiredDatabaseClauses = [
  "revoke all on public.presentation_sessions from anon, authenticated",
  "revoke all on public.presentation_session_events from anon, authenticated",
  "grant select, insert, update on public.presentation_sessions to authenticated",
  "grant select, insert on public.presentation_session_events to authenticated",
  'create policy "Users can read their presentation sessions"',
  'create policy "Users can start their presentation sessions"',
  'create policy "Users can update their presentation sessions"',
  'create policy "Users can read their presentation events"',
  'create policy "Users can create their presentation events"',
  "(select auth.uid()) = presenter_user_id",
  "created_by = (select auth.uid())",
];

for (const source of [schema, migration]) {
  for (const clause of requiredDatabaseClauses) {
    if (!source.includes(clause)) {
      throw new Error(`Presentation security contract is missing: ${clause}`);
    }
  }
}

const forbiddenActiveClauses = [
  'create policy "Presentation sessions are joinable by code"',
  'create policy "Presentation sessions can be controlled by code"',
  'create policy "Presentation events are readable"',
  "grant select, insert, update on public.presentation_sessions to anon",
  "grant select, insert on public.presentation_session_events to anon",
];

for (const clause of forbiddenActiveClauses) {
  if (schema.includes(clause) || migration.includes(clause)) {
    throw new Error(`Presentation security contract contains unsafe active access: ${clause}`);
  }
}

const requiredAppChecks = [
  "if (!supabase || !user?.id)",
  "if (supabase && user?.id)",
  'const unsignedBetaOwner = Boolean(remoteMode === "local"',
  "Use this same signed-in account on the presenter, projector, and controller devices.",
  "Signed-out presentations remain local to this browser.",
];

for (const check of requiredAppChecks) {
  if (!app.includes(check)) {
    throw new Error(`Presentation UI security check is missing: ${check}`);
  }
}

console.log("PASS presentation database: anonymous session and event access is revoked.");
console.log("PASS presentation ownership: session and event policies require the signed-in presenter.");
console.log("PASS presentation UI: shared control requires sign-in and local fallback remains available.");
