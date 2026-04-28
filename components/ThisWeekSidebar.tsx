"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Sparkles, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export type SidebarSubmitter = {
  key: string;
  label: string;
  count: number;
  starredCount: number;
};

type ThisWeekSidebarProps = {
  submitters: SidebarSubmitter[];
  totalIdeas: number;
  selectedKey?: string;
};

export function ThisWeekSidebar({ submitters, totalIdeas, selectedKey }: ThisWeekSidebarProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      return submitters;
    }

    return submitters.filter((submitter) => submitter.label.toLowerCase().includes(q));
  }, [submitters, query]);

  const isAllActive = !selectedKey;

  return (
    <aside className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <Users className="size-4 text-muted-foreground" />
          Submitters
          <Badge variant="secondary" className="rounded-full font-normal">
            {submitters.length}
          </Badge>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search submitters"
          className="h-10 rounded-lg border-border bg-card pl-9"
        />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        <Link
          href="/admin"
          className={cn(
            "flex items-center justify-between gap-2 rounded-lg border border-transparent px-3 py-2 text-sm transition-colors",
            isAllActive
              ? "ring-active-nav border-transparent font-medium"
              : "text-foreground hover:bg-muted",
          )}
        >
          <span className="inline-flex items-center gap-2">
            <Sparkles className={cn("size-4", isAllActive ? "text-accent-foreground" : "text-muted-foreground")} />
            All ideas
          </span>
          <Badge
            variant={isAllActive ? "default" : "secondary"}
            className={cn(
              "rounded-full font-normal",
              isAllActive && "bg-primary text-primary-foreground",
            )}
          >
            {totalIdeas}
          </Badge>
        </Link>

        {filtered.length ? (
          filtered.map((submitter) => {
            const active = selectedKey === submitter.key;

            return (
              <Link
                key={submitter.key}
                href={`/admin?submitter=${encodeURIComponent(submitter.key)}`}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border border-transparent px-3 py-2 text-sm transition-colors",
                  active
                    ? "ring-active-nav border-transparent font-medium"
                    : "text-foreground hover:bg-muted",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span className="inline-flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      active ? "bg-primary" : "bg-muted-foreground/40",
                    )}
                  />
                  <span className="truncate">{submitter.label}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5">
                  {submitter.starredCount > 0 ? (
                    <span className="inline-flex items-center gap-0.5 text-xs text-[color:var(--star)]">
                      <Star className="size-3 fill-current" />
                      {submitter.starredCount}
                    </span>
                  ) : null}
                  <Badge
                    variant={active ? "default" : "secondary"}
                    className={cn(
                      "rounded-full font-normal",
                      active && "bg-primary text-primary-foreground",
                    )}
                  >
                    {submitter.count}
                  </Badge>
                </span>
              </Link>
            );
          })
        ) : (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            No submitters match {`"${query}"`}.
          </p>
        )}
      </nav>
    </aside>
  );
}
