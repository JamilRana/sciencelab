import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SessionProviderWrapper } from "@/components/providers/SessionProviderWrapper";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "STUDENT") {
    redirect("/login");
  }

  return (
    <SessionProviderWrapper>
      <AppShell role="STUDENT">
        {children}
      </AppShell>
    </SessionProviderWrapper>
  );
}
