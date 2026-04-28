import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { PRESET_ADMIN_EMAILS } from "@/lib/admin-presets";

export function isAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  return (PRESET_ADMIN_EMAILS as readonly string[]).includes(email.trim().toLowerCase());
}

async function isCurrentSessionAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("is_admin");

  if (error) {
    return false;
  }

  return data === true;
}

export async function getAdminUser(): Promise<User | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const isAdmin = await isCurrentSessionAdmin();

  if (!isAdmin) {
    await supabase.auth.signOut();
    return null;
  }

  return user;
}

export async function requireAdminUser() {
  const user = await getAdminUser();

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}

export async function requireAdminClient() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: isAdmin, error } = user
    ? await supabase.rpc("is_admin")
    : { data: false, error: null };

  if (!user || error || !isAdmin) {
    if (user) {
      await supabase.auth.signOut();
    }

    throw new Error("Unauthorized admin action.");
  }

  return { supabase, user };
}
