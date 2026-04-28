import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import type { WeekBoard } from "@/types/database";

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getCurrentWeekRange(referenceDate = new Date()) {
  const day = referenceDate.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(referenceDate);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(referenceDate.getDate() + mondayOffset);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    startsAt: toDateString(monday),
    endsAt: toDateString(sunday),
    title: `Week of ${monday.toLocaleDateString("en", {
      month: "short",
      day: "numeric",
    })}`,
  };
}

export async function ensureCurrentWeekBoard() {
  const serviceClient = createServiceSupabaseClient();

  if (!serviceClient) {
    return null;
  }

  const currentWeek = getCurrentWeekRange();
  const { data: activeBoard } = await serviceClient
    .from("week_boards")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  if (
    activeBoard?.starts_at === currentWeek.startsAt &&
    activeBoard?.ends_at === currentWeek.endsAt
  ) {
    return activeBoard;
  }

  const { data: existingBoard } = await serviceClient
    .from("week_boards")
    .select("*")
    .eq("starts_at", currentWeek.startsAt)
    .eq("ends_at", currentWeek.endsAt)
    .maybeSingle();

  await serviceClient.from("week_boards").update({ is_active: false }).eq("is_active", true);

  if (existingBoard) {
    const { data } = await serviceClient
      .from("week_boards")
      .update({ is_active: true, title: existingBoard.title || currentWeek.title })
      .eq("id", existingBoard.id)
      .select("*")
      .single();

    return data;
  }

  const { data } = await serviceClient
    .from("week_boards")
    .insert({
      title: currentWeek.title,
      starts_at: currentWeek.startsAt,
      ends_at: currentWeek.endsAt,
      is_active: true,
    })
    .select("*")
    .single();

  return data;
}

export async function getActiveBoard() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const ensuredBoard = await ensureCurrentWeekBoard();

  if (ensuredBoard) {
    return ensuredBoard;
  }

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("week_boards")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  return data;
}

export async function getWeekBoards() {
  if (!hasSupabaseEnv()) {
    return [] as WeekBoard[];
  }

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("week_boards")
    .select("*")
    .order("starts_at", { ascending: false });

  return data ?? [];
}

export async function getBoardById(boardId: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("week_boards")
    .select("*")
    .eq("id", boardId)
    .maybeSingle();

  return data;
}

export function formatBoardRange(board: Pick<WeekBoard, "starts_at" | "ends_at">) {
  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return `${formatter.format(new Date(`${board.starts_at}T00:00:00Z`))} - ${formatter.format(
    new Date(`${board.ends_at}T00:00:00Z`),
  )}`;
}
