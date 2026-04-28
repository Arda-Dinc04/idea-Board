import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { getActiveBoard, formatBoardRange } from "@/lib/boards";
import { IdeaSubmitForm } from "@/components/IdeaSubmitForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function Home() {
  const activeBoard = await getActiveBoard();

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <div className="ops-grid min-h-screen">
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex items-center justify-end gap-2">
            <ThemeToggle variant="ghost" />
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link href="/admin/login">
                Admin
                <ArrowRight />
              </Link>
            </Button>
          </header>

          <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
            <div className="space-y-4">
              <Badge variant="outline" className="rounded-full bg-card">
                {activeBoard ? (
                  <>
                    <CalendarDays />
                    {formatBoardRange(activeBoard)}
                  </>
                ) : (
                  "No active board"
                )}
              </Badge>
              <h1 className="max-w-xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
                Drop a build idea
              </h1>
              <p className="max-w-md text-base text-muted-foreground">
                Tell us what you want built this week. The team picks favorites and ships them
                live.
              </p>
            </div>

            <Card className="rounded-2xl border-border bg-card shadow-xl shadow-foreground/5 ring-0">
              <CardContent className="p-4 sm:p-6">
                {activeBoard ? (
                  <IdeaSubmitForm />
                ) : (
                  <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
                    <div className="rounded-full border border-border bg-muted p-3">
                      <CalendarDays className="size-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">No active idea board right now.</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Check back after an admin opens the next week.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}
