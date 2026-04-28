import { CalendarDays } from "lucide-react";
import type { WeekBoard } from "@/types/database";
import { formatBoardRange } from "@/lib/boards";
import { Badge } from "@/components/ui/badge";
import { AddIdeaModal } from "@/components/AddIdeaModal";

type WeekBoardHeaderProps = {
  board: WeekBoard | null;
  ideaCount?: number;
};

export function WeekBoardHeader({ board, ideaCount = 0 }: WeekBoardHeaderProps) {
  return (
    <section className="border-b border-border bg-card/60 px-4 py-5 backdrop-blur lg:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full">
              <CalendarDays />
              Auto week
            </Badge>
            <span className="text-xs text-muted-foreground">{ideaCount} ideas on board</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {board?.title ?? "No active week"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {board ? formatBoardRange(board) : "The current week board will appear automatically."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">{board ? <AddIdeaModal /> : null}</div>
      </div>
    </section>
  );
}
