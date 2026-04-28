/**
 * Deletes all operational data (ideas, boards, builders, assignments, stars, completions).
 * Keeps public.admin_users so admin allowlisted emails remain for login.
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
  const entries = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    entries[trimmed.slice(0, index)] = trimmed.slice(index + 1).replace(/^"|"$/g, "");
  }
  return entries;
}

const env = loadEnvFile(".env.local");
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Delete every row from a table (PostgREST needs a condition that matches all rows). */
async function deleteAll(table) {
  const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw new Error(`${table}: ${error.message}`);
}

async function main() {
  console.log("Clearing idea_assignments, idea_completions, idea_stars, ideas, week_boards, builders…");
  await deleteAll("idea_assignments");
  await deleteAll("idea_completions");
  await deleteAll("idea_stars");
  await deleteAll("ideas");
  await deleteAll("week_boards");
  await deleteAll("builders");
  console.log("Done. Rows in admin_users are unchanged.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
