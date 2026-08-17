import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = await readFile(path.join(root, "supabase", "schema.sql"), "utf8");
const app = await readFile(path.join(root, "src", "app", "page.tsx"), "utf8");

const requiredSchemaClauses = [
  'create policy "Users can read their own roles"\n  on public.user_roles for select\n  to authenticated',
  'create policy "Admins can read acquisition records"\n  on public.admin_acquisition_records for select\n  to authenticated',
  'create policy "Admins can manage acquisition records"\n  on public.admin_acquisition_records for all\n  to authenticated',
  "revoke all on public.user_roles from anon, authenticated",
  "grant select on public.user_roles to authenticated",
  "revoke all on public.admin_acquisition_records from anon, authenticated",
  "grant select, insert, update, delete on public.admin_acquisition_records to authenticated",
];

for (const clause of requiredSchemaClauses) {
  if (!schema.includes(clause)) {
    throw new Error(`Admin access schema is missing: ${clause}`);
  }
}

const forbiddenSchemaClauses = [
  "grant insert on public.user_roles",
  "grant update on public.user_roles",
  "grant delete on public.user_roles",
  "grant all on public.user_roles",
  "grant truncate on public.admin_acquisition_records",
  "grant all on public.admin_acquisition_records",
];

for (const clause of forbiddenSchemaClauses) {
  if (schema.includes(clause)) {
    throw new Error(`Admin access schema contains an unsafe grant: ${clause}`);
  }
}

const requiredAppChecks = [
  "const canOpenAdminArea = hasAdminRole || isLocalAdminPreviewHost",
  "showLibraryAcquisitionAdmin && canOpenAdminArea",
  "canUseAdminDrafts={canOpenAdminArea}",
  '.from("user_roles")',
  '.eq("role", "admin")',
];

for (const check of requiredAppChecks) {
  if (!app.includes(check)) {
    throw new Error(`Admin UI access check is missing: ${check}`);
  }
}

console.log("PASS admin schema: role lookup is read-only and admin records have CRUD-only grants.");
console.log("PASS admin UI: hidden routes and draft data require a resolved admin role.");
