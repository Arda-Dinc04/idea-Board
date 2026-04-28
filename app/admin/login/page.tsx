import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getAdminUser } from "@/lib/admin";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const admin = await getAdminUser();

  if (admin) {
    redirect("/admin");
  }

  return (
    <main className="ops-grid min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Button asChild variant="ghost" className="w-fit rounded-full">
            <Link href="/">
              <ArrowLeft />
              Public board
            </Link>
          </Button>
          <ThemeToggle variant="ghost" />
        </div>

        <Card className="rounded-2xl border-border bg-card shadow-xl shadow-foreground/5 ring-0">
          <CardHeader className="space-y-3">
            <Badge variant="secondary" className="w-fit rounded-full">
              <ShieldCheck />
              Admin only
            </Badge>
            <div>
              <CardTitle className="text-2xl">Sign in</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Pick a preset admin or use another allowlisted email, then enter the shared admin
                password.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasSupabaseEnv() ? (
              <Alert>
                <AlertTitle>Supabase env missing</AlertTitle>
                <AlertDescription>
                  Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable login.
                </AlertDescription>
              </Alert>
            ) : null}
            <AdminLoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
