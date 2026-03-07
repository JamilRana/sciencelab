import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";

const studentItems = [
  { label: "Dashboard", href: "/student-route/dashboard" },
  { label: "My Results", href: "/student-route/results" },
  { label: "Fees", href: "/student-route/fees" },
  { label: "Profile", href: "/student-route/profile" },
];

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
    <div className="min-h-screen bg-gray-50">
      <Sidebar items={studentItems} role="student" />
      <main className="lg:ml-64 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
