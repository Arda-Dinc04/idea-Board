import Link from "next/link";
import { ArrowLeft, Star, UserRound } from "lucide-react";
import type { IdeaWithMeta } from "@/lib/ideas";
import type { Builder } from "@/types/database";
import { AdminIdeaCard } from "@/components/AdminIdeaCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type UserIdeasGridProps = {
  label: string;
  ideas: IdeaWithMeta[];
  builders: Builder[];
};

export function UserIdeasGrid({ label, ideas, builders }: UserIdeasGridProps) {
  const totalStars = ideas.reduce((sum, idea) => sum + idea.star_count, 0);
  const sorted = [...ideas].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span
            className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent-foreground"
            aria-hidden
          >
            <UserRound className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{label}</h2>
            <p className="text-xs text-muted-foreground">
              {ideas.length} {ideas.length === 1 ? "idea" : "ideas"} this week
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {totalStars > 0 ? (
            <Badge variant="outline" className="badge-starred rounded-full border-transparent">
              <Star className="size-3 fill-current" />
              {totalStars} {totalStars === 1 ? "star" : "stars"}
            </Badge>
          ) : null}
          <Button asChild variant="outline" size="sm" className="rounded-md">
            <Link href="/admin">
              <ArrowLeft />
              All ideas
            </Link>
          </Button>
        </div>
      </div>

      {sorted.length ? (
        <div className="grid auto-rows-fr gap-3 lg:grid-cols-2">
          {sorted.map((idea) => (
            <AdminIdeaCard
              key={idea.id}
              idea={idea}
              builders={builders}
              mode="submitted"
              density="comfortable"
              showSubmitter={false}
            />
          ))}
        </div>
      ) : (
        <Card className="rounded-xl border-border bg-card ring-0">
          <CardContent className="flex min-h-48 flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="text-sm text-muted-foreground">No ideas from {label} yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
