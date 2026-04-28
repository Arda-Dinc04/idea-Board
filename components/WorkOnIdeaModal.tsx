"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hammer } from "lucide-react";
import { toast } from "sonner";
import { moveIdeaToWorking } from "@/lib/actions";
import type { IdeaWithMeta } from "@/lib/ideas";
import type { Builder } from "@/types/database";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BuilderPicker } from "@/components/BuilderPicker";

type WorkOnIdeaModalProps = {
  idea: IdeaWithMeta;
  builders: Builder[];
  triggerLabel?: string;
};

export function WorkOnIdeaModal({
  idea,
  builders,
  triggerLabel = "Work on this",
}: WorkOnIdeaModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleStartWork() {
    startTransition(async () => {
      const result = await moveIdeaToWorking(idea.id);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Idea moved to Working On.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Hammer />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign builders</DialogTitle>
          <DialogDescription>
            Pick the people building this idea, or add a new builder for future weeks.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border bg-muted/35 p-3 text-sm leading-6">{idea.idea_text}</div>
        <BuilderPicker ideaId={idea.id} builders={builders} assignedBuilders={idea.builders} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button type="button" onClick={handleStartWork} disabled={isPending}>
            {isPending ? "Saving" : "Start work"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
