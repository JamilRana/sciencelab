import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SessionProviderWrapper } from "@/components/providers/SessionProviderWrapper";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  const role = session?.user?.role;

  if (!role || !["ADMIN", "STAFF"].includes(role)) {
    redirect("/login");
  }

  return (
    <SessionProviderWrapper>
      <AppShell role={role}>
        {children}
      </AppShell>
    </SessionProviderWrapper>
  );
}
