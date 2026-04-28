"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { adminAddIdea, submitIdea } from "@/lib/actions";
import { CATEGORY_OPTIONS, DEFAULT_BUILDERS, MAX_IDEA_LENGTH, MIN_IDEA_LENGTH } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type IdeaSubmitFormProps = {
  mode?: "public" | "admin";
  onSubmitted?: () => void;
};

export function IdeaSubmitForm({ mode = "public", onSubmitted }: IdeaSubmitFormProps) {
  const router = useRouter();
  const [ideaText, setIdeaText] = useState("");
  const [displayName, setDisplayName] = useState(mode === "admin" ? "Admin" : "");
  const [category, setCategory] = useState<string>("Startup");
  const [isPending, startTransition] = useTransition();

  const charsRemaining = MAX_IDEA_LENGTH - ideaText.length;
  const canSubmit = useMemo(
    () => ideaText.trim().length >= MIN_IDEA_LENGTH && ideaText.length <= MAX_IDEA_LENGTH,
    [ideaText],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      toast.error(
        `Ideas need ${MIN_IDEA_LENGTH} to ${MAX_IDEA_LENGTH} characters.`,
      );
      return;
    }

    startTransition(async () => {
      const action = mode === "admin" ? adminAddIdea : submitIdea;
      const result = await action({
        ideaText,
        displayName,
        category,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(mode === "admin" ? "Idea added to this week." : "Idea dropped.");
      setIdeaText("");
      setDisplayName(mode === "admin" ? "Admin" : "");
      setCategory("Startup");
      onSubmitted?.();
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Textarea
          value={ideaText}
          onChange={(event) => setIdeaText(event.target.value)}
          placeholder="Drop the weird thing you keep thinking about — we’ll try to make it real."
          className="min-h-36 resize-none rounded-lg border-border bg-card text-base leading-7 shadow-sm md:text-sm"
          maxLength={MAX_IDEA_LENGTH}
          required
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Try to include: what it does, who uses it, and the weird/fun/useful hook. Min{" "}
            {MIN_IDEA_LENGTH} chars.
          </span>
          <span className={charsRemaining < 0 ? "text-destructive" : ""}>{charsRemaining}</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <Input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Name optional"
          list="common-submitters"
          className="h-11 rounded-lg bg-card"
        />
        <datalist id="common-submitters">
          {DEFAULT_BUILDERS.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-11 w-full rounded-lg bg-card">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" size="lg" className="h-11 w-full rounded-lg" disabled={isPending}>
        <Send />
        {isPending ? "Submitting" : "Submit idea"}
      </Button>
    </form>
  );
}
