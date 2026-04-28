import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { DEFAULT_BUILDERS } from "@/lib/constants";
import type { Builder } from "@/types/database";

export async function getBuilders() {
  if (!hasSupabaseEnv()) {
    return DEFAULT_BUILDERS.map((displayName) => ({
      id: displayName.toLowerCase(),
      display_name: displayName,
      normalized_name: displayName.toLowerCase(),
      created_at: new Date(0).toISOString(),
    })) satisfies Builder[];
  }

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("builders")
    .select("*")
    .order("display_name", { ascending: true });

  return data ?? [];
}
