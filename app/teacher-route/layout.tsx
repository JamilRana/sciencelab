import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SessionProviderWrapper } from "@/components/providers/SessionProviderWrapper";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "TEACHER") {
    redirect("/login");
  }

  return (
    <SessionProviderWrapper>
      <AppShell role="TEACHER">
        {children}
      </AppShell>
    </SessionProviderWrapper>
  );
}
