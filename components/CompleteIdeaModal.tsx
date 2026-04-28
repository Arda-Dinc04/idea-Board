"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { completeIdea } from "@/lib/actions";
import type { IdeaWithMeta } from "@/lib/ideas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CompleteIdeaModal({ idea }: { idea: IdeaWithMeta }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deploymentUrl, setDeploymentUrl] = useState(idea.completion?.deployment_url ?? "");
  const [githubUrl, setGithubUrl] = useState(idea.completion?.github_url ?? "");
  const [twitterUrl, setTwitterUrl] = useState(idea.completion?.twitter_url ?? "");
  const [notes, setNotes] = useState(idea.completion?.notes ?? "");
  const [isPending, startTransition] = useTransition();

  function handleComplete() {
    startTransition(async () => {
      const result = await completeIdea({
        ideaId: idea.id,
        deploymentUrl,
        githubUrl,
        twitterUrl,
        notes,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Idea marked completed.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <CheckCircle2 />
          Mark completed
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Completion details</DialogTitle>
          <DialogDescription>Add links now, or leave them empty and fill them in later.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={deploymentUrl}
            onChange={(event) => setDeploymentUrl(event.target.value)}
            placeholder="deployment_url"
            className="h-10 rounded-lg bg-card"
          />
          <Input
            value={githubUrl}
            onChange={(event) => setGithubUrl(event.target.value)}
            placeholder="github_url"
            className="h-10 rounded-lg bg-card"
          />
          <Input
            value={twitterUrl}
            onChange={(event) => setTwitterUrl(event.target.value)}
            placeholder="twitter_url"
            className="h-10 rounded-lg bg-card"
          />
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="notes"
            className="min-h-24 rounded-lg bg-card"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleComplete} disabled={isPending}>
            {isPending ? "Saving" : "Complete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
