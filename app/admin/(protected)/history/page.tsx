import Link from "next/link";
import { History } from "lucide-react";
import { requireAdminUser } from "@/lib/admin";
import { formatBoardRange, getBoardById, getWeekBoards } from "@/lib/boards";
import { getIdeasForBoard, groupIdeasByStatus } from "@/lib/ideas";
import { getBuilders } from "@/lib/builders";
import { AdminIdeaCard } from "@/components/AdminIdeaCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type HistoryPageProps = {
  searchParams: Promise<{ board?: string }>;
};

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const user = await requireAdminUser();
  const params = await searchParams;
  const [boards, builders] = await Promise.all([getWeekBoards(), getBuilders()]);
  const oldBoards = boards.filter((board) => !board.is_active);
  const selectedBoardId = params.board ?? oldBoards[0]?.id;
  const selectedBoard = selectedBoardId ? await getBoardById(selectedBoardId) : null;
  const ideas = selectedBoard ? await getIdeasForBoard(selectedBoard.id, user.id) : [];
  const groups = groupIdeasByStatus(ideas);

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-6">
      <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">History</h1>
          <p className="mt-1 text-sm text-muted-foreground">Old weekly boards and their ideas.</p>
        </div>

        <div className="rounded-xl border border-border bg-sidebar p-2 shadow-sm">
          {oldBoards.length ? (
            <ul className="space-y-1">
              {oldBoards.map((board) => {
                const active = board.id === selectedBoardId;

                return (
                  <li key={board.id}>
                    <Link
                      href={`/admin/history?board=${board.id}`}
                      className={cn(
                        "block rounded-lg border border-transparent px-3 py-2 text-sm transition-colors",
                        active
                          ? "ring-active-nav border-transparent font-medium"
                          : "text-foreground hover:bg-muted",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="block truncate font-medium">{board.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {formatBoardRange(board)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No old boards yet. Create a new week to move the current one into history.
            </p>
          )}
        </div>
      </aside>

      <section className="space-y-5">
        {selectedBoard ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">{selectedBoard.title}</h2>
                <p className="text-sm text-muted-foreground">{formatBoardRange(selectedBoard)}</p>
              </div>
              <Badge variant="outline" className="rounded-full">
                {ideas.length} ideas
              </Badge>
            </div>

            {groups.map((group) => (
              <section key={group.status} className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.status}
                </h3>
                {group.ideas.length ? (
                  <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {group.ideas.map((idea) => (
                      <AdminIdeaCard
                        key={idea.id}
                        idea={idea}
                        builders={builders}
                        mode="history"
                        density="compact"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-border/70 bg-card p-4 text-sm text-muted-foreground">
                    No {group.status} ideas.
                  </div>
                )}
              </section>
            ))}
          </>
        ) : (
          <Card className="rounded-xl border-border bg-card ring-0">
            <CardContent className="flex min-h-72 flex-col items-center justify-center gap-3 p-6 text-center">
              <History className="size-8 text-muted-foreground" />
              <div>
                <h2 className="text-lg font-semibold">No history yet</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Old week boards will appear after the next active board is created.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
