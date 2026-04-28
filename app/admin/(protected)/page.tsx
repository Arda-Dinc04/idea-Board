import { Inbox } from "lucide-react";
import { requireAdminUser } from "@/lib/admin";
import { getActiveBoard } from "@/lib/boards";
import { getBuilders } from "@/lib/builders";
import { getIdeasForBoard, groupIdeasBySubmitter } from "@/lib/ideas";
import { AllIdeasGrid } from "@/components/AllIdeasGrid";
import { ThisWeekSidebar, type SidebarSubmitter } from "@/components/ThisWeekSidebar";
import { UserIdeasGrid } from "@/components/UserIdeasGrid";
import { WeekBoardHeader } from "@/components/WeekBoardHeader";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type ThisWeekPageProps = {
  searchParams: Promise<{ submitter?: string }>;
};

export default async function AdminDashboardPage({ searchParams }: ThisWeekPageProps) {
  const [user, params] = await Promise.all([requireAdminUser(), searchParams]);
  const [activeBoard, builders] = await Promise.all([getActiveBoard(), getBuilders()]);
  const ideas = activeBoard ? await getIdeasForBoard(activeBoard.id, user.id) : [];
  const submittedIdeas = ideas.filter((idea) => idea.status === "submitted");
  const groups = groupIdeasBySubmitter(submittedIdeas);

  const submitters: SidebarSubmitter[] = groups.map((group) => ({
    key: group.key,
    label: group.label,
    count: group.ideas.length,
    starredCount: group.ideas.reduce(
      (sum, idea) => sum + (idea.star_count > 0 ? 1 : 0),
      0,
    ),
  }));

  const selectedKey = params.submitter;
  const selectedGroup = selectedKey
    ? groups.find((group) => group.key === selectedKey)
    : undefined;

  return (
    <main className="flex min-h-[calc(100vh-1rem)] flex-col">
      <WeekBoardHeader board={activeBoard} ideaCount={ideas.length} />

      <section className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-6">
        {!activeBoard ? (
          <Card className="rounded-xl border-border bg-card ring-0">
            <CardContent className="flex min-h-72 flex-col items-center justify-center gap-3 p-6 text-center">
              <Inbox className="size-8 text-muted-foreground" />
              <div>
                <h2 className="text-lg font-semibold">No weekly board is available yet</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  The app creates the current Monday-Sunday board automatically when Supabase service
                  access is configured.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)]">
              <div className="rounded-xl border border-border bg-sidebar p-3 shadow-sm">
                <ThisWeekSidebar
                  submitters={submitters}
                  totalIdeas={submittedIdeas.length}
                  selectedKey={selectedKey}
                />
              </div>
            </div>

            <div>
              {selectedGroup ? (
                <UserIdeasGrid
                  label={selectedGroup.label}
                  ideas={selectedGroup.ideas}
                  builders={builders}
                />
              ) : (
                <AllIdeasGrid ideas={submittedIdeas} builders={builders} />
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
