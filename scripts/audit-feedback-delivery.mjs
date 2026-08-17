import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const categoriesPath = path.join(root, "src", "app", "feedback", "categories.json");
const schemaPath = path.join(root, "supabase", "schema.sql");

const categories = JSON.parse(await readFile(categoriesPath, "utf8"));
const schema = await readFile(schemaPath, "utf8");
const contractBlocks = [...schema.matchAll(
  /-- feedback-category-contract:start([\s\S]*?)-- feedback-category-contract:end/g,
)];

if (!Array.isArray(categories) || categories.length === 0 || categories.some((item) => typeof item !== "string")) {
  throw new Error("Feedback category source must be a non-empty string array.");
}

if (new Set(categories).size !== categories.length) {
  throw new Error("Feedback category source contains duplicates.");
}

if (contractBlocks.length !== 2) {
  throw new Error(`Expected two SQL feedback category contracts, found ${contractBlocks.length}.`);
}

for (const [index, match] of contractBlocks.entries()) {
  const sqlCategories = [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]);
  if (JSON.stringify(sqlCategories) !== JSON.stringify(categories)) {
    throw new Error(`SQL feedback category contract ${index + 1} does not match categories.json.`);
  }
}

for (const requiredSql of [
  "to anon, authenticated",
  "revoke all on public.beta_feedback from anon, authenticated",
  "grant insert on public.beta_feedback to anon, authenticated",
]) {
  if (!schema.includes(requiredSql)) {
    throw new Error(`Feedback schema is missing: ${requiredSql}`);
  }
}

console.log(`PASS feedback contract: ${categories.length} UI categories match table and RLS constraints.`);
console.log("PASS feedback grants: anonymous and authenticated roles are insert-only.");

if (!process.argv.includes("--live")) {
  console.log("INFO live delivery skipped; run npm run audit:feedback:live with Supabase audit credentials.");
  process.exit(0);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error("Live feedback audit requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.");
}

const probeId = randomUUID();
const anonymousClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error: insertError } = await anonymousClient.from("beta_feedback").insert({
  id: probeId,
  category: categories[0],
  message: `Automated feedback delivery audit ${probeId}`,
  passage_or_resource: "Launch readiness audit",
});

if (insertError) {
  throw new Error(`Anonymous feedback insert failed: ${insertError.message}`);
}

const { error: cleanupError } = await adminClient.from("beta_feedback").delete().eq("id", probeId);
if (cleanupError) {
  throw new Error(`Feedback probe was inserted but cleanup failed for ${probeId}: ${cleanupError.message}`);
}

const { count, error: verifyError } = await adminClient
  .from("beta_feedback")
  .select("id", { count: "exact", head: true })
  .eq("id", probeId);

if (verifyError) {
  throw new Error(`Feedback cleanup verification failed: ${verifyError.message}`);
}

if (count !== 0) {
  throw new Error(`Feedback cleanup verification found ${count} remaining probe rows.`);
}

console.log("PASS live feedback delivery: anonymous insert succeeded and the audit row was removed.");
