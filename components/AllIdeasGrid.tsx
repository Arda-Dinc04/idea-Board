import { Inbox } from "lucide-react";
import type { IdeaWithMeta } from "@/lib/ideas";
import type { Builder } from "@/types/database";
import { AdminIdeaCard } from "@/components/AdminIdeaCard";
import { Card, CardContent } from "@/components/ui/card";

type AllIdeasGridProps = {
  ideas: IdeaWithMeta[];
  builders: Builder[];
};

function sortStarredFirst(ideas: IdeaWithMeta[]) {
  return [...ideas].sort((a, b) => {
    if (a.star_count !== b.star_count) {
      return b.star_count - a.star_count;
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function AllIdeasGrid({ ideas, builders }: AllIdeasGridProps) {
  const sorted = sortStarredFirst(ideas);

  if (!sorted.length) {
    return (
      <Card className="rounded-xl border-border bg-card ring-0">
        <CardContent className="flex min-h-72 flex-col items-center justify-center gap-3 p-6 text-center">
          <Inbox className="size-8 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">No submitted ideas yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use Add idea or wait for the public page to collect the first one.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {sorted.map((idea) => (
        <AdminIdeaCard
          key={idea.id}
          idea={idea}
          builders={builders}
          mode="submitted"
          density="compact"
          showSubmitter
        />
      ))}
    </div>
  );
}
