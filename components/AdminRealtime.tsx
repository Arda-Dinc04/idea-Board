"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

const REALTIME_TABLES = [
  "ideas",
  "idea_stars",
  "idea_assignments",
  "builders",
  "idea_completions",
] as const;

export function AdminRealtime() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();

    if (!supabase) {
      return;
    }

    let timeout: ReturnType<typeof setTimeout> | null = null;
    const channel = supabase.channel("admin-workflow-board");

    for (const table of REALTIME_TABLES) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        if (timeout) {
          clearTimeout(timeout);
        }

        timeout = setTimeout(() => router.refresh(), 250);
      });
    }

    channel.subscribe();

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }

      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
