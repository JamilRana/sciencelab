import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role === "TEACHER") {
    redirect("/teacher-route/dashboard");
  }
  if (role === "STUDENT") {
    redirect("/student-route/dashboard");
  }
  redirect("/admin-route/dashboard");
}
