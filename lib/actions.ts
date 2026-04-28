"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CATEGORY_OPTIONS } from "@/lib/constants";
import { requireAdminClient } from "@/lib/admin";
import { getActiveBoard, ensureCurrentWeekBoard } from "@/lib/boards";
import { cleanDisplayName, normalizeName } from "@/lib/normalize";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv, SUPABASE_ENV_ERROR } from "@/lib/supabase/config";

type IdeaInput = {
  ideaText: string;
  displayName?: string;
  category?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type CompleteIdeaInput = {
  ideaId: string;
  deploymentUrl?: string;
  githubUrl?: string;
  twitterUrl?: string;
  notes?: string;
};

type InviteAdminInput = {
  email: string;
  displayName?: string;
};

function ok<T extends object = Record<string, never>>(data?: T) {
  return { ok: true as const, ...(data ?? {}) };
}

function fail(error: string) {
  return { ok: false as const, error };
}

function cleanOptionalUrl(value?: string) {
  const cleaned = value?.trim();
  return cleaned && cleaned.length > 0 ? cleaned : null;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function displayNameFromEmail(email: string) {
  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function validateIdeaInput(input: IdeaInput):
  | {
      ok: true;
      ideaText: string;
      displayName: string;
      normalizedSubmitterName: string;
      category: string | null;
    }
  | { ok: false; error: string } {
  const ideaText = input.ideaText.trim();
  const displayName = cleanDisplayName(input.displayName);
  const category = input.category?.trim();

  if (ideaText.length < 100) {
    return { ok: false, error: "Ideas need at least 100 characters." };
  }

  if (ideaText.length > 1000) {
    return { ok: false, error: "Keep ideas to 1000 characters or less." };
  }

  if (category && !CATEGORY_OPTIONS.includes(category as (typeof CATEGORY_OPTIONS)[number])) {
    return { ok: false, error: "Choose a valid category." };
  }

  return {
    ok: true,
    ideaText,
    displayName,
    normalizedSubmitterName: normalizeName(displayName),
    category: category || null,
  };
}

export async function submitIdea(input: IdeaInput) {
  if (!hasSupabaseEnv()) {
    return fail(SUPABASE_ENV_ERROR);
  }

  const validated = validateIdeaInput(input);

  if (!validated.ok) {
    return fail(validated.error);
  }

  const activeBoard = await getActiveBoard();

  if (!activeBoard) {
    return fail("No active idea board right now.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("ideas").insert({
    board_id: activeBoard.id,
    idea_text: validated.ideaText,
    submitter_name: validated.displayName,
    normalized_submitter_name: validated.normalizedSubmitterName,
    category: validated.category,
  });

  if (error) {
    return fail(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return ok();
}

export async function adminAddIdea(input: IdeaInput) {
  try {
    const { supabase } = await requireAdminClient();
    const validated = validateIdeaInput({
      ...input,
      displayName: input.displayName?.trim() || "Admin",
    });

    if (!validated.ok) {
      return fail(validated.error);
    }

    const { data: activeBoard } = await supabase
      .from("week_boards")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();

    if (!activeBoard) {
      return fail("No active week board is available yet.");
    }

    const { error } = await supabase.from("ideas").insert({
      board_id: activeBoard.id,
      idea_text: validated.ideaText,
      submitter_name: validated.displayName,
      normalized_submitter_name: validated.normalizedSubmitterName,
      category: validated.category,
    });

    if (error) {
      return fail(error.message);
    }

    revalidatePath("/admin");
    return ok();
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to add idea.");
  }
}

export async function loginAdmin(input: LoginInput) {
  if (!hasSupabaseEnv()) {
    return fail(SUPABASE_ENV_ERROR);
  }

  const email = input.email.trim().toLowerCase();

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (error) {
    return fail(error.message);
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");

  if (adminError || !isAdmin) {
    await supabase.auth.signOut();
    return fail("That account is not on the admin allowlist.");
  }

  revalidatePath("/admin", "layout");
  return ok();
}

export async function inviteAdmin(input: InviteAdminInput) {
  try {
    const { supabase, user } = await requireAdminClient();
    const email = input.email.trim().toLowerCase();
    const displayName = input.displayName?.trim() || displayNameFromEmail(email);

    if (!isValidEmail(email)) {
      return fail("Enter a valid email address.");
    }

    const normalizedName = normalizeName(displayName);
    const serviceClient = createServiceSupabaseClient();
    const defaultPassword = process.env.ADMIN_INVITE_DEFAULT_PASSWORD?.trim();
    let message = "Admin added to the allowlist.";

    if (serviceClient && defaultPassword) {
      const { error: authError } = await serviceClient.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
        },
      });

      if (authError && !authError.message.toLowerCase().includes("already")) {
        return fail(authError.message);
      }

      message = "Admin account added. They can sign in with the shared admin password.";
    } else if (serviceClient) {
      const { error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
        data: {
          display_name: displayName,
        },
      });

      if (inviteError && !inviteError.message.toLowerCase().includes("already")) {
        return fail(inviteError.message);
      }

      message = "Admin added and Supabase invite email sent.";
    } else {
      message =
        "Admin added to the allowlist. Add SUPABASE_SERVICE_ROLE_KEY to create Auth users from the app.";
    }

    const { error: adminError } = await supabase.from("admin_users").upsert(
      {
        email,
        display_name: displayName,
        normalized_name: normalizedName,
        created_by: user.id,
      },
      { onConflict: "email" },
    );

    if (adminError) {
      return fail(adminError.message);
    }

    revalidatePath("/admin", "layout");
    return { ok: true as const, message };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to invite admin.");
  }
}

export async function logoutAdmin() {
  if (hasSupabaseEnv()) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }

  redirect("/admin/login");
}

export async function toggleStar(ideaId: string) {
  try {
    const { supabase, user } = await requireAdminClient();
    const { data: existing } = await supabase
      .from("idea_stars")
      .select("id")
      .eq("idea_id", ideaId)
      .eq("admin_user_id", user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("idea_stars").delete().eq("id", existing.id);

      if (error) {
        return fail(error.message);
      }
    } else {
      const { error } = await supabase.from("idea_stars").insert({
        idea_id: ideaId,
        admin_user_id: user.id,
      });

      if (error && error.code !== "23505") {
        return fail(error.message);
      }
    }

    revalidatePath("/admin", "layout");
    return ok();
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to update star.");
  }
}

export async function moveIdeaToWorking(ideaId: string) {
  try {
    const { supabase } = await requireAdminClient();
    const { error } = await supabase
      .from("ideas")
      .update({ status: "working" })
      .eq("id", ideaId);

    if (error) {
      return fail(error.message);
    }

    revalidatePath("/admin", "layout");
    return ok();
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to move idea.");
  }
}

export async function moveIdeaToSubmitted(ideaId: string) {
  try {
    const { supabase } = await requireAdminClient();
    const { error } = await supabase
      .from("ideas")
      .update({ status: "submitted" })
      .eq("id", ideaId);

    if (error) {
      return fail(error.message);
    }

    revalidatePath("/admin", "layout");
    return ok();
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to move idea.");
  }
}

export async function addBuilder(displayName: string) {
  try {
    const { supabase } = await requireAdminClient();
    const cleaned = displayName.trim();

    if (!cleaned) {
      return fail("Builder name is required.");
    }

    const normalized = normalizeName(cleaned);
    const { data: existing } = await supabase
      .from("builders")
      .select("*")
      .eq("normalized_name", normalized)
      .maybeSingle();

    if (existing) {
      return { ok: true as const, builder: existing };
    }

    const { data, error } = await supabase
      .from("builders")
      .insert({ display_name: cleaned, normalized_name: normalized })
      .select("*")
      .single();

    if (error) {
      return fail(error.message);
    }

    revalidatePath("/admin", "layout");
    return { ok: true as const, builder: data };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to add builder.");
  }
}

export async function assignBuilderToIdea(ideaId: string, builderId: string) {
  try {
    const { supabase } = await requireAdminClient();
    const { error } = await supabase.from("idea_assignments").upsert(
      {
        idea_id: ideaId,
        builder_id: builderId,
      },
      { onConflict: "idea_id,builder_id", ignoreDuplicates: true },
    );

    if (error && error.code !== "23505") {
      return fail(error.message);
    }

    revalidatePath("/admin", "layout");
    return ok();
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to assign builder.");
  }
}

export async function removeBuilderFromIdea(ideaId: string, builderId: string) {
  try {
    const { supabase } = await requireAdminClient();
    const { error } = await supabase
      .from("idea_assignments")
      .delete()
      .eq("idea_id", ideaId)
      .eq("builder_id", builderId);

    if (error) {
      return fail(error.message);
    }

    revalidatePath("/admin", "layout");
    return ok();
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to remove builder.");
  }
}

export async function completeIdea(input: CompleteIdeaInput) {
  try {
    const { supabase } = await requireAdminClient();
    const { error: completionError } = await supabase.from("idea_completions").upsert(
      {
        idea_id: input.ideaId,
        deployment_url: cleanOptionalUrl(input.deploymentUrl),
        github_url: cleanOptionalUrl(input.githubUrl),
        twitter_url: cleanOptionalUrl(input.twitterUrl),
        notes: input.notes?.trim() || null,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "idea_id" },
    );

    if (completionError) {
      return fail(completionError.message);
    }

    const { error: ideaError } = await supabase
      .from("ideas")
      .update({ status: "completed" })
      .eq("id", input.ideaId);

    if (ideaError) {
      return fail(ideaError.message);
    }

    revalidatePath("/admin", "layout");
    return ok();
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to complete idea.");
  }
}

export async function archiveIdea(ideaId: string) {
  try {
    const { supabase } = await requireAdminClient();
    const { error } = await supabase.from("ideas").update({ status: "archived" }).eq("id", ideaId);

    if (error) {
      return fail(error.message);
    }

    revalidatePath("/admin", "layout");
    return ok();
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to archive idea.");
  }
}

export async function createNewWeekBoard() {
  try {
    await requireAdminClient();
    await ensureCurrentWeekBoard();

    revalidatePath("/admin", "layout");
    revalidatePath("/");
    return ok();
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to refresh the active week.");
  }
}
