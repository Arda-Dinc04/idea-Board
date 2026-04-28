"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, CheckCircle2, ClipboardList, History, LogOut, Sparkles } from "lucide-react";
import { logoutAdmin } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InviteAdminModal } from "@/components/InviteAdminModal";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { href: "/admin", label: "This Week", icon: ClipboardList },
  { href: "/admin/working", label: "Working On", icon: Archive },
  { href: "/admin/completed", label: "Completed", icon: CheckCircle2 },
  { href: "/admin/history", label: "History", icon: History },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-border bg-sidebar p-4 backdrop-blur lg:block">
        <div className="flex h-full flex-col">
          <Link
            href="/admin"
            className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40"
          >
            <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-5" />
            </div>
            <div className="text-base font-semibold tracking-tight">Weekly Idea Board</div>
            <p className="mt-1 break-all text-xs text-muted-foreground">{email}</p>
          </Link>

          <nav className="mt-5 grid gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-lg border border-transparent px-3 text-sm transition-colors",
                    active
                      ? "ring-active-nav border-transparent font-medium"
                      : "text-foreground hover:bg-muted",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className={cn(
                      "size-4",
                      active ? "text-accent-foreground" : "text-muted-foreground",
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto grid gap-2 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Theme
              </span>
              <ThemeToggle />
            </div>
            <InviteAdminModal />
            <form action={logoutAdmin}>
              <Button type="submit" variant="outline" className="w-full justify-start rounded-lg">
                <LogOut />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-border bg-background/92 backdrop-blur lg:hidden">
        <div className="flex flex-col gap-3 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Link href="/admin" className="text-sm font-semibold tracking-tight">
                Weekly Idea Board
              </Link>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <nav className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-sm">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Button
                    key={item.href}
                    asChild
                    variant={active ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 rounded-md",
                      active && "ring-active-nav border-transparent",
                    )}
                  >
                    <Link href={item.href}>
                      <Icon />
                      <span>{item.label}</span>
                    </Link>
                  </Button>
                );
              })}
            </nav>

            <InviteAdminModal />

            <form action={logoutAdmin}>
              <Button type="submit" variant="outline" size="icon-sm" aria-label="Sign out">
                <LogOut />
              </Button>
            </form>
          </div>
        </div>
      </header>
    </>
  );
}
