import { AdminNav } from "@/components/AdminNav";
import { AdminRealtime } from "@/components/AdminRealtime";
import { requireAdminUser } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireAdminUser();

  return (
    <div className="min-h-screen bg-background">
      <AdminNav email={user.email ?? "admin"} />
      <AdminRealtime />
      <div className="lg:pl-72">{children}</div>
    </div>
  );
}
