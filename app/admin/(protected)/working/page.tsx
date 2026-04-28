import { Hammer } from "lucide-react";
import { requireAdminUser } from "@/lib/admin";
import { getBuilders } from "@/lib/builders";
import { getIdeasByStatus } from "@/lib/ideas";
import { AdminIdeaCard } from "@/components/AdminIdeaCard";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function WorkingPage() {
  const user = await requireAdminUser();
  const [ideas, builders] = await Promise.all([getIdeasByStatus("working", user.id), getBuilders()]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Working On</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ideas with builders assigned and active work in progress.
          </p>
        </div>
        <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
          {ideas.length} in progress
        </span>
      </div>

      {ideas.length ? (
        <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ideas.map((idea) => (
            <AdminIdeaCard
              key={idea.id}
              idea={idea}
              builders={builders}
              mode="working"
              density="compact"
            />
          ))}
        </div>
      ) : (
        <Card className="rounded-xl border-border bg-card ring-0">
          <CardContent className="flex min-h-72 flex-col items-center justify-center gap-3 p-6 text-center">
            <Hammer className="size-8 text-muted-foreground" />
            <div>
              <h2 className="text-lg font-semibold">Nothing is being built yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Move an idea from This Week to start assigning builders.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
