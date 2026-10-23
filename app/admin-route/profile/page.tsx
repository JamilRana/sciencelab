import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileView } from "@/components/profile/ProfileView";

interface Props {
  searchParams?: Promise<{ userId?: string }> | { userId?: string };
}

export default async function AdminProfilePage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const requestedUserId = resolvedSearchParams?.userId
    ? parseInt(resolvedSearchParams.userId, 10)
    : null;

  const targetUserId =
    session.user.role === "ADMIN" && requestedUserId && !isNaN(requestedUserId)
      ? requestedUserId
      : parseInt(session.user.id, 10);

  return <ProfileView userId={targetUserId} />;
}
