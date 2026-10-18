import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FeesClient } from "./FeesClient";

export default async function FeesPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    redirect("/admin-route/dashboard");
  }

  return <FeesClient />;
}
