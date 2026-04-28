"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { addBuilder, assignBuilderToIdea, removeBuilderFromIdea } from "@/lib/actions";
import { DEFAULT_BUILDERS } from "@/lib/constants";
import type { Builder } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type BuilderPickerProps = {
  ideaId: string;
  builders: Builder[];
  assignedBuilders: Builder[];
};

export function BuilderPicker({ ideaId, builders, assignedBuilders }: BuilderPickerProps) {
  const [localBuilders, setLocalBuilders] = useState(builders);
  const [assignedIds, setAssignedIds] = useState(() => new Set(assignedBuilders.map((b) => b.id)));
  const [newBuilderName, setNewBuilderName] = useState("");
  const [isPending, startTransition] = useTransition();

  const sortedBuilders = useMemo(() => {
    const quick = new Map(DEFAULT_BUILDERS.map((name, index) => [name.toLowerCase(), index]));

    return [...localBuilders].sort((a, b) => {
      const aQuick = quick.get(a.normalized_name);
      const bQuick = quick.get(b.normalized_name);

      if (aQuick !== undefined || bQuick !== undefined) {
        return (aQuick ?? 999) - (bQuick ?? 999);
      }

      return a.display_name.localeCompare(b.display_name);
    });
  }, [localBuilders]);

  function toggleBuilder(builder: Builder) {
    const isAssigned = assignedIds.has(builder.id);

    startTransition(async () => {
      const result = isAssigned
        ? await removeBuilderFromIdea(ideaId, builder.id)
        : await assignBuilderToIdea(ideaId, builder.id);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setAssignedIds((current) => {
        const next = new Set(current);

        if (isAssigned) {
          next.delete(builder.id);
        } else {
          next.add(builder.id);
        }

        return next;
      });
    });
  }

  function handleAddBuilder() {
    startTransition(async () => {
      const result = await addBuilder(newBuilderName);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      await assignBuilderToIdea(ideaId, result.builder.id);
      setLocalBuilders((current) => {
        if (current.some((builder) => builder.id === result.builder.id)) {
          return current;
        }

        return [...current, result.builder];
      });
      setAssignedIds((current) => new Set(current).add(result.builder.id));
      setNewBuilderName("");
      toast.success(`${result.builder.display_name} assigned.`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {sortedBuilders.map((builder) => {
          const selected = assignedIds.has(builder.id);

          return (
            <Button
              key={builder.id}
              type="button"
              variant={selected ? "default" : "outline"}
              size="sm"
              disabled={isPending}
              onClick={() => toggleBuilder(builder)}
              className="rounded-full"
            >
              {builder.display_name}
              {selected ? <X /> : <Plus />}
            </Button>
          );
        })}
      </div>

      {assignedIds.size > 0 ? (
        <div className="flex flex-wrap gap-2">
          {sortedBuilders
            .filter((builder) => assignedIds.has(builder.id))
            .map((builder) => (
              <Badge key={builder.id} variant="secondary" className="rounded-full">
                {builder.display_name}
              </Badge>
            ))}
        </div>
      ) : null}

      <div className="flex gap-2">
        <Input
          value={newBuilderName}
          onChange={(event) => setNewBuilderName(event.target.value)}
          placeholder="Add other builder"
          className="h-10 rounded-lg bg-card"
        />
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-lg"
          disabled={isPending || !newBuilderName.trim()}
          onClick={handleAddBuilder}
        >
          <Plus />
          Add
        </Button>
      </div>
    </div>
  );
}
