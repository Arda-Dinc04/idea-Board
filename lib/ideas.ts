import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import type { Builder, Idea, IdeaCompletion } from "@/types/database";
import type { IdeaStatus } from "@/lib/constants";

export type IdeaWithMeta = Idea & {
  builders: Builder[];
  completion: IdeaCompletion | null;
  star_count: number;
  current_admin_starred: boolean;
};

type StarRow = {
  idea_id: string;
  admin_user_id: string;
};

type AssignmentRow = {
  idea_id: string;
  builders: Builder | null;
};

function byCreatedDesc<T extends { created_at: string }>(items: T[]) {
  return [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

async function hydrateIdeas(ideas: Idea[], currentAdminUserId?: string) {
  if (!ideas.length || !hasSupabaseEnv()) {
    return ideas.map((idea) => ({
      ...idea,
      builders: [],
      completion: null,
      star_count: 0,
      current_admin_starred: false,
    })) satisfies IdeaWithMeta[];
  }

  const supabase = await createServerSupabaseClient();
  const ideaIds = ideas.map((idea) => idea.id);

  const [{ data: starsData }, { data: assignmentsData }, { data: completionsData }] =
    await Promise.all([
      supabase.from("idea_stars").select("idea_id, admin_user_id").in("idea_id", ideaIds),
      supabase.from("idea_assignments").select("idea_id, builders(*)").in("idea_id", ideaIds),
      supabase.from("idea_completions").select("*").in("idea_id", ideaIds),
    ]);

  const stars = (starsData ?? []) as StarRow[];
  const assignments = (assignmentsData ?? []) as unknown as AssignmentRow[];
  const completions = (completionsData ?? []) as IdeaCompletion[];

  const starCount = new Map<string, number>();
  const starredByCurrentAdmin = new Set<string>();
  const buildersByIdea = new Map<string, Builder[]>();
  const completionsByIdea = new Map<string, IdeaCompletion>();

  for (const star of stars) {
    starCount.set(star.idea_id, (starCount.get(star.idea_id) ?? 0) + 1);

    if (currentAdminUserId && star.admin_user_id === currentAdminUserId) {
      starredByCurrentAdmin.add(star.idea_id);
    }
  }

  for (const assignment of assignments) {
    if (!assignment.builders) {
      continue;
    }

    const current = buildersByIdea.get(assignment.idea_id) ?? [];
    current.push(assignment.builders);
    buildersByIdea.set(assignment.idea_id, current);
  }

  for (const completion of completions) {
    completionsByIdea.set(completion.idea_id, completion);
  }

  return ideas.map((idea) => ({
    ...idea,
    builders: buildersByIdea.get(idea.id) ?? [],
    completion: completionsByIdea.get(idea.id) ?? null,
    star_count: starCount.get(idea.id) ?? 0,
    current_admin_starred: starredByCurrentAdmin.has(idea.id),
  })) satisfies IdeaWithMeta[];
}

export async function getIdeasForBoard(boardId: string, currentAdminUserId?: string) {
  if (!hasSupabaseEnv()) {
    return [] as IdeaWithMeta[];
  }

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("ideas")
    .select("*")
    .eq("board_id", boardId)
    .order("created_at", { ascending: false });

  return hydrateIdeas(data ?? [], currentAdminUserId);
}

export async function getIdeasByStatus(status: IdeaStatus, currentAdminUserId?: string) {
  if (!hasSupabaseEnv()) {
    return [] as IdeaWithMeta[];
  }

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("ideas")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  const hydrated = await hydrateIdeas(data ?? [], currentAdminUserId);

  if (status !== "completed") {
    return hydrated;
  }

  return [...hydrated].sort((a, b) => {
    const aTime = a.completion?.completed_at ?? a.updated_at;
    const bTime = b.completion?.completed_at ?? b.updated_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

export type SubmitterGroup = {
  key: string;
  label: string;
  ideas: IdeaWithMeta[];
  starredCount: number;
};

export function groupIdeasBySubmitter(ideas: IdeaWithMeta[]): SubmitterGroup[] {
  const groups = new Map<string, SubmitterGroup>();

  for (const idea of byCreatedDesc(ideas)) {
    const key = idea.normalized_submitter_name || idea.submitter_name.toLowerCase();
    const existing = groups.get(key);
    const group: SubmitterGroup =
      existing ?? { key, label: idea.submitter_name, ideas: [], starredCount: 0 };
    group.ideas.push(idea);
    if (idea.current_admin_starred || idea.star_count > 0) {
      group.starredCount += 1;
    }
    groups.set(key, group);
  }

  return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export function groupIdeasByStatus(ideas: IdeaWithMeta[]) {
  const order: IdeaStatus[] = ["submitted", "working", "completed", "archived"];

  return order.map((status) => ({
    status,
    ideas: ideas.filter((idea) => idea.status === status),
  }));
}
