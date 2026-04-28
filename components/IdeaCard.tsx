import { Code2, ExternalLink, Star, UserRound } from "lucide-react";
import type { IdeaWithMeta } from "@/lib/ideas";
import { formatIdeaDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_CLASS: Record<string, string> = {
  submitted: "badge-status-submitted",
  working: "badge-status-working",
  completed: "badge-status-completed",
  archived: "badge-status-archived",
};

export function IdeaCard({ idea }: { idea: IdeaWithMeta }) {
  return (
    <Card className="rounded-xl border-border bg-card shadow-sm ring-0">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm leading-6 text-foreground">{idea.idea_text}</p>
          <Badge
            variant="outline"
            className={cn("rounded-full border-transparent font-medium", STATUS_CLASS[idea.status])}
          >
            {idea.status}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <UserRound className="size-3.5" />
            {idea.submitter_name}
          </span>
          <span>{formatIdeaDate(idea.created_at)}</span>
          <span className="inline-flex items-center gap-1 text-[color:var(--star)]">
            <Star className="size-3.5 fill-current" />
            {idea.star_count}
          </span>
          {idea.category ? (
            <Badge variant="secondary" className="rounded-full font-normal">
              {idea.category}
            </Badge>
          ) : null}
        </div>

        {idea.builders.length ? (
          <div className="flex flex-wrap gap-2">
            {idea.builders.map((builder) => (
              <Badge key={builder.id} variant="secondary" className="rounded-full">
                {builder.display_name}
              </Badge>
            ))}
          </div>
        ) : null}

        {idea.status === "completed" ? (
          <div className="flex flex-wrap gap-2 text-xs">
            {idea.completion?.deployment_url ? (
              <a
                href={idea.completion.deployment_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-accent-foreground underline-offset-4 hover:underline"
              >
                <ExternalLink className="size-3.5" />
                Deployment
              </a>
            ) : (
              <span className="text-muted-foreground">No link added yet.</span>
            )}
            {idea.completion?.github_url ? (
              <a
                href={idea.completion.github_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-accent-foreground underline-offset-4 hover:underline"
              >
                <Code2 className="size-3.5" />
                GitHub
              </a>
            ) : null}
            {idea.completion?.twitter_url ? (
              <a
                href={idea.completion.twitter_url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-accent-foreground underline-offset-4 hover:underline"
              >
                Twitter/X
              </a>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
