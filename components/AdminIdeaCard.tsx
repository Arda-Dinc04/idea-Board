"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Code2,
  ExternalLink,
  RotateCcw,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { archiveIdea, deleteIdea, moveIdeaToSubmitted, toggleStar } from "@/lib/actions";
import type { IdeaWithMeta } from "@/lib/ideas";
import { formatIdeaDate } from "@/lib/format";
import type { Builder } from "@/types/database";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CompleteIdeaModal } from "@/components/CompleteIdeaModal";
import { WorkOnIdeaModal } from "@/components/WorkOnIdeaModal";

type AdminIdeaCardProps = {
  idea: IdeaWithMeta;
  builders: Builder[];
  mode?: "submitted" | "working" | "completed" | "history";
  density?: "comfortable" | "compact";
  showSubmitter?: boolean;
};

const STATUS_CLASS: Record<string, string> = {
  submitted: "badge-status-submitted",
  working: "badge-status-working",
  completed: "badge-status-completed",
  archived: "badge-status-archived",
};

export function AdminIdeaCard({
  idea,
  builders,
  mode = "submitted",
  density = "comfortable",
  showSubmitter = true,
}: AdminIdeaCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isCompact = density === "compact";
  const showDelete = mode === "submitted";

  function runAction(
    action: () => Promise<{ ok: true } | { ok: false; error: string }>,
    successMessage: string,
    onSuccess?: () => void,
  ) {
    startTransition(async () => {
      const result = await action();

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(successMessage);
      onSuccess?.();
      router.refresh();
    });
  }

  function handleConfirmDelete() {
    runAction(() => deleteIdea(idea.id), "Idea deleted.", () => setDeleteDialogOpen(false));
  }

  const previewSnippet =
    idea.idea_text.length > 160 ? `${idea.idea_text.slice(0, 160)}…` : idea.idea_text;

  return (
    <Card
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-sm ring-0 transition-shadow hover:shadow-md",
      )}
    >
      <CardContent className={cn("flex flex-col gap-3", isCompact ? "p-3" : "p-4 gap-4")}>
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => isCompact && setExpanded((prev) => !prev)}
            className={cn(
              "min-w-0 flex-1 text-left text-sm leading-6 text-foreground",
              isCompact && !expanded && "line-clamp-3",
              isCompact && "cursor-pointer",
              !isCompact && "cursor-default",
            )}
            aria-expanded={isCompact ? expanded : undefined}
          >
            {idea.idea_text}
          </button>
          <div className="flex shrink-0 items-start gap-1">
            {showDelete ? (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setDeleteDialogOpen(true);
                  }}
                  disabled={isPending}
                  className={cn(
                    "rounded-md p-1.5 text-destructive transition-colors",
                    "hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                  aria-label="Delete idea"
                >
                  <X className="size-4" strokeWidth={2.5} />
                </button>
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogContent className="rounded-xl sm:max-w-md" showCloseButton={false}>
                    <DialogHeader>
                      <DialogTitle>Delete this idea?</DialogTitle>
                      <DialogDescription className="space-y-2">
                        <span className="block">
                          Are you sure you want to delete this idea? This cannot be undone.
                        </span>
                        <span className="block rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-foreground">
                          {previewSnippet}
                        </span>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDeleteDialogOpen(false)}
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleConfirmDelete}
                        disabled={isPending}
                      >
                        {isPending ? "Deleting…" : "Delete"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : null}
            <Button
              type="button"
              variant={idea.current_admin_starred ? "default" : "outline"}
              size={isCompact ? "xs" : "sm"}
              className={cn(
                "rounded-full",
                idea.current_admin_starred && "badge-starred border-transparent",
              )}
              disabled={isPending || mode === "history"}
              onClick={() => runAction(() => toggleStar(idea.id), "Star updated.")}
              aria-label={idea.current_admin_starred ? "Unstar idea" : "Star idea"}
            >
              <Star className={idea.current_admin_starred ? "fill-current" : ""} />
              {idea.star_count}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {showSubmitter ? (
            <span className="inline-flex items-center gap-1">
              <UserRound className="size-3.5" />
              {idea.submitter_name}
            </span>
          ) : null}
          <span>{formatIdeaDate(idea.created_at)}</span>
          {idea.category ? (
            <Badge variant="secondary" className="rounded-full font-normal">
              {idea.category}
            </Badge>
          ) : null}
          <Badge
            variant="outline"
            className={cn("rounded-full border-transparent font-medium", STATUS_CLASS[idea.status])}
          >
            {idea.status}
          </Badge>
        </div>

        {idea.builders.length ? (
          <div className="flex flex-wrap gap-1.5">
            {idea.builders.map((builder) => (
              <Badge
                key={builder.id}
                variant="secondary"
                className="rounded-full border border-border/70 bg-secondary text-secondary-foreground"
              >
                {builder.display_name}
              </Badge>
            ))}
          </div>
        ) : null}

        {mode === "completed" ? (
          <div className="space-y-2 rounded-lg border border-border/70 bg-muted/40 p-3 text-sm">
            <div className="flex flex-wrap gap-3">
              {idea.completion?.deployment_url ? (
                <a
                  className="inline-flex items-center gap-1 text-sm font-medium text-accent-foreground underline-offset-4 hover:underline"
                  href={idea.completion.deployment_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="size-3.5" />
                  Deployment
                </a>
              ) : (
                <span className="text-muted-foreground">No link added yet.</span>
              )}
              {idea.completion?.github_url ? (
                <a
                  className="inline-flex items-center gap-1 text-sm font-medium text-accent-foreground underline-offset-4 hover:underline"
                  href={idea.completion.github_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Code2 className="size-3.5" />
                  GitHub
                </a>
              ) : null}
              {idea.completion?.twitter_url ? (
                <a
                  className="inline-flex items-center gap-1 text-sm font-medium text-accent-foreground underline-offset-4 hover:underline"
                  href={idea.completion.twitter_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Twitter/X
                </a>
              ) : null}
            </div>
            {idea.completion?.notes ? (
              <p className="text-sm text-muted-foreground">{idea.completion.notes}</p>
            ) : null}
            {idea.completion?.completed_at ? (
              <p className="text-xs text-muted-foreground">
                Completed {formatIdeaDate(idea.completion.completed_at)}
              </p>
            ) : null}
          </div>
        ) : null}

        {mode !== "history" && mode !== "completed" ? (
          <div className={cn("flex flex-wrap gap-2", isCompact && "gap-1.5")}>
            {mode === "submitted" ? <WorkOnIdeaModal idea={idea} builders={builders} /> : null}
            {mode === "working" ? (
              <>
                <WorkOnIdeaModal idea={idea} builders={builders} triggerLabel="Edit builders" />
                <CompleteIdeaModal idea={idea} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    runAction(() => moveIdeaToSubmitted(idea.id), "Moved back to submitted.")
                  }
                >
                  <RotateCcw />
                  Move back
                </Button>
              </>
            ) : null}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={() => runAction(() => archiveIdea(idea.id), "Idea archived.")}
            >
              <Archive />
              Archive
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
